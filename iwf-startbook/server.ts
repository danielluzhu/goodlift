// Static server for the start book site: bun server.ts
import { handleApi } from "./auth";
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

function buildCalendar(groups: Group[], params: URLSearchParams) {
  const sex = params.get("sex"), nation = params.get("nation")?.toUpperCase(), aOnly = params.get("a") === "1";
  const now = icsStamp(new Date());
  const events = groups.filter(g =>
    (!sex || g.sex === sex) &&
    (!aOnly || / A\b/.test(g.label)) &&
    (!nation || g.athletes.some(a => a.nation === nation)),
  ).map(g => {
    const start = toUTC(g.date, g.time);
    const end = new Date(start.getTime() + SESSION_HOURS * 3600e3);
    const mine = nation ? g.athletes.filter(a => a.nation === nation) : [];
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
  const name = ["IWF Worlds 2026", sex, nation, aOnly ? "A groups" : ""].filter(Boolean).join(" · ");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//IWF Start Book Viewer//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsText(name)}`,
    ...events.flat(),
    "END:VCALENDAR",
  ].map(fold).join("\r\n") + "\r\n";
}

// Athletes are identified by their start book lot number (unique across the competition)
const validLots = new Set<number>((await Bun.file(root + "data.json").json()).groups.flatMap((g: Group) => g.athletes.map(a => a.lot)));

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
          ...(download ? { "Content-Disposition": 'attachment; filename="iwf-worlds-2026.ics"' } : {}),
        },
      });
    }
    if (path.endsWith("/")) path += "index.html";
    if (path.includes("..")) return new Response("Bad request", { status: 400 });
    const file = Bun.file(root + path.slice(1));
    return (await file.exists()) ? new Response(file) : new Response("Not found", { status: 404 });
  },
});
console.log(`Start book running on http://localhost:${port}`);
