# IWF World Championships 2026 — Start Book viewer

A readable, searchable version of the official
[2026 IWF World Championships start book](https://iwf.sport/wp-content/uploads/downloads/2026/10/2026-IWF-WCH_START-BOOK.pdf)
(Ningbo, 27 Oct – 8 Nov 2026).

- `public/` — static site (schedule, athlete search, nations, world records)
- `public/data.json` — data extracted from the PDF
- `tools/startbook.txt` — `pdftotext -layout` output of the PDF
- `tools/parse.py` — regenerates the JSON: `python3 tools/parse.py tools/startbook.txt public/data.json`

- `/calendar.ics` — every session as a calendar event (UTC times); optional filters `sex=Women|Men`, `a=1` (A groups), `nation=USA`, `download=1`

Run: `bun server.ts` (port 4321, override with `PORT`).

Always-on hosting: `iwf-startbook.service` is installed as a systemd unit
(`sudo cp iwf-startbook.service /etc/systemd/system/ && sudo systemctl enable --now iwf-startbook`).
It restarts on crash and starts on boot. Logs: `journalctl -u iwf-startbook -f`.

Historic PRs: best total at any IWF event plus the category it was lifted in, from
[OpenWeightlifting](https://github.com/euanwm/OpenWeightlifting) `event_data/IWF`, matched by name.
Refresh: `python3 tools/add_prs.py <OpenWeightlifting checkout> public/data.json` (re-run after `parse.py`).
