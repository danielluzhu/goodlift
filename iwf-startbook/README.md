# IWF World Championships 2026 — Start Book viewer

A readable, searchable version of the official
[2026 IWF World Championships start book](https://iwf.sport/wp-content/uploads/downloads/2026/10/2026-IWF-WCH_START-BOOK.pdf)
(Ningbo, 27 Oct – 8 Nov 2026).

- `public/` — static site (schedule, athlete search, nations, world records)
- `public/data.json` — data extracted from the PDF
- `tools/startbook.txt` — `pdftotext -layout` output of the PDF
- `tools/parse.py` — regenerates the JSON: `python3 tools/parse.py tools/startbook.txt public/data.json`

- `/calendar.ics` — every session as a calendar event (UTC times); optional filters `sex=Women|Men`, `a=1` (A groups), `nation=USA`,
  `day=27.10.2026`, `cat=49` (weight class, use with `sex`), `session=<index into data.json groups, or a comma list>`, `lots=46,70` (sessions with
  these athletes, e.g. favorites; their names go in the titles), `download=1`. The site has download buttons per day, per session,
  for the schedule filters, and for your favorites.
- Record Watch tab: athletes whose entry total or historic PR (same or lighter class) is within 3% of a senior, junior (≤20) or
  youth (≤17) Total world record. Totals only — the start book has no snatch/C&J entries. Marked 🎯 across the site.

Run: `bun server.ts` (port 4321, override with `PORT`).

Always-on hosting: `iwf-startbook.service` is installed as a systemd unit
(`sudo cp iwf-startbook.service /etc/systemd/system/ && sudo systemctl enable --now iwf-startbook`).
It restarts on crash and starts on boot. Logs: `journalctl -u iwf-startbook -f`.

Historic PRs and career summaries come from [OpenWeightlifting](https://github.com/euanwm/OpenWeightlifting)
results, matched by name:
- PR: best total at any IWF event, plus the category it was lifted in
- Career: senior Olympics, World Championships and continental/regional championships & games (IWF data), and national
  senior championships for USA, GBR, AUS, FRA, NOR, IRL (the federations OpenWeightlifting covers). Placings are
  computed from totals (ties broken by bodyweight), so medals are total medals only.

Refresh: `python3 tools/enrich.py <OpenWeightlifting checkout> public/data.json` (re-run after `parse.py`).

Accounts & favorites: `auth.ts` adds username/password accounts (argon2 hashes, 30-day HttpOnly session cookie)
and per-user favorite athletes (keyed by lot number). Data lives in `data/app.sqlite` (git-ignored; back it up).
API: `GET /api/me`, `POST /api/signup|login|logout`, `PUT|DELETE /api/favorites/<lot>`.

Tickets tab: reads `public/tickets.json` (vendors, prices, seating zones, venue, hotels, sources; English with `*Zh` Chinese fields). Vendors are `{ "name", "url", "note" }`
and update `checked`; no restart needed. Only add channels named by the organisers or the IWF.

Results tab: `results.ts` polls the English Wikipedia page for each category ("2026 World Weightlifting Championships –
Women's 49 kg", etc.) every 5 minutes from `server.ts` (one API request for all 16), parses the Results table (attempts,
no lifts, lift ranks, totals, record markers, "Did not start" notes), matches each lifter to a start book lot by nation
and name (falling back to name only, since Wikipedia uses IOC codes like BHR where the start book has BRN) and writes
`public/results.json` (git-ignored). Run once by hand with `bun results.ts`. The page reloads it every 2 minutes and shows
events in progress, final results with podiums and records, a medal table (total medals, then snatch/C&J medals) and upcoming events.
Wikipedia is volunteer-edited, so results lag the arena and aren't official.
