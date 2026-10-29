// Static server for the start book site: bun server.ts
import { handleApi } from "./auth";
import { refreshResults } from "./results";
const root = new URL("./public/", import.meta.url).pathname;
const port = Number(process.env.PORT ?? 4321);

// Ningbo is UTC+8 year-round (no DST), so all times are converted to UTC for the calendar.
const UTC_OFFSET_HOURS = 8;
const SESSION_HOURS = 2;

type Athlete = { lot: number; name: string; nation: string; category: string; entry: number };
type Group = { sex: string; label: string; date: string; time: string; weighin: string; athletes: Athlete[] };

const toUTC = (date: string, time: string) => {
  const [d, m, y] = date.split(".").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh - UTC_OFFSET_HOURS, mm));
};
const icsStamp = (t: Date) => t.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
// RFC 5545: lines longer than 75 octets are folded
const fold = (line: string) => {
  const out: string[] = [];
  let cur = "";
  for (const ch of line) {
    if (new TextEncoder().encode(cur + ch).length > (out.length ? 74 : 75)) { out.push(cur); cur = ""; }
    cur += ch;
  }
  out.push(cur);
  return out.join("\r\n ");
};

// Filters: sex, a=1 (A groups), nation, day (dd.mm.yyyy), cat (e.g. 49 or +86, with sex), session (index into groups, or a comma list),
// lots=1,2,3 (sessions with these athletes, e.g. favorites). Named athletes (nation or lots) go in the event titles.
function calendarFilter(params: URLSearchParams) {
  const sex = params.get("sex"), nation = params.get("nation")?.toUpperCase(), aOnly = params.get("a") === "1";
  const day = params.get("day"), cat = params.get("cat"), session = params.get("session");
  const lots = params.has("lots") ? new Set(params.get("lots")!.split(",").filter(Boolean).map(Number)) : null;
  const cats = (g: Group) => [...g.label.matchAll(/(\+?\d+)kg/g)].map(m => m[1]);
  const named = (g: Group) => g.athletes.filter(a => a.nation === nation || lots?.has(a.lot));
  const keep = (g: Group, i: number) =>
    (session == null || session.split(",").includes(String(i))) &&
    (!sex || g.sex === sex) &&
    (!aOnly || / A\b/.test(g.label)) &&
    (!day || g.date === day) &&
    (!cat || cats(g).includes(cat)) &&
    (!nation || g.athletes.some(a => a.nation === nation)) &&
    (!lots || g.athletes.some(a => lots.has(a.lot)));
  const name = ["IWF Worlds 2026", sex, cat && `${cat}kg`, day, nation, lots && "favorites", aOnly ? "A groups" : ""].filter(Boolean).join(" · ");
  return { keep, named, name };
}
const fileName = (groups: Group[], params: URLSearchParams) => {
  const s = params.get("session"), g = s != null && !s.includes(",") ? groups[Number(s)] : null;
  const base = g ? `${g.sex} ${g.label} ${g.date}` : calendarFilter(params).name.replace(/^IWF Worlds 2026/, "");
  return ("iwf-worlds-2026 " + base).toLowerCase().replace(/\+/g, "plus").replace(/[^a-z0-9.]+/g, "-").replace(/-+$/, "") + ".ics";
};

function buildCalendar(groups: Group[], params: URLSearchParams) {
  const { keep, named, name } = calendarFilter(params);
  const now = icsStamp(new Date());
  const events = groups.filter(keep).map(g => {
    const start = toUTC(g.date, g.time);
    const end = new Date(start.getTime() + SESSION_HOURS * 3600e3);
    const mine = named(g);
    const title = `${g.sex} ${g.label}${mine.length ? ` (${mine.map(a => a.name).join(", ")})` : ""} · IWF Worlds`;
    const desc = [
      `2026 IWF World Championships, Ningbo`,
      `Start ${g.time} local (UTC+8) · Weigh-in ${g.weighin}`,
      ``,
      `Start list (lot · athlete · nation · entry total):`,
      ...g.athletes.map(a => `${a.lot} · ${a.name} · ${a.nation}${g.label.includes(",") ? ` · ${a.category}kg` : ""} · ${a.entry} kg`),
    ].join("\n");
    return [
      "BEGIN:VEVENT",
      `UID:iwf-wch-2026-${g.date}-${g.time.replace(":", "")}@startbook`,
      `DTSTAMP:${now}`,
      `DTSTART:${icsStamp(start)}`,
      `DTEND:${icsStamp(end)}`,
      `SUMMARY:${icsText(title)}`,
      `DESCRIPTION:${icsText(desc)}`,
      `LOCATION:${icsText("Ningbo, China")}`,
      "END:VEVENT",
    ];
  });
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//IWF Start Book Viewer//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsText(name)}`,
    ...events.flat(),
    "END:VCALENDAR",
  ].map(fold).join("\r\n") + "\r\n";
}

// Athletes are identified by their start book lot number (unique across the competition)
const validLots = new Set<number>((await Bun.file(root + "data.json").json()).groups.flatMap((g: Group) => g.athletes.map(a => a.lot)));

// Results: poll Wikipedia every 5 minutes (one API request for all 16 categories)
const RESULTS_EVERY_MIN = 5;
const pollResults = () => refreshResults()
  .then(r => r.changed && console.log(`Results updated: ${r.final} final, ${r.partial} in progress`))
  .catch(e => console.error("Results refresh failed:", e.message));
pollResults();
setInterval(pollResults, RESULTS_EVERY_MIN * 60e3);

// Text files go out gzipped (data.json is ~800 KB raw, ~10x smaller compressed), cached in memory until the file changes.
// Every static file revalidates by ETag, so a fresh deploy or results update is picked up without a stale copy in between.
const TEXT = /\.(html|js|css|json|svg|txt)$/;
const gzCache = new Map<string, { etag: string; body: Uint8Array }>();
async function serveStatic(req: Request, path: string, file: ReturnType<typeof Bun.file>) {
  const etag = `"${file.lastModified.toString(36)}-${file.size.toString(36)}"`;
  const headers: Record<string, string> = { "Cache-Control": "no-cache", ETag: etag, "Content-Type": file.type };
  if (req.headers.get("If-None-Match") === etag) return new Response(null, { status: 304, headers });
  if (!TEXT.test(path) || !/\bgzip\b/.test(req.headers.get("Accept-Encoding") ?? "")) return new Response(file, { headers });
  let hit = gzCache.get(path);
  if (hit?.etag !== etag) gzCache.set(path, hit = { etag, body: Bun.gzipSync(new Uint8Array(await file.arrayBuffer())) });
  return new Response(hit.body, { headers: { ...headers, "Content-Encoding": "gzip", Vary: "Accept-Encoding" } });
}

Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    let path = decodeURIComponent(url.pathname);
    const api = await handleApi(req, path, validLots);
    if (api) return api;
    if (path === "/calendar.ics") {
      const { groups } = await Bun.file(root + "data.json").json();
      const download = url.searchParams.get("download") === "1";
      return new Response(buildCalendar(groups, url.searchParams), {
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          ...(download ? { "Content-Disposition": `attachment; filename="${fileName(groups, url.searchParams)}"` } : {}),
        },
      });
    }
    if (path.endsWith("/")) path += "index.html";
    if (path.includes("..")) return new Response("Bad request", { status: 400 });
    const file = Bun.file(root + path.slice(1));
    if (!(await file.exists())) return new Response("Not found", { status: 404 });
    return serveStatic(req, path, file);
  },
});
console.log(`Start book running on http://localhost:${port}`);
