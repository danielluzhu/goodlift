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

let D, athletes = [], byLot = {}, senior = {};
const state = { openAth: new Set(), user: null, favs: new Set(), authMode: "login", listSort: "lot", sex: "all", aOnly: false, hlNat: "", sort: { key: "when", asc: true }, recSex: "Women", recAge: "Senior", nation: "",
  day: "", cat: "", favOnly: false, watchAge: "all", favSort: { key: "when", asc: true } };

Promise.all([fetch("data.json").then(r => r.json()), api("GET", "me").catch(() => ({ user: null, favorites: [] }))])
  .then(([data, me]) => { setMe(me); init(data); });

async function api(method, path, body) {
  const r = await fetch("api/" + path, { method, headers: body || method !== "GET" ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : method !== "GET" ? "{}" : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || "Something went wrong"), { status: r.status });
  return j;
}
function setMe(me) { state.user = me.user; state.favs = new Set(me.favorites); }

function init(data) {
  D = data;
  for (const sex of ["Women", "Men"])
    for (const r of D.records[sex].Senior) (senior[sex + r.category] ||= {})[r.lift] = r;

  D.groups.forEach((g, gi) => {
    g.id = gi;
    g.parts = [...g.label.matchAll(/(\+?\d+)kg ([A-D])/g)].map(m => ({ cat: m[1], grp: m[2] }));
    g.sortKey = parseDate(g.date).getTime() + g.time.split(":").reduce((h, m) => h * 60 + +m) * 60e3;
    for (const a of g.athletes) {
      const grp = g.parts.find(p => p.cat === a.category)?.grp || g.parts[0].grp;
      athletes.push({ ...a, sex: g.sex, label: g.label, group: grp, gid: gi, date: g.date, time: g.time,
        age: 2026 - +a.dob.slice(6), when: g.sortKey, prTotal: a.pr?.total ?? -1, careerScore: careerScore(a.career), cat: parseInt(a.category) + (a.category.startsWith("+") ? 1000 : 0) });
    }
  });

  for (const a of athletes) { a.watch = recordWatch(a); byLot[a.lot] = a; }

  const nats = Object.keys(D.nations).sort();
  const opts = nats.map(c => `<option value="${c}">${c} · ${esc(natName(c))}</option>`).join("");
  $("#schedNation").insertAdjacentHTML("beforeend", opts);
  $("#fNat").insertAdjacentHTML("beforeend", opts);
  const catSorted = ["Women", "Men"].flatMap(s => [...new Set(athletes.filter(a => a.sex === s).map(a => a.category))]
    .sort((x, y) => parseInt(x) + (x[0] === "+" ? 999 : 0) - parseInt(y) - (y[0] === "+" ? 999 : 0)).map(c => [s, c]));
  const catOpts = catSorted.map(([s, c]) => `<option value="${s}|${c}">${s} ${c} kg</option>`).join("");
  $("#fCat").insertAdjacentHTML("beforeend", catOpts);
  $("#schedCat").insertAdjacentHTML("beforeend", catOpts);
  $("#schedDay").insertAdjacentHTML("beforeend", dayKeys().map((d, i) => `<option value="${d}">Day ${i + 1} · ${dayLabel(d)}</option>`).join(""));

  const w = athletes.filter(a => a.sex === "Women").length;
  $("#kpis").innerHTML = [
    [athletes.length, "athletes"], [nats.length, "nations"], [w, "women"], [athletes.length - w, "men"],
    [D.groups.length, "sessions"], [new Set(D.groups.map(g => g.date)).size, "days"],
  ].map(([n, l]) => `<div class="kpi"><b>${n}</b><span>${l}</span></div>`).join("");

  bind();
  renderAccount(); renderFavorites();
  renderSchedule(); renderAthletes(); renderNations(); renderRecords(); renderWatch(); renderTickets();
  route();
}

function bind() {
  addEventListener("hashchange", route);
  document.querySelectorAll(".seg [data-sex]").forEach(b => b.onclick = () => {
    state.sex = b.dataset.sex; segOn(b); renderSchedule();
  });
  $("#aOnly").onchange = e => { state.aOnly = e.target.checked; renderSchedule(); };
  $("#schedNation").onchange = e => { state.hlNat = e.target.value; renderSchedule(true); };
  $("#schedDay").onchange = e => { state.day = e.target.value; renderSchedule(true); };
  $("#schedCat").onchange = e => { state.cat = e.target.value; renderSchedule(true); };
  $("#favOnly").onchange = e => {
    if (e.target.checked && !state.user) { e.target.checked = false; return openAuth("login", "Sign in to pick favorite athletes, then filter the schedule to their sessions."); }
    state.favOnly = e.target.checked; renderSchedule(true);
  };
  ["#q", "#fSex", "#fCat", "#fNat"].forEach(s => $(s).addEventListener("input", renderAthletes));
  document.querySelectorAll("#athTable th[data-sort]").forEach(th => th.onclick = () => { state.sort = nextSort(state.sort, th.dataset.sort); renderAthletes(); });
  $("#nq").oninput = renderNations;
  bindAuth();
  $("#watchAge").querySelectorAll("button").forEach(b => b.onclick = () => { state.watchAge = b.dataset.v; segOn(b); renderWatch(); });
  for (const id of ["recSex", "recAge"]) $("#" + id).querySelectorAll("button").forEach(b => b.onclick = () => {
    state[id] = b.dataset.v; segOn(b); renderRecords();
  });
  document.addEventListener("click", e => {
    const row = e.target.closest("tr[data-ath]");
    if (row && !e.target.closest("button, a")) {
      const lot = +row.dataset.ath;
      state.openAth.has(lot) ? state.openAth.delete(lot) : state.openAth.add(lot);
      renderAthletes(); return;
    }
    const gc = e.target.closest("[data-gcal]");
    if (gc) { markGcal(gc.dataset.gcal); return; }
    if (e.target.closest("[data-gcal-reset]")) { gcalOpened.clear(); saveGcal(); renderSchedule(true); renderFavorites(); return; }
    const st = e.target.closest("[data-fav]");
    if (st) { e.preventDefault(); e.stopPropagation(); toggleFav(+st.dataset.fav); return; }
    const ls = e.target.closest("[data-listsort]");
    if (ls) {
      state.listSort = ls.dataset.listsort;
      document.querySelectorAll(".session[open] .session-body").forEach(b => b.innerHTML = startList(D.groups[+b.parentElement.dataset.id]));
      return;
    }
    const n = e.target.closest("[data-nat]");
    if (n) { e.preventDefault(); state.nation = n.dataset.nat; location.hash = "#nations"; renderNations(); renderNationDetail(); }
  });
}
// Column sorting for athlete tables: numbers descend first, text ascends first
const nextSort = (cur, key) => ({ key, asc: cur.key === key ? !cur.asc : !["entry", "prTotal", "careerScore"].includes(key) });
function sortAthletes(list, { key, asc }) {
  return list.sort((a, b) => {
    const x = a[key], y = b[key];
    const c = typeof x === "number" ? x - y : String(x).localeCompare(String(y));
    return (asc ? c : -c) || a.when - b.when || b.entry - a.entry;
  });
}
const markSorted = (table, { key, asc }) => document.querySelectorAll(`${table} th`).forEach(th => {
  th.classList.toggle("sorted", th.dataset.sort === key);
  th.classList.toggle("asc", th.dataset.sort === key && asc);
});
const segOn = b => { b.parentElement.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); };

function route() {
  const tab = (location.hash.slice(1) || "schedule");
  const valid = ["schedule", "athletes", "nations", "records", "watch", "favorites", "tickets"].includes(tab) ? tab : "schedule";
  document.querySelectorAll("main > section").forEach(s => s.hidden = s.id !== "view-" + valid);
  document.querySelectorAll(".tabs a").forEach(a => a.classList.toggle("on", a.dataset.tab === valid));
  if (valid === "nations") { renderNationDetail(); if (state.nation) $("#nationDetail").scrollIntoView({ block: "start" }); }
}

// Best total at any IWF event (OpenWeightlifting data); the category is the one it was lifted in
const prCell = a => a.pr
  ? `<span title="${esc(a.pr.event)}, ${esc(a.pr.date)}"><b>${a.pr.total}</b> <small class="prcat">${a.pr.category} kg · ${a.pr.date.slice(0, 4)}</small></span>`
  : `<span class="std" title="No result found in the IWF results data">–</span>`;
const LIST_SORTS = { lot: (a, b) => a.lot - b.lot, entry: (a, b) => b.entry - a.entry || a.lot - b.lot,
  pr: (a, b) => (b.pr?.total ?? -1) - (a.pr?.total ?? -1) || a.lot - b.lot };

// Career summary (senior results from OpenWeightlifting): placings on total at each level
const LEVELS = [["olympics", "Olympics", "OG"], ["worlds", "World Championships", "Worlds"],
  ["regional", "Continental & regional", "Regional"], ["national", "National championships", "National"]];
const LEVEL_WEIGHT = { olympics: 1e6, worlds: 1e4, regional: 100, national: 1 };
const medals = list => [1, 2, 3].map(p => list.filter(e => e.place === p).length);
function careerScore(c) {
  if (!c) return -1;
  return LEVELS.reduce((s, [k]) => { const [g, si, b] = medals(c[k]); return s + LEVEL_WEIGHT[k] * (g * 9 + si * 3 + b) + LEVEL_WEIGHT[k] * c[k].length / 100; }, 0);
}
const ordinal = n => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th");
const placeTag = p => p == null ? `<span class="place none" title="No total">–</span>`
  : p <= 3 ? `<span class="medal m${p}" title="${["Gold", "Silver", "Bronze"][p - 1]}">${p}</span>` : `<span class="place">${ordinal(p)}</span>`;
const medalCounts = list => medals(list).map((n, i) => n ? `<span class="medal m${i + 1}" title="${n} ${["gold", "silver", "bronze"][i]}">${n}</span>` : "").join("");
function careerCell(a) {
  const c = a.career;
  if (!c) return `<span class="std">–</span>`;
  return `<span class="career">${LEVELS.filter(([k]) => c[k].length).map(([k, , short]) =>
    `<span class="cv" title="${c[k].length} ${short} appearance${c[k].length === 1 ? "" : "s"}"><b>${short}</b> ${c[k].length}×${medalCounts(c[k])}</span>`).join("")}</span>`;
}
// "2025 IWF World Championships" / "British Senior Championships 2025" -> drop the year, it's shown separately
const eventName = s => s.replace(/^(the\s+)?(nike\s+)?\d{4}\s+|\s+\d{4}\s*$/gi, (m, the, nike) => (the || "") + (nike || "")).trim();
function careerDetail(a) {
  const c = a.career;
  const pr = a.pr ? `<p><b>Historic PR:</b> ${a.pr.total} kg in the ${a.pr.category} kg class at ${esc(a.pr.event)} (${esc(a.pr.date)})</p>` : "";
  if (!c) return `${pr}<p class="hint">No senior international or national results found for this athlete in the OpenWeightlifting data.</p>`;
  const nationalNote = ["USA", "GBR", "AUS", "FRA", "NOR", "IRL"].includes(a.nation) ? "" : `<p class="hint">National championship results aren't available for ${esc(natName(a.nation))}.</p>`;
  return `${pr}<div class="cgrid">${LEVELS.map(([k, label]) => `<div><h4>${label}${c[k].length ? ` <small>${c[k].length}×</small>` : ""}</h4>${c[k].length
      ? `<ul>${c[k].map(e => `<li><span class="pt">${placeTag(e.place)}</span><span><b>${e.year}</b> ${esc(k === "olympics" ? e.event : eventName(e.event))}${e.category ? ` · ${e.category} kg` : ""}${e.total ? ` · ${e.total} kg` : ""}</span></li>`).join("")}</ul>`
      : `<p class="hint">None</p>`}</div>`).join("")}</div>${nationalNote}`;
}

// Favorites: athletes are keyed by lot number (unique across the start book)
const starBtn = a => {
  const on = state.favs.has(a.lot);
  return `<button class="star ${on ? "on" : ""}" data-fav="${a.lot}" aria-pressed="${on}" title="${on ? "Remove from" : "Add to"} favorites" aria-label="Favorite ${esc(a.name)}">${on ? "★" : "☆"}</button>`;
};
async function toggleFav(lot) {
  if (!state.user) return openAuth("login", "Sign in to save your favorite athletes.");
  const on = state.favs.has(lot);
  on ? state.favs.delete(lot) : state.favs.add(lot); // optimistic
  syncFavs();
  try { setMe(await api(on ? "DELETE" : "PUT", "favorites/" + lot)); }
  catch (e) { on ? state.favs.add(lot) : state.favs.delete(lot); if (e.status === 401) { setMe({ user: null, favorites: [] }); renderAccount(); } alert(e.message); }
  syncFavs();
}
function syncFavs() {
  document.querySelectorAll("[data-fav]").forEach(b => {
    const on = state.favs.has(+b.dataset.fav);
    b.classList.toggle("on", on); b.textContent = on ? "★" : "☆"; b.setAttribute("aria-pressed", on);
    b.title = `${on ? "Remove from" : "Add to"} favorites`;
  });
  document.querySelectorAll(".session").forEach(el => {
    const n = D.groups[+el.dataset.id].athletes.filter(a => state.favs.has(a.lot)).length;
    el.querySelector(".favcount").textContent = n ? `★ ${n}` : "";
  });
  if (state.favOnly) renderSchedule(true);
  renderFavorites();
}

function renderAccount() {
  $("#account").innerHTML = state.user
    ? `<span class="who">Signed in as <b>${esc(state.user.username)}</b></span><button class="linkbtn" id="logoutBtn">Sign out</button>`
    : `<button class="btn small" id="loginBtn">Sign in</button>`;
  $("#loginBtn")?.addEventListener("click", () => openAuth("login"));
  $("#logoutBtn")?.addEventListener("click", async () => {
    setMe(await api("POST", "logout")); state.favOnly = false; $("#favOnly").checked = false; renderAccount(); syncFavs(); renderSchedule(true);
  });
}
function openAuth(mode, why) {
  state.authMode = mode;
  const signup = mode === "signup";
  $("#authTitle").textContent = signup ? "Create an account" : "Sign in";
  $("#authSubmit").textContent = signup ? "Create account" : "Sign in";
  $("#authSwitchText").textContent = signup ? "Already have an account?" : "No account yet?";
  $("#authSwitch").textContent = signup ? "Sign in" : "Create one";
  $("#authPass").autocomplete = signup ? "new-password" : "current-password";
  $("#authWhy").textContent = why || (signup ? "Pick a username and a password of at least 8 characters." : "Sign in to save your favorite athletes.");
  $("#authErr").textContent = "";
  if (!$("#authDlg").open) $("#authDlg").showModal();
  $("#authUser").focus();
}
function bindAuth() {
  $("#authSwitch").onclick = () => openAuth(state.authMode === "login" ? "signup" : "login");
  $("#authCancel").onclick = () => $("#authDlg").close();
  $("#authForm").onsubmit = async e => {
    e.preventDefault();
    $("#authSubmit").disabled = true;
    try {
      setMe(await api("POST", state.authMode, { username: $("#authUser").value, password: $("#authPass").value }));
      $("#authDlg").close(); $("#authPass").value = "";
      renderAccount(); syncFavs();
    } catch (err) { $("#authErr").textContent = err.message; }
    $("#authSubmit").disabled = false;
  };
}

let favGcalOpen = false;
function renderFavorites() {
  const el = $("#favView");
  if (!el) return;
  if (!state.user) {
    el.innerHTML = `<div class="empty"><p>Sign in to pick favorite athletes. Tap the ☆ next to any athlete, and they'll all show up here in competition order.</p>
      <button class="btn primary" data-auth="signup">Create an account</button> <button class="btn" data-auth="login">Sign in</button></div>`;
    el.querySelectorAll("[data-auth]").forEach(b => b.onclick = () => openAuth(b.dataset.auth));
    return;
  }
  const list = sortAthletes(athletes.filter(a => state.favs.has(a.lot)), state.favSort);
  if (!list.length) { el.innerHTML = `<div class="empty"><p>No favorites yet. Tap the ☆ next to an athlete in the Schedule, Athletes or Nations tabs.</p></div>`; return; }
  const nSess = new Set(list.map(a => a.gid)).size;
  el.innerHTML = `<div class="fav-head"><p class="hint">${list.length} favorite athlete${list.length === 1 ? "" : "s"} in ${nSess} session${nSess === 1 ? "" : "s"}. Click a column to sort. Times are Ningbo local (UTC+8).</p>
    <a class="btn primary" href="${calURL({ lots: [...state.favs].join(",") })}" title="One calendar event per session, with your favorites' names in the titles">⬇ Download their sessions (.ics)</a></div>
    <details class="calbox" ${favGcalOpen ? "open" : ""} id="favGcal"><summary>📅 Add their sessions to Google Calendar one by one (no download)</summary><div class="calbody">${
      oneByOne(D.groups.filter(g => g.athletes.some(a => state.favs.has(a.lot))), g => g.athletes.filter(a => state.favs.has(a.lot)))}</div></details>
    <div class="table-scroll"><table class="data" id="favTable">
      <thead><tr><th></th><th data-sort="when">Session</th><th data-sort="name">Athlete</th><th data-sort="nation">Nation</th><th data-sort="cat">Category</th><th data-sort="group">Group</th><th data-sort="lot" class="num">Lot</th><th data-sort="age" class="num">Age</th><th data-sort="entry" class="num">Entry total</th><th data-sort="prTotal" class="num">Historic PR</th></tr></thead>
      <tbody>${list.map(a => `<tr><td>${starBtn(a)}</td><td>${dayLabel(a.date)} · ${a.time}</td><td class="name">${esc(a.name)}${watchBadge(a)}</td><td>${natTag(a.nation)}</td>
        <td>${a.sex === "Women" ? "W" : "M"} ${a.category} kg</td><td><span class="grp ${a.group}">${a.group}</span></td>
        <td class="num">${a.lot}</td><td class="num">${a.age}</td><td class="num"><b>${a.entry}</b></td><td class="num">${prCell(a)}</td></tr>`).join("")}</tbody></table></div>`;
  markSorted("#favTable", state.favSort);
  $("#favGcal").ontoggle = e => favGcalOpen = e.target.open;
  el.querySelectorAll("th[data-sort]").forEach(th => th.onclick = () => { state.favSort = nextSort(state.favSort, th.dataset.sort); renderFavorites(); });
}

const natTag = c => `<button class="nat" data-nat="${c}" title="${esc(natName(c))}">${c}</button>`;

// Ningbo is UTC+8 with no DST; Google Calendar links take UTC times and show them in the viewer's zone
const SESSION_HOURS = 2;
function sessionUTC(g) {
  const [d, m, y] = g.date.split(".").map(Number), [hh, mm] = g.time.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh - 8, mm));
}
const gcalStamp = t => t.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
function gcalLink(g, names = []) {
  const start = sessionUTC(g), end = new Date(start.getTime() + SESSION_HOURS * 3600e3);
  const details = [`Start ${g.time} local (UTC+8) · Weigh-in ${g.weighin}`, "",
    ...g.athletes.map(a => `${a.lot} · ${a.name} · ${a.nation} · ${a.entry} kg`)].join("\n");
  const q = new URLSearchParams({ action: "TEMPLATE", text: `${g.sex} ${g.label}${names.length ? ` (${names.join(", ")})` : ""} · IWF Worlds`,
    dates: `${gcalStamp(start)}/${gcalStamp(end)}`, details, location: "Ningbo, China" });
  return `https://calendar.google.com/calendar/render?${q}`;
}
const yourTime = g => sessionUTC(g).toLocaleString([], { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZoneName: "short" });

// No-download option: one Google Calendar link per session. Browsers block opening many tabs from one click,
// so it's a checklist; sessions already opened are remembered in this browser.
const GCAL_KEY = "gcalOpened";
const gcalOpened = new Set((() => { try { return JSON.parse(localStorage.getItem(GCAL_KEY)) || []; } catch { return []; } })());
const saveGcal = () => { try { localStorage.setItem(GCAL_KEY, JSON.stringify([...gcalOpened])); } catch {} };
const gcalId = g => `${g.date} ${g.time} ${g.label}`;
function oneByOne(gs, named) {
  if (!gs.length) return "";
  const done = gs.filter(g => gcalOpened.has(gcalId(g))).length;
  return `<div class="onebyone"><h3>Or skip the download: add them one by one</h3>
    <p class="hint">Each button opens Google Calendar with that session filled in (start list included). Click <b>Save</b> there, come back, and do the next one.
      <span class="gcal-progress">${done} of ${gs.length} opened</span>${done ? ` · <button class="linkbtn" data-gcal-reset>Clear ticks</button>` : ""}</p>
    <ol class="gcal-list">${gs.map(g => {
      const names = named(g).map(a => a.name), on = gcalOpened.has(gcalId(g));
      return `<li class="${on ? "done" : ""}"><a class="btn small ${on ? "" : "primary"}" data-gcal="${esc(gcalId(g))}" href="${esc(gcalLink(g, names))}" target="_blank" rel="noopener">${on ? "✓ Opened" : "Add ↗"}</a>
        <span><b>${dayLabel(g.date)} · ${g.time}</b> ${g.sex} ${esc(g.label)}${names.length ? ` <small class="meta">${esc(names.join(", "))}</small>` : ""}</span></li>`;
    }).join("")}</ol></div>`;
}
function markGcal(id) {
  gcalOpened.add(id); saveGcal();
  // Let the link open first, then refresh the ticks
  setTimeout(() => { renderSchedule(true); renderFavorites(); });
}

// calendar.ics filters (see server.ts): sex, a, nation, day, cat, session, lots
const calURL = params => `calendar.ics?${new URLSearchParams({ download: "1", ...params })}`;
const dayKeys = () => [...new Set(D.groups.map(g => g.date))];
function updateCalBox(gs) {
  const count = gs.length;
  const [catSex, cat] = state.cat ? state.cat.split("|") : [];
  const p = {};
  if (state.sex !== "all") p.sex = state.sex;
  if (catSex) { p.sex = catSex; p.cat = cat; }
  if (state.aOnly) p.a = "1";
  if (state.hlNat) p.nation = state.hlNat;
  if (state.day) p.day = state.day;
  if (state.favOnly) p.lots = [...state.favs].join(",");
  $("#calDownload").href = calURL(p);
  $("#calDownload").classList.toggle("disabled", !count);
  const parts = [state.sex !== "all" && !catSex ? state.sex.toLowerCase() + "'s" : "", cat ? `${catSex.toLowerCase()}'s ${cat} kg` : "", state.aOnly ? "A-group" : ""].filter(Boolean).join(" ");
  const named = [state.hlNat && `${esc(natName(state.hlNat))} athletes`, state.favOnly && "your favorites"].filter(Boolean).join(" or ");
  $("#calOneByOne").innerHTML = oneByOne(gs, g => g.athletes.filter(a => a.nation === state.hlNat || (state.favOnly && state.favs.has(a.lot))));
  $("#calSummary").innerHTML = `<b>${[count, parts].filter(Boolean).join(" ")} session${count === 1 ? "" : "s"}</b>${state.day ? ` on ${dayLabel(state.day)}` : ""}${named ? ` with ${named} (their names go in the event titles)` : ""} will be added.`;
}

function startList(g) {
  const max = Math.max(...g.athletes.map(a => a.entry));
  const rows = [...g.athletes].sort(LIST_SORTS[state.listSort]).map(a => {
    return `<tr class="${state.hlNat && a.nation === state.hlNat ? "hl" : ""}">
      <td class="num">${a.lot}</td>
      <td class="name">${starBtn(a)}${esc(a.name)}${watchBadge(byLot[a.lot])}</td>
      <td>${natTag(a.nation)}<span class="natname">${esc(natName(a.nation))}</span></td>
      ${g.parts.length > 1 ? `<td>${a.category} kg</td>` : ""}
      <td class="num">${2026 - +a.dob.slice(6)}</td>
      <td class="num"><span class="bar"><i style="width:${(a.entry / max * 100).toFixed(1)}%"></i></span><b>${a.entry}</b></td>
      <td class="num">${prCell(a)}</td>
    </tr>`;
  }).join("");
  const recs = g.parts.map(p => {
    const r = senior[g.sex + p.cat];
    if (!r) return "";
    const fmt = l => `${l === "C&J" ? "C&amp;J" : l} <b>${r[l].result}</b>`;
    return `<span>Senior WR ${g.parts.length > 1 ? p.cat + " kg: " : ""}${["Snatch", "C&J", "Total"].map(fmt).join(" · ")}</span>`;
  }).join("");
  return `<div class="session-cal"><a class="btn" href="${esc(gcalLink(g))}" target="_blank" rel="noopener">📅 Add to Google Calendar</a>
      <a class="btn" href="${calURL({ session: g.id })}" title="Calendar file with just this session and its start list">⬇ Download session (.ics)</a>
      <span class="meta">Your time: ${esc(yourTime(g))}</span></div>
    <div class="rec-strip">${recs}</div>
    <div class="list-sort">Sort by <div class="seg" role="group" aria-label="Sort start list">${[["lot", "Lot"], ["entry", "Entry total"], ["pr", "Historic PR"]]
      .map(([k, l]) => `<button data-listsort="${k}" class="${state.listSort === k ? "on" : ""}">${l}</button>`).join("")}</div></div>
    <div class="table-scroll"><table class="data">
      <thead><tr><th class="num">Lot</th><th>Athlete</th><th>Nation</th>${g.parts.length > 1 ? "<th>Cat.</th>" : ""}<th class="num">Age</th><th class="num">Entry total</th><th class="num">Historic PR</th></tr></thead>
      <tbody>${rows}</tbody></table></div>`;
}

function renderSchedule(keepOpen) {
  const open = keepOpen ? new Set([...document.querySelectorAll(".session[open]")].map(d => d.dataset.id)) : new Set();
  const [catSex, cat] = state.cat ? state.cat.split("|") : [];
  const gs = D.groups.filter(g => (state.sex === "all" || g.sex === state.sex) && (!state.aOnly || g.parts.some(p => p.grp === "A")) &&
    (!state.day || g.date === state.day) && (!cat || (g.sex === catSex && g.parts.some(p => p.cat === cat))) &&
    (!state.favOnly || g.athletes.some(a => state.favs.has(a.lot))));
  updateCalBox(state.hlNat ? gs.filter(g => g.athletes.some(a => a.nation === state.hlNat)) : gs);
  const days = {};
  for (const g of gs) (days[g.date] ||= []).push(g);
  const allDays = dayKeys();
  $("#days").innerHTML = allDays.filter(d => days[d]).map(d => {
    const n = allDays.indexOf(d) + 1;
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
          <div class="count">${g.athletes.length} athletes<br><span class="favcount">${(n => n ? `★ ${n}` : "")(g.athletes.filter(a => state.favs.has(a.lot)).length)}</span>${(n => n ? `<br><span class="watchcount" title="Athletes on the Record Watch list">🎯 ${n}</span>` : "")(g.athletes.filter(a => byLot[a.lot].watch).length)}${hits ? `<br><span class="flagged">${hits} × ${state.hlNat}</span>` : ""}</div>
        </summary>
        <div class="session-body">${isOpen ? startList(g) : ""}</div>
      </details>`;
    }).join("");
    return `<div class="day"><h2>Day ${n} <small>${dayLabel(d)}</small>
      <a class="daydl" href="${calURL({ day: d })}" title="Calendar file with every session on ${dayLabel(d)}">⬇ Download day (.ics)</a></h2><div class="sessions">${items}</div></div>`;
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
  sortAthletes(list, state.sort);
  markSorted("#athTable", state.sort);
  $("#athCount").textContent = `${list.length} of ${athletes.length} athletes. Click a column to sort, or an athlete for their career summary.`;
  $("#athTable tbody").innerHTML = list.map(a => `<tr data-ath="${a.lot}" class="ath-row ${state.openAth.has(a.lot) ? "open" : ""}">
    <td class="name">${starBtn(a)}${esc(a.name)}${watchBadge(a)}<span class="caret" aria-hidden="true"></span></td>
    <td>${natTag(a.nation)}</td>
    <td>${a.sex === "Women" ? "W" : "M"} ${a.category} kg</td>
    <td><span class="grp ${a.group}">${a.group}</span></td>
    <td>${shortDate(a.date)} · ${a.time}</td>
    <td class="num">${a.age}</td>
    <td class="num"><b>${a.entry}</b></td>
    <td class="num">${prCell(a)}</td>
    <td>${careerCell(a)}</td>
  </tr>${state.openAth.has(a.lot) ? `<tr class="ath-detail"><td colspan="9"><div class="cd">${careerDetail(a)}</div></td></tr>` : ""}`).join("");
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
      <thead><tr><th>Session</th><th>Athlete</th><th>Category</th><th>Group</th><th class="num">Age</th><th class="num">Entry total</th><th class="num">Historic PR</th></tr></thead>
      <tbody>${team.map(a => `<tr><td>${dayLabel(a.date)} · ${a.time}</td><td class="name">${starBtn(a)}${esc(a.name)}${watchBadge(a)}</td>
        <td>${a.sex === "Women" ? "W" : "M"} ${a.category} kg</td><td><span class="grp ${a.group}">${a.group}</span></td>
        <td class="num">${a.age}</td><td class="num"><b>${a.entry}</b></td><td class="num">${prCell(a)}</td></tr>`).join("")}</tbody></table></div>`;
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

// Record Watch: the start book only has totals (entry total, historic PR), so this compares them to the Total world
// records. Juniors (20 and under this year) and youth (17 and under) are also measured against those records.
const WATCH_PCT = 3; // within 3% of the record
const AGE_LIMIT = { Senior: 99, Junior: 20, Youth: 17 };
const AGE_LABEL = { Senior: "WR", Junior: "Junior WR", Youth: "Youth WR" };
const catNum = c => parseInt(c) + (c.startsWith("+") ? 1000 : 0);
function recordWatch(a) {
  // A PR lifted in a heavier class says little about this one, so it only counts from the same or a lighter class
  const pr = a.pr && catNum(a.pr.category) <= catNum(a.category) ? a.pr.total : 0;
  const mark = Math.max(a.entry, pr);
  const hits = Object.keys(AGE_LIMIT).filter(age => a.age <= AGE_LIMIT[age]).map(age => {
    const rec = D.records[a.sex][age].find(r => r.category === a.category && r.lift === "Total");
    if (!rec) return null;
    const gap = rec.result - mark, pct = gap / rec.result * 100;
    if (pct > WATCH_PCT) return null;
    return { age, rec, mark, from: mark === a.entry ? "entry" : "pr", gap, pct, tier: gap <= 0 ? "at" : pct <= 1.5 ? "close" : "reach" };
  }).filter(Boolean);
  return hits.length ? hits : null;
}
const TIER = { at: "At or above the record", close: "Within 1.5%", reach: "Within 3%" };
const watchWhy = h => `${h.from === "entry" ? "Entry total" : "Historic PR"} ${h.mark} kg vs ${AGE_LABEL[h.age]} ${h.rec.result} kg` +
  (h.gap > 0 ? ` (${h.gap} kg short)` : h.gap < 0 ? ` (${-h.gap} kg over)` : " (equal)");
function watchBadge(a) {
  if (!a?.watch) return "";
  const h = a.watch[0]; // senior first, then junior, then youth
  return `<a class="watchbadge ${h.tier}" href="#watch" title="Record Watch: ${esc(a.watch.map(x => watchWhy(x)).join("; "))}">🎯 ${h.age === "Senior" ? "WR" : h.age === "Junior" ? "JWR" : "YWR"}</a>`;
}
function renderWatch() {
  const rows = athletes.flatMap(a => (a.watch || []).filter(h => state.watchAge === "all" || h.age === state.watchAge).map(h => ({ a, h })))
    .sort((x, y) => x.a.when - y.a.when || x.h.pct - y.h.pct);
  const people = new Set(rows.map(r => r.a.lot)).size;
  $("#watchHint").innerHTML = `${people} athlete${people === 1 ? "" : "s"} whose entry total or historic PR is within ${WATCH_PCT}% of a world record in their category, in competition order.
    Only totals are compared (the start book has no snatch or C&amp;J entries), and a PR only counts if it was lifted in the same or a lighter class.
    "Standard" records have not been set yet, so the first total at or above the IWF standard becomes the record. Look for 🎯 next to names elsewhere on the site.`;
  let last = "";
  $("#watchList").innerHTML = rows.length ? `<div class="table-scroll"><table class="data watch">
    <thead><tr><th></th><th>Session</th><th>Athlete</th><th>Nation</th><th>Category</th><th>Record</th><th class="num">Record total</th><th class="num">Entry total</th><th class="num">Historic PR</th><th class="num">Gap</th></tr></thead>
    <tbody>${rows.map(({ a, h }) => {
      const sess = `${a.sex} ${a.label}`, first = sess + a.date !== last; last = sess + a.date;
      return `<tr class="${first ? "first" : ""}"><td>${starBtn(a)}</td>
      <td>${first ? `${dayLabel(a.date)} · ${a.time}<br><small class="meta">${esc(sess)}</small>` : ""}</td>
      <td class="name">${esc(a.name)}</td><td>${natTag(a.nation)}</td>
      <td>${a.sex === "Women" ? "W" : "M"} ${a.category} kg <span class="grp ${a.group}">${a.group}</span></td>
      <td><span class="tier ${h.tier}" title="${TIER[h.tier]}">${AGE_LABEL[h.age]}</span></td>
      <td class="num"><b>${h.rec.result}</b> <small class="prcat">${h.rec.holder ? `${esc(h.rec.holder)} (${h.rec.nation})` : "Standard"}</small></td>
      <td class="num">${h.from === "entry" ? `<b>${a.entry}</b>` : a.entry}</td>
      <td class="num">${prCell(a)}</td>
      <td class="num gap ${h.tier}" title="${esc(watchWhy(h))}">${h.gap <= 0 ? `+${-h.gap}` : `−${h.gap}`} kg</td></tr>`;
    }).join("")}</tbody></table></div>` : `<p class="hint">No athletes are within ${WATCH_PCT}% of these records.</p>`;
}

// Tickets: vendor links live in tickets.json so they can be updated without touching code
async function renderTickets() {
  const el = $("#ticketView");
  const t = await fetch("tickets.json").then(r => r.json()).catch(() => null);
  if (!t) { el.innerHTML = `<p class="hint">Ticket information couldn't be loaded.</p>`; return; }
  const link = s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)} ↗</a>`;
  el.innerHTML = `<h2>Tickets</h2>
    ${t.vendors.length ? `<div class="vendors">${t.vendors.map(v => `<a class="vendor" href="${esc(v.url)}" target="_blank" rel="noopener">
        <b>${esc(v.name)} ↗</b>${v.note ? `<span>${esc(v.note)}</span>` : ""}<small>${esc(new URL(v.url).hostname)}</small></a>`).join("")}</div>`
      : `<div class="empty"><p><b>Ticket sellers not confirmed yet.</b> ${esc(t.status)}</p></div>`}
    <p class="hint">Last checked ${esc(t.checked)}. Only buy through channels named by the organisers or the IWF: resale and look-alike ticket sites are common for big events.</p>
    <div class="ticket-grid">
      <div class="rcard"><h3>Venue</h3><p><b>${esc(t.venue.name)}</b><br>${esc(t.venue.city)}<br><span class="meta">${esc(t.venue.capacity)}</span></p>
        <p class="meta">Sessions run 27 Oct – 8 Nov. See the <a href="#schedule">Schedule</a> for start times (Ningbo local time).</p></div>
      <div class="rcard"><h3>Where to check for official sales</h3><ul class="srcs">${t.sources.map(s => `<li>${link(s)}</li>`).join("")}</ul></div>
    </div>`;
}
