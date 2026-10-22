const NATIONS = {
  AFG: "Afghanistan", ALB: "Albania", ARM: "Armenia", AUS: "Australia", AUT: "Austria", AZE: "Azerbaijan",
  BAN: "Bangladesh", BEL: "Belgium", BIH: "Bosnia & Herzegovina", BLR: "Belarus", BOT: "Botswana", BRA: "Brazil",
  BRN: "Bahrain", BUL: "Bulgaria", CAN: "Canada", CHI: "Chile", CHN: "China", CMR: "Cameroon", COL: "Colombia",
  CRO: "Croatia", CUB: "Cuba", CZE: "Czechia", DEN: "Denmark", DOM: "Dominican Republic", ECU: "Ecuador",
  EGY: "Egypt", ESP: "Spain", FIJ: "Fiji", FIN: "Finland", FRA: "France", GBR: "Great Britain", GEO: "Georgia",
  GER: "Germany", GHA: "Ghana", GRE: "Greece", HKG: "Hong Kong, China", HUN: "Hungary", INA: "Indonesia",
  IND: "India", IRI: "Iran", IRL: "Ireland", IRQ: "Iraq", ISL: "Iceland", ISR: "Israel", ISV: "US Virgin Islands",
  ITA: "Italy", JAM: "Jamaica", JOR: "Jordan", JPN: "Japan", KAZ: "Kazakhstan", KEN: "Kenya", KOR: "Korea",
  KOS: "Kosovo", KSA: "Saudi Arabia", KUW: "Kuwait", LAT: "Latvia", LTU: "Lithuania", LUX: "Luxembourg",
  MAD: "Madagascar", MAR: "Morocco", MAS: "Malaysia", MDA: "Moldova", MEX: "Mexico", MGL: "Mongolia",
  NCA: "Nicaragua", NED: "Netherlands", NMI: "Northern Mariana Islands", NOR: "Norway", NRU: "Nauru",
  NZL: "New Zealand", PER: "Peru", PHI: "Philippines", PNG: "Papua New Guinea", POL: "Poland", POR: "Portugal",
  PRK: "DPR Korea", PUR: "Puerto Rico", QAT: "Qatar", ROU: "Romania", RUS: "Russia", SGP: "Singapore",
  SLE: "Sierra Leone", SRB: "Serbia", SRI: "Sri Lanka", SVK: "Slovakia", SWE: "Sweden", TGA: "Tonga",
  THA: "Thailand", TKM: "Turkmenistan", TPE: "Chinese Taipei", TUR: "Türkiye", UAE: "United Arab Emirates",
  UKR: "Ukraine", USA: "United States", UZB: "Uzbekistan", VAN: "Vanuatu", VEN: "Venezuela", VIE: "Vietnam",
  WRT: "Weightlifting Refugee Team",
};
const natName = c => NATIONS[c] || c;
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const parseDate = s => { const [d, m, y] = s.split(".").map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const dayLabel = s => { const d = parseDate(s); return `${DOW[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]}`; };
const shortDate = s => { const d = parseDate(s); return `${d.getUTCDate()} ${MON[d.getUTCMonth()]}`; };

let D, athletes = [], senior = {};
const state = { sex: "all", aOnly: false, hlNat: "", sort: { key: "when", asc: true }, recSex: "Women", recAge: "Senior", nation: "" };

fetch("data.json").then(r => r.json()).then(init);

function init(data) {
  D = data;
  for (const sex of ["Women", "Men"])
    for (const r of D.records[sex].Senior) (senior[sex + r.category] ||= {})[r.lift] = r;

  D.groups.forEach((g, gi) => {
    g.id = gi;
    g.parts = [...g.label.matchAll(/(\+?\d+)kg ([A-D])/g)].map(m => ({ cat: m[1], grp: m[2] }));
    g.sortKey = parseDate(g.date).getTime() + g.time;
    for (const a of g.athletes) {
      const grp = g.parts.find(p => p.cat === a.category)?.grp || g.parts[0].grp;
      athletes.push({ ...a, sex: g.sex, group: grp, gid: gi, date: g.date, time: g.time,
        age: 2026 - +a.dob.slice(6), when: g.sortKey, cat: parseInt(a.category) + (a.category.startsWith("+") ? 1000 : 0) });
    }
  });

  const nats = Object.keys(D.nations).sort();
  const opts = nats.map(c => `<option value="${c}">${c} · ${esc(natName(c))}</option>`).join("");
  $("#schedNation").insertAdjacentHTML("beforeend", opts);
  $("#fNat").insertAdjacentHTML("beforeend", opts);
  const catSorted = ["Women", "Men"].flatMap(s => [...new Set(athletes.filter(a => a.sex === s).map(a => a.category))]
    .sort((x, y) => parseInt(x) + (x[0] === "+" ? 999 : 0) - parseInt(y) - (y[0] === "+" ? 999 : 0)).map(c => [s, c]));
  $("#fCat").insertAdjacentHTML("beforeend", catSorted.map(([s, c]) => `<option value="${s}|${c}">${s} ${c} kg</option>`).join(""));

  const w = athletes.filter(a => a.sex === "Women").length;
  $("#kpis").innerHTML = [
    [athletes.length, "athletes"], [nats.length, "nations"], [w, "women"], [athletes.length - w, "men"],
    [D.groups.length, "sessions"], [new Set(D.groups.map(g => g.date)).size, "days"],
  ].map(([n, l]) => `<div class="kpi"><b>${n}</b><span>${l}</span></div>`).join("");

  bind();
  renderSchedule(); renderAthletes(); renderNations(); renderRecords();
  route();
}

function bind() {
  addEventListener("hashchange", route);
  document.querySelectorAll(".seg [data-sex]").forEach(b => b.onclick = () => {
    state.sex = b.dataset.sex; segOn(b); renderSchedule();
  });
  $("#aOnly").onchange = e => { state.aOnly = e.target.checked; renderSchedule(); };
  $("#schedNation").onchange = e => { state.hlNat = e.target.value; renderSchedule(true); };
  ["#q", "#fSex", "#fCat", "#fNat"].forEach(s => $(s).addEventListener("input", renderAthletes));
  document.querySelectorAll("#athTable th[data-sort]").forEach(th => th.onclick = () => {
    const k = th.dataset.sort;
    state.sort = { key: k, asc: state.sort.key === k ? !state.sort.asc : k !== "entry" };
    renderAthletes();
  });
  $("#nq").oninput = renderNations;
  for (const id of ["recSex", "recAge"]) $("#" + id).querySelectorAll("button").forEach(b => b.onclick = () => {
    state[id] = b.dataset.v; segOn(b); renderRecords();
  });
  document.addEventListener("click", e => {
    const n = e.target.closest("[data-nat]");
    if (n) { e.preventDefault(); state.nation = n.dataset.nat; location.hash = "#nations"; renderNations(); renderNationDetail(); }
  });
}
const segOn = b => { b.parentElement.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); };

function route() {
  const tab = (location.hash.slice(1) || "schedule");
  const valid = ["schedule", "athletes", "nations", "records"].includes(tab) ? tab : "schedule";
  document.querySelectorAll("main > section").forEach(s => s.hidden = s.id !== "view-" + valid);
  document.querySelectorAll(".tabs a").forEach(a => a.classList.toggle("on", a.dataset.tab === valid));
  if (valid === "nations") { renderNationDetail(); if (state.nation) $("#nationDetail").scrollIntoView({ block: "start" }); }
}

const natTag = c => `<button class="nat" data-nat="${c}" title="${esc(natName(c))}">${c}</button>`;

// Ningbo is UTC+8 with no DST; Google Calendar links take UTC times and show them in the viewer's zone
const SESSION_HOURS = 2;
function sessionUTC(g) {
  const [d, m, y] = g.date.split(".").map(Number), [hh, mm] = g.time.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh - 8, mm));
}
const gcalStamp = t => t.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
function gcalLink(g) {
  const start = sessionUTC(g), end = new Date(start.getTime() + SESSION_HOURS * 3600e3);
  const details = [`Start ${g.time} local (UTC+8) · Weigh-in ${g.weighin}`, "",
    ...g.athletes.map(a => `${a.lot} · ${a.name} · ${a.nation} · ${a.entry} kg`)].join("\n");
  const q = new URLSearchParams({ action: "TEMPLATE", text: `${g.sex} ${g.label} · IWF Worlds`,
    dates: `${gcalStamp(start)}/${gcalStamp(end)}`, details, location: "Ningbo, China" });
  return `https://calendar.google.com/calendar/render?${q}`;
}
const yourTime = g => sessionUTC(g).toLocaleString([], { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZoneName: "short" });

function updateCalBox(count) {
  const q = new URLSearchParams({ download: "1" });
  if (state.sex !== "all") q.set("sex", state.sex);
  if (state.aOnly) q.set("a", "1");
  if (state.hlNat) q.set("nation", state.hlNat);
  $("#calDownload").href = `calendar.ics?${q}`;
  const parts = [state.sex !== "all" ? state.sex.toLowerCase() + "'s" : "", state.aOnly ? "A-group" : ""].filter(Boolean).join(" ");
  $("#calSummary").innerHTML = `<b>${[count, parts].filter(Boolean).join(" ")} session${count === 1 ? "" : "s"}</b>${state.hlNat ? ` with ${esc(natName(state.hlNat))} athletes (their names go in the event titles)` : ""} will be added.`;
}

function startList(g) {
  const max = Math.max(...g.athletes.map(a => a.entry));
  const rows = g.athletes.map(a => {
    const wr = senior[g.sex + a.category]?.Total;
    const atWR = wr && a.entry >= wr.result;
    return `<tr class="${state.hlNat && a.nation === state.hlNat ? "hl" : ""}">
      <td class="num">${a.lot}</td>
      <td class="name">${esc(a.name)}</td>
      <td>${natTag(a.nation)}<span class="natname">${esc(natName(a.nation))}</span></td>
      ${g.parts.length > 1 ? `<td>${a.category} kg</td>` : ""}
      <td class="num">${2026 - +a.dob.slice(6)}</td>
      <td class="num"><span class="bar"><i style="width:${(a.entry / max * 100).toFixed(1)}%"></i></span><b>${a.entry}</b>${atWR ? `<span class="wrhint" title="Entry total at or above the senior world record (${wr.result} kg)">WR</span>` : ""}</td>
    </tr>`;
  }).join("");
  const recs = g.parts.map(p => {
    const r = senior[g.sex + p.cat];
    if (!r) return "";
    const fmt = l => `${l === "C&J" ? "C&amp;J" : l} <b>${r[l].result}</b>`;
    return `<span>Senior WR ${g.parts.length > 1 ? p.cat + " kg: " : ""}${["Snatch", "C&J", "Total"].map(fmt).join(" · ")}</span>`;
  }).join("");
  return `<div class="session-cal"><a class="btn" href="${esc(gcalLink(g))}" target="_blank" rel="noopener">📅 Add to Google Calendar</a>
      <span class="meta">Your time: ${esc(yourTime(g))}</span></div>
    <div class="rec-strip">${recs}</div>
    <div class="table-scroll"><table class="data">
      <thead><tr><th class="num">Lot</th><th>Athlete</th><th>Nation</th>${g.parts.length > 1 ? "<th>Cat.</th>" : ""}<th class="num">Age</th><th class="num">Entry total</th></tr></thead>
      <tbody>${rows}</tbody></table></div>`;
}

function renderSchedule(keepOpen) {
  const open = keepOpen ? new Set([...document.querySelectorAll(".session[open]")].map(d => d.dataset.id)) : new Set();
  const gs = D.groups.filter(g => (state.sex === "all" || g.sex === state.sex) && (!state.aOnly || g.parts.some(p => p.grp === "A")));
  updateCalBox(state.hlNat ? gs.filter(g => g.athletes.some(a => a.nation === state.hlNat)).length : gs.length);
  const days = {};
  for (const g of gs) (days[g.date] ||= []).push(g);
  const dayKeys = Object.keys(D.groups.reduce((o, g) => (o[g.date] = 1, o), {}));
  $("#days").innerHTML = dayKeys.filter(d => days[d]).map(d => {
    const n = dayKeys.indexOf(d) + 1;
    const items = days[d].map(g => {
      const hits = state.hlNat ? g.athletes.filter(a => a.nation === state.hlNat).length : 0;
      const isOpen = open.has(String(g.id)) || (state.hlNat && hits);
      const wi = g.weighin;
      const cats = g.parts.map(p => `${p.cat} kg <span class="grp ${p.grp}">${p.grp}</span>`).join(" &nbsp;");
      const top = g.athletes.reduce((m, a) => a.entry > m.entry ? a : m);
      return `<details class="session" data-id="${g.id}" ${isOpen ? "open" : ""}>
        <summary>
          <div class="time">${g.time}<small>weigh-in ${wi}</small></div>
          <div><div class="title"><span class="sex ${g.sex}">${g.sex}</span>${cats}</div>
            <div class="meta">Top entry: ${esc(top.name)} (${top.nation}) · ${top.entry} kg</div></div>
          <div class="count">${g.athletes.length} athletes${hits ? `<br><span class="flagged">${hits} × ${state.hlNat}</span>` : ""}</div>
        </summary>
        <div class="session-body">${isOpen ? startList(g) : ""}</div>
      </details>`;
    }).join("");
    return `<div class="day"><h2>Day ${n} <small>${dayLabel(d)}</small></h2><div class="sessions">${items}</div></div>`;
  }).join("") || `<p class="hint">No sessions match.</p>`;
  document.querySelectorAll(".session").forEach(el => el.addEventListener("toggle", () => {
    const body = el.querySelector(".session-body");
    if (el.open && !body.innerHTML.trim()) body.innerHTML = startList(D.groups[+el.dataset.id]);
  }));
}

function renderAthletes() {
  const q = $("#q").value.trim().toLowerCase();
  const sex = $("#fSex").value, cat = $("#fCat").value, nat = $("#fNat").value;
  const list = athletes.filter(a =>
    (!q || a.name.toLowerCase().includes(q) || a.nation.toLowerCase() === q || natName(a.nation).toLowerCase().includes(q)) &&
    (!sex || a.sex === sex) && (!cat || `${a.sex}|${a.category}` === cat) && (!nat || a.nation === nat));
  const { key, asc } = state.sort;
  list.sort((a, b) => {
    const x = a[key], y = b[key];
    const c = typeof x === "number" ? x - y : String(x).localeCompare(String(y));
    return (asc ? c : -c) || a.when - b.when || b.entry - a.entry;
  });
  document.querySelectorAll("#athTable th").forEach(th => {
    th.classList.toggle("sorted", th.dataset.sort === key);
    th.classList.toggle("asc", th.dataset.sort === key && asc);
  });
  $("#athCount").textContent = `${list.length} of ${athletes.length} athletes. Click a column to sort.`;
  $("#athTable tbody").innerHTML = list.map(a => `<tr>
    <td class="name">${esc(a.name)}</td>
    <td>${natTag(a.nation)}</td>
    <td>${a.sex === "Women" ? "W" : "M"} ${a.category} kg</td>
    <td><span class="grp ${a.group}">${a.group}</span></td>
    <td>${shortDate(a.date)} · ${a.time}</td>
    <td class="num">${a.age}</td>
    <td class="num"><b>${a.entry}</b></td>
  </tr>`).join("");
}

function renderNations() {
  const q = $("#nq").value.trim().toLowerCase();
  const list = Object.entries(D.nations)
    .filter(([c]) => !q || c.toLowerCase().includes(q) || natName(c).toLowerCase().includes(q))
    .sort((a, b) => b[1].total - a[1].total || a[0].localeCompare(b[0]));
  $("#nationGrid").innerHTML = list.map(([c, n]) => `<button class="ncard ${state.nation === c ? "on" : ""}" data-nat="${c}">
    <b>${c}</b><span class="nm">${esc(natName(c))}</span>
    <div class="split" title="${n.women} women, ${n.men} men">
      <span class="w" style="width:${n.women / 16 * 100}%"></span><span class="m" style="width:${n.men / 16 * 100}%"></span></div>
    <div class="nums">${n.total} · ${n.women}W ${n.men}M</div>
  </button>`).join("");
}

function renderNationDetail() {
  const c = state.nation, el = $("#nationDetail");
  if (!c) { el.innerHTML = ""; return; }
  const team = athletes.filter(a => a.nation === c).sort((a, b) => a.when - b.when);
  el.innerHTML = `<div class="detail-head"><h2>${esc(natName(c))} <small class="natname">${c}</small></h2>
      <button class="linkbtn" id="closeNat">Close</button></div>
    <div class="table-scroll"><table class="data">
      <thead><tr><th>Session</th><th>Athlete</th><th>Category</th><th>Group</th><th class="num">Age</th><th class="num">Entry total</th></tr></thead>
      <tbody>${team.map(a => `<tr><td>${dayLabel(a.date)} · ${a.time}</td><td class="name">${esc(a.name)}</td>
        <td>${a.sex === "Women" ? "W" : "M"} ${a.category} kg</td><td><span class="grp ${a.group}">${a.group}</span></td>
        <td class="num">${a.age}</td><td class="num"><b>${a.entry}</b></td></tr>`).join("")}</tbody></table></div>`;
  $("#closeNat").onclick = () => { state.nation = ""; renderNations(); renderNationDetail(); };
  renderNations();
}

function renderRecords() {
  const rows = D.records[state.recSex][state.recAge];
  const byCat = {};
  for (const r of rows) (byCat[r.category] ||= []).push(r);
  $("#recGrid").innerHTML = Object.entries(byCat).map(([cat, rs]) => `<div class="rcard"><h3>${cat} kg</h3>
    ${rs.map(r => `<div class="rrow"><span class="lift">${r.lift === "C&J" ? "C&amp;J" : r.lift}</span><span class="kg">${r.result}</span>
      <span class="who">${r.holder ? `<b>${esc(r.holder)}</b> ${natTag(r.nation)}<small>${esc(r.place)} · ${r.date}</small>` : `<span class="std">World Standard</span>`}</span></div>`).join("")}
  </div>`).join("");
}
