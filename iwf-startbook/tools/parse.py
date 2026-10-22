"""Parse pdftotext -layout output of the 2026 IWF WCH start book into JSON."""
import json, re, sys

src, dst = sys.argv[1], sys.argv[2]
text = open(src, encoding="utf-8").read()
pages = text.split("\f")

ATH = re.compile(r"^\s*(\d+)\s+(\d+)\s+(.+?)\s+(\d{2}\.\d{2}\.\d{4})\s+([A-Z]{3})\s+(\+?\d+)\s+(\d+)\s*$")
REC = re.compile(r"^\s*(?:(\+?\d+)\s*kg)?\s*(Snatch|C&J|Total)\s+(\d+)\s*kg\s+(.*?)\s*$")
REC_FULL = re.compile(r"^(.+?)\s+(\d{2}\.\d{2}\.\d{4})\s+([A-Z]{3})\s+(\d{2}\.\d{2}\.\d{4})\s+(.+)$")

groups, records = [], {}
for p in pages:
    m = re.search(r"START LIST (Women|Men) (.+)", p)
    if m:
        sex = m.group(1)
        label = m.group(2).strip()
        st = re.search(r"Competition start:\s*(\S+)\s+(\S+)", p)
        wi = re.search(r"Weigh-in start:\s*(\S+)", p)
        athletes = []
        for line in p.splitlines():
            a = ATH.match(line)
            if a:
                athletes.append(dict(no=int(a[1]), lot=int(a[2]), name=a[3].strip(), dob=a[4],
                                     nation=a[5], category=a[6], entry=int(a[7])))
        groups.append(dict(sex=sex, label=label, date=st[1], time=st[2], weighin=wi[1], athletes=athletes))
        continue
    m = re.search(r"((?:JUNIOR |YOUTH )?)(WOMEN|MEN)'S WORLD RECORDS", p)
    if m:
        age = (m.group(1).strip() or "SENIOR").title()
        sex = "Women" if m.group(2) == "WOMEN" else "Men"
        rows, cat = [], None
        for line in p.splitlines():
            r = REC.match(line)
            if not r:
                continue
            if r[1]:
                cat = r[1]
            rest = r[4]
            row = dict(category=cat, lift=r[2], result=int(r[3]))
            f = REC_FULL.match(rest)
            if f:
                row.update(holder=f[1].strip(), dob=f[2], nation=f[3], date=f[4], place=f[5].strip())
            else:
                row.update(holder=None)  # World Standard
            rows.append(row)
        # The category label is printed on the C&J line; apply it to each Snatch/C&J/Total triple
        for i in range(0, len(rows), 3):
            for r in rows[i:i + 3]:
                r["category"] = rows[i + 1]["category"]
        records.setdefault(sex, {})[age] = rows

# Combined statistics (nation / women / men / total) — columns align reliably here
nations = {}
in_comb = False
for p in pages:
    if "COMBINED STATISTICS" in p or (in_comb and "NATION    WOMEN" in p):
        in_comb = True
        for line in p.splitlines():
            m = re.match(r"^\s*\d+\s+([A-Z]{3})\s+(.*)$", line)
            if not m:
                continue
            nums = m[2]
            # women column ends ~ col 30, men ~ col 39 in the original line
            off = line.index(m[1]) + 3
            seg = line[off:]
            vals = [(mm.start(), int(mm.group())) for mm in re.finditer(r"\d+", seg)]
            if not vals: continue
            total = vals[-1][1]
            w = mn = 0
            if len(vals) == 3:
                w, mn = vals[0][1], vals[1][1]
            elif len(vals) == 2:
                # decide by position: women column is closer to the nation code
                if vals[0][0] < 14: w = vals[0][1]
                else: mn = vals[0][1]
            nations[m[1]] = dict(women=w, men=mn, total=total)
    elif in_comb and "WORLD RECORDS" in p:
        break

for g in groups:
    g["athletes"].sort(key=lambda a: a["no"])
json.dump(dict(groups=groups, records=records, nations=nations), open(dst, "w"), indent=1)
print(len(groups), "groups,", sum(len(g["athletes"]) for g in groups), "athletes,",
      len(nations), "nations,", sum(n["total"] for n in nations.values()), "nation total")
