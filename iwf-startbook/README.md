# IWF World Championships 2026 — Start Book viewer

A readable, searchable version of the official
[2026 IWF World Championships start book](https://iwf.sport/wp-content/uploads/downloads/2026/10/2026-IWF-WCH_START-BOOK.pdf)
(Ningbo, 27 Oct – 8 Nov 2026).

- `public/` — static site (schedule, athlete search, nations, world records)
- `public/data.json` — data extracted from the PDF
- `tools/startbook.txt` — `pdftotext -layout` output of the PDF
- `tools/parse.py` — regenerates the JSON: `python3 tools/parse.py tools/startbook.txt public/data.json`

Run: `bun server.ts` (port 4321, override with `PORT`).
