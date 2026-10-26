"""Add each athlete's best IWF-event total to data.json.

Source: OpenWeightlifting IWF results (https://github.com/euanwm/OpenWeightlifting, event_data/IWF/*.csv).
Usage: python3 tools/add_prs.py <OpenWeightlifting checkout> public/data.json
Re-run after tools/parse.py, which rewrites data.json without PRs.
"""
import csv, glob, json, re, sys, unicodedata, collections

owl, path = sys.argv[1], sys.argv[2]

def norm(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().upper()
    return " ".join(re.sub(r"[^A-Z ]", " ", s).split())

best = {}
for f in glob.glob(owl + "/event_data/IWF/*.csv"):
    for r in csv.DictReader(open(f, encoding="utf-8")):
        try: t = float(r["total"] or 0)
        except ValueError: continue
        sex = "Women" if "Women" in r["category"] else "Men"
        k = (sex, norm(r["lifter_name"]))
        if t > 0 and (k not in best or t > best[k][0]): best[k] = (t, r)

tokens = collections.defaultdict(list)
for sex, n in best: tokens[sex].append((n, set(n.split())))

def lookup(sex, name):
    n = norm(name)
    if (sex, n) in best: return best[(sex, n)]
    # Start book names are sometimes shortened or reordered; accept one unambiguous token-subset match
    toks = set(n.split())
    cands = [m for m, s in tokens[sex] if (toks <= s or s <= toks) and len(toks & s) >= 2]
    return best[(sex, cands[0])] if len(cands) == 1 else None

d = json.load(open(path))
found = 0
for g in d["groups"]:
    for a in g["athletes"]:
        hit = lookup(g["sex"], a["name"])
        a.pop("pr", None)
        if hit:
            t, r = hit
            found += 1
            a["pr"] = {"total": int(t), "category": r["category"].split(" kg")[0], "date": r["date"], "event": r["event"].strip()}
json.dump(d, open(path, "w"), indent=1, ensure_ascii=False)
print(f"PRs found for {found} of {sum(len(g['athletes']) for g in d['groups'])} athletes")
