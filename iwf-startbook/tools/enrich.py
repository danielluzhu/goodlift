"""Add historic PRs and career summaries to data.json from OpenWeightlifting results.

Source: https://github.com/euanwm/OpenWeightlifting (event_data/<federation>/*.csv)
Usage: python3 tools/enrich.py <OpenWeightlifting checkout> public/data.json
Re-run after tools/parse.py, which rewrites data.json without these fields.

Per athlete this adds
  pr:     best total at any IWF event + the category it was lifted in
  career: senior Olympics, World Championships and continental/regional championships & games (IWF data, all
          nations) and national senior championships (only where OpenWeightlifting has that federation's results).
          Each entry is {year, event, category, place}; place is the placing on total (null = no total).
"""
import csv, glob, json, re, sys, unicodedata, collections

owl, path = sys.argv[1], sys.argv[2]

def norm(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().upper()
    return " ".join(re.sub(r"[^A-Z ]", " ", s).split())

def num(v):
    try: return float(v or 0)
    except ValueError: return 0.0

OLY = re.compile(r"^[XVI]+ OLYMPIC GAMES$", re.I)
OLY_HOST = {"2000": "Sydney 2000", "2004": "Athens 2004", "2008": "Beijing 2008", "2012": "London 2012",
            "2016": "Rio 2016", "2021": "Tokyo 2020", "2024": "Paris 2024"}
NOT_SENIOR = re.compile(r"JUNIOR|YOUTH|U-?\d\d|UNDER|MASTER|UNIVERSIT|SCHOOL|TEST EVENT|QUAL|EXTRA|ONLINE|VIRTUAL|CADET", re.I)
WORLDS = re.compile(r"WORLD (WEIGHTLIFTING )?CHAMPIONSHIPS", re.I)
REGIONAL = re.compile(r"EUROPEAN|ASIAN|AFRICA|PAN[- ]?AM|OCEANIA|SOUTH[- ]AMERICAN|IBERO|COMMONWEALTH|MEDITERRANEAN|SEA GAMES|"
                      r"SOUTHEAST ASIAN|BOLIVAR|CENTRAL AMERICAN|CARIBBEAN|PACIFIC|ISLAMIC SOLIDARITY|ARAB|ARAFURA|NORDIC|BALKAN", re.I)

def classify_iwf(event):
    if OLY.match(event): return "olympics"
    if NOT_SENIOR.search(event): return None
    if WORLDS.search(event): return "worlds"
    if REGIONAL.search(event): return "regional"
    return None

# National senior championships, per OpenWeightlifting federation folder: (start book nation, event name pattern)
NATIONAL = {
    "US": ("USA", re.compile(r"^(?!.*(YOUTH|JUNIOR|MASTER|UNIVERSIT|UNDER|U25|SCHOOL|LAST CHANCE|ONLINE|VIRTUAL)).*NATIONAL CHAMPIONSHIPS", re.I)),
    "UK": ("GBR", re.compile(r"^(?!.*(UNIVERSIT|U20|U23|VIRTUAL|MASTER|AGE GROUP|JUNIOR|YOUTH)).*BRITISH (SENIORS?|WEIGHTLIFTING) (CHAMPIONSHIPS|OPEN)|BRITISH OPEN SENIORS", re.I)),
    "AUS": ("AUS", re.compile(r"^AUSTRALIAN (OPEN|CHAMPIONSHIPS|SENIOR & JUNIOR CHAMPIONSHIPS)", re.I)),
    "FFH": ("FRA", re.compile(r"CHAMPIONNAT DE FRANCE [EÉ]LITE(?! JEUNE)", re.I)),
    "NVF": ("NOR", re.compile(r"NORGESMESTERSKAP SENIOR", re.I)),
    "IRE": ("IRL", re.compile(r"NATIONAL SENIOR CHAMPIONSHIPS", re.I)),
}

def read_rows(fed):
    """Yield normalized rows (name, event, date, category, bodyweight, total) for one federation folder."""
    for f in glob.glob(f"{owl}/event_data/{fed}/*.csv"):
        for r in csv.DictReader(open(f, encoding="utf-8")):
            yield {"name": r.get("lifter_name") or r.get("lifter") or "", "event": (r.get("event") or r.get("meet") or "").strip(),
                   "date": r["date"], "category": r.get("category") or r.get("age_category") or r.get("gender") or "",
                   "bw": num(r.get("bodyweight") or r.get("body_weight_(kg)")), "total": num(r["total"])}

def place_rows(rows, key):
    """Placing on total within each competition group (higher total, then lower bodyweight)."""
    groups = collections.defaultdict(dict)
    for r in rows: groups[key(r)].setdefault(norm(r["name"]), r)  # one row per lifter per group
    for g in groups.values():
        ranked = sorted((r for r in g.values() if r["total"] > 0), key=lambda r: (-r["total"], r["bw"]))
        for i, r in enumerate(ranked): r["place"] = i + 1
        for r in g.values(): r.setdefault("place", None)
    return [r for g in groups.values() for r in g.values()]

def name_index(rows):
    idx = collections.defaultdict(list)
    for r in rows: idx[norm(r["name"])].append(r)
    return idx

def matcher(idx):
    toks = [(n, set(n.split())) for n in idx]
    def find(name):
        n = norm(name)
        if n in idx: return n
        # Names are sometimes shortened or reordered; accept one unambiguous token-subset match
        t = set(n.split())
        c = [m for m, s in toks if (t <= s or s <= t) and len(t & s) >= 2]
        return c[0] if len(c) == 1 else None
    return find

# Senior/open categories only; national results also list age groups in the same meet
AGE_GROUP = re.compile(r"UNDER|JUNIOR|YOUTH|MASTER|VETERAN|UNGDOM|\bU\d\d|\d+\s*-\s*\d+", re.I)

def cat_kg(c):
    """'Open Women's 86+kg' -> '+86', 'male - M >110' -> '+110'; None when the label has no bodyweight."""
    m = re.findall(r"([+>]?)\s*(\d+)\s*(\+?)", c)
    return ("+" if m[-1][0] or m[-1][2] else "") + m[-1][1] if m else None

# IWF results: PRs and international career
iwf = [r for r in read_rows("IWF")]
for r in iwf: r["sex"] = "Women" if "Women" in r["category"] else "Men"
iwf = place_rows(iwf, lambda r: (r["event"], r["date"], r["category"]))
iwf_idx = {sex: name_index(r for r in iwf if r["sex"] == sex) for sex in ("Women", "Men")}
iwf_find = {sex: matcher(i) for sex, i in iwf_idx.items()}

# National results, only for federations OpenWeightlifting covers
national = {}
for fed, (nation, pat) in NATIONAL.items():
    rows = [r for r in read_rows(fed) if pat.search(r["event"]) and r["name"] and not AGE_GROUP.search(r["category"])]
    rows = place_rows(rows, lambda r: (r["date"], r["category"]))
    idx = name_index(rows)
    national[nation] = (idx, matcher(idx))

def entry(r, event, category):
    return {"year": int(r["date"][:4]), "event": event, "category": category, "place": r["place"], "total": int(r["total"])}

d = json.load(open(path))
stats = collections.Counter()
for g in d["groups"]:
    for a in g["athletes"]:
        a.pop("pr", None); a.pop("career", None)
        career = {"olympics": [], "worlds": [], "regional": [], "national": []}
        key = iwf_find[g["sex"]](a["name"])
        if key:
            rows = iwf_idx[g["sex"]][key]
            best = max(rows, key=lambda r: r["total"])
            if best["total"] > 0:
                a["pr"] = {"total": int(best["total"]), "category": best["category"].split(" kg")[0], "date": best["date"], "event": best["event"]}
                stats["pr"] += 1
            for r in rows:
                kind = classify_iwf(r["event"])
                if not kind: continue
                ev = OLY_HOST.get(r["date"][:4], r["event"]) if kind == "olympics" else r["event"]
                career[kind].append(entry(r, ev, r["category"].split(" kg")[0]))
        if a["nation"] in national:
            idx, find = national[a["nation"]]
            k = find(a["name"])
            if k:
                stats["national"] += 1
                career["national"] = [entry(r, r["event"], cat_kg(r["category"])) for r in idx[k]]
        for v in career.values(): v.sort(key=lambda e: -e["year"])
        if any(career.values()): a["career"] = career; stats["career"] += 1
        stats["olympians"] += bool(career["olympics"])
json.dump(d, open(path, "w"), indent=1, ensure_ascii=False)
total = sum(len(g["athletes"]) for g in d["groups"])
print(f"{total} athletes: PR {stats['pr']}, career {stats['career']}, Olympians {stats['olympians']}, national results {stats['national']}")
