// Results: polled from the English Wikipedia page for each category, whose results table editors fill in after each
// event. One API request fetches all 16 pages. Run once with `bun results.ts`, or let server.ts poll it.
const root = new URL("./public/", import.meta.url).pathname;
const OUT = root + "results.json";
const API = "https://en.wikipedia.org/w/api.php";
const UA = "iwf-startbook/1.0 (unofficial start book viewer; results polling every few minutes)";
const PREFIX = "2026 World Weightlifting Championships – ";

type Athlete = { lot: number; name: string; nation: string; category: string };
type Group = { sex: string; athletes: Athlete[] };
type Attempt = { kg: number; good: boolean } | null;
type Row = {
  rank: number | null; name: string; nation: string; lot: number | null; group: string;
  sn: Attempt[]; snRank: number | null; cj: Attempt[]; cjRank: number | null;
  total: number | null; out: boolean; records: { sn: string[]; cj: string[]; total: string[] }; note: string;
};

const pageTitle = (sex: string, cat: string) => `${PREFIX}${sex === "Women" ? "Women's" : "Men's"} ${cat} kg`;

// Wikitext helpers. Medal templates stand in for ranks 1–3.
const MEDAL: Record<string, number> = { gold1: 1, silver2: 2, bronze3: 3 };
const plain = (s: string) => s.replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1").replace(/'''?/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
function rankOf(cell: string) {
  const m = cell.match(/\{\{(gold1|silver2|bronze3)\}\}/);
  if (m) return MEDAL[m[1]];
  const n = parseInt(plain(cell));
  return Number.isFinite(n) ? n : null;
}
// Record markers follow the weight after a <br />, e.g. '''132<br />[[List of junior world records…|JWR]]'''
const recordsOf = (cell: string) => {
  const after = cell.split(/<br\s*\/?>/i).slice(1).join(" ");
  return [...after.matchAll(/\[\[[^\]|]*\|([^\]]+)\]\]|\b([A-Z]{1,4})\b/g)].map(m => m[1] || m[2]);
};
function attemptOf(cell: string): Attempt {
  const kg = parseInt(cell.replace(/<br\s*\/?>.*/is, "").replace(/<\/?s>|'''?/g, ""));
  if (!Number.isFinite(kg)) return null; // blank or — (not taken)
  return { kg, good: !/<s>/.test(cell) };
}
const totalOf = (cell: string) => { const n = parseInt(cell.replace(/<br\s*\/?>.*/is, "").replace(/'''?/g, "")); return Number.isFinite(n) ? n : null; };

export function parseTable(text: string) {
  const sec = text.split(/^==\s*Results\s*==\s*$/m)[1];
  if (!sec) return [];
  const table = sec.slice(0, sec.indexOf("\n|}"));
  const rows: Row[] = [];
  let carry: { note: string; left: number } | null = null; // a "Did not start" cell spanning several rows
  for (const raw of table.split(/\n\|-[^\n]*/).slice(1)) {
    const line = raw.trim();
    if (!line.startsWith("|") || !line.includes("flagathlete")) continue;
    const cells = line.slice(1).split("||").map(c => c.trim());
    const ath = cells[1].match(/\{\{flagathlete\|(.*)\|([A-Z]{3})\}\}/);
    if (!ath) continue;
    const row: Row = { rank: rankOf(cells[0]), name: plain(ath[1]), nation: ath[2], lot: null, group: plain(cells[2] ?? ""),
      sn: [], snRank: null, cj: [], cjRank: null, total: null, out: false, records: { sn: [], cj: [], total: [] }, note: "" };
    const span = cells.slice(3).find(c => /colspan\s*=/.test(c));
    if (span) {
      row.note = plain(span.slice(span.lastIndexOf("|") + 1));
      const rs = span.match(/rowspan\s*=\s*"?(\d+)/);
      carry = rs && +rs[1] > 1 ? { note: row.note, left: +rs[1] - 1 } : null;
    } else if (cells.length <= 3 && carry) {
      row.note = carry.note;
      if (--carry.left === 0) carry = null;
    } else {
      const c = cells.slice(3);
      row.sn = c.slice(0, 3).map(attemptOf);
      row.snRank = rankOf(c[3] ?? "");
      row.cj = c.slice(4, 7).map(attemptOf);
      row.cjRank = rankOf(c[7] ?? "");
      row.total = totalOf(c[8] ?? "");
      row.out = row.total == null && /^(—|–|-|DNF|NM)$/.test(plain(c[8] ?? "")); // no total: bombed out
      row.records = { sn: c.slice(0, 3).flatMap(recordsOf), cj: c.slice(4, 7).flatMap(recordsOf), total: recordsOf(c[8] ?? "") };
    }
    rows.push(row);
  }
  return rows;
}

// Match Wikipedia names ("Pang Un-chol") to start book names ("PANG Un Chol") within the same category and nation.
// Wikipedia uses IOC codes (BHR) where the start book has IWF ones (BRN), so a strong name match in any nation also counts.
const tokens = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\(.*?\)/g, "").split(/[^a-z]+/).filter(Boolean);
function matchLot(row: Row, pool: Athlete[]) {
  const same = pool.filter(a => a.nation === row.nation);
  if (same.length === 1) return same[0].lot;
  const want = tokens(row.name);
  const score = (a: Athlete) => { const have = tokens(a.name); return want.filter(t => have.includes(t)).length; };
  const best = (list: Athlete[]) => list.reduce<[Athlete | null, number]>((m, a) => score(a) > m[1] ? [a, score(a)] : m, [null, 0]);
  const [a] = best(same);
  if (a) return a.lot;
  const [b, t] = best(pool);
  return b && t >= 2 ? b.lot : null;
}

const hasResult = (r: Row) => r.total != null || r.out || r.rank != null || r.sn.some(Boolean) || r.cj.some(Boolean);

export async function refreshResults() {
  const { groups } = await Bun.file(root + "data.json").json() as { groups: Group[] };
  const cats = new Map<string, { sex: string; cat: string; pool: Athlete[] }>();
  for (const g of groups) for (const a of g.athletes) {
    const key = g.sex + "|" + a.category;
    (cats.get(key) ?? cats.set(key, { sex: g.sex, cat: a.category, pool: [] }).get(key)!).pool.push(a);
  }
  const titles = [...cats.values()].map(c => pageTitle(c.sex, c.cat));
  const url = `${API}?${new URLSearchParams({ action: "query", prop: "revisions", rvprop: "content|timestamp", rvslots: "main", titles: titles.join("|"), format: "json", formatversion: "2" })}`;
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30e3) });
  if (!res.ok) throw new Error(`Wikipedia API ${res.status}`);
  const pages: any[] = (await res.json()).query.pages;
  const byTitle = new Map(pages.map(p => [p.title, p]));

  const events = [...cats.values()].map(c => {
    const title = pageTitle(c.sex, c.cat), page = byTitle.get(title), rev = page?.revisions?.[0];
    const rows = rev ? parseTable(rev.slots.main.content) : [];
    for (const r of rows) r.lot = matchLot(r, c.pool);
    const done = rows.filter(hasResult).length;
    // Final once every lifter has a total, a rank or a note (e.g. "Did not start")
    const status = !done ? "upcoming" : rows.every(r => r.total != null || r.out || r.note) ? "final" : "partial";
    return { sex: c.sex, cat: c.cat, title, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
      revised: rev?.timestamp ?? null, status, rows: status === "upcoming" ? [] : rows };
  });

  const prev = await Bun.file(OUT).json().catch(() => null);
  const changed = JSON.stringify(prev?.events) !== JSON.stringify(events);
  const out = { checked: new Date().toISOString(), updated: changed ? new Date().toISOString() : prev.updated, source: "Wikipedia", events };
  await Bun.write(OUT, JSON.stringify(out));
  return { changed, final: events.filter(e => e.status === "final").length, partial: events.filter(e => e.status === "partial").length };
}

if (import.meta.main) console.log(await refreshResults());
