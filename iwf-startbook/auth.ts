// Accounts and favorites, stored in SQLite: data/app.sqlite (not in git)
import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";

const dir = new URL("./data/", import.meta.url).pathname;
mkdirSync(dir, { recursive: true });
const db = new Database(dir + "app.sqlite", { create: true });
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    pw_hash TEXT NOT NULL, created INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS favorites (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, lot INTEGER NOT NULL, created INTEGER NOT NULL,
    PRIMARY KEY (user_id, lot));
`);

const SESSION_DAYS = 30;
const COOKIE = "sb_session";
type User = { id: number; username: string };

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });
const err = (message: string, status = 400) => json({ error: message }, status);

const cookieOf = (req: Request) =>
  req.headers.get("cookie")?.split(/;\s*/).find(c => c.startsWith(COOKIE + "="))?.slice(COOKIE.length + 1);
const setCookie = (req: Request, token: string, maxAge: number) => {
  const secure = req.headers.get("x-forwarded-proto") === "https" ? "; Secure" : "";
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
};

function currentUser(req: Request): User | null {
  const token = cookieOf(req);
  if (!token) return null;
  return db.query("SELECT u.id, u.username FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires > ?")
    .get(token, Date.now()) as User | null;
}

function startSession(req: Request, user: User) {
  const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
  db.query("DELETE FROM sessions WHERE expires < ?").run(Date.now());
  db.query("INSERT INTO sessions (token, user_id, expires) VALUES (?, ?, ?)").run(token, user.id, Date.now() + SESSION_DAYS * 864e5);
  return json(me(user), 200, { "Set-Cookie": setCookie(req, token, SESSION_DAYS * 86400) });
}

const me = (user: User | null) => user
  ? { user: { username: user.username }, favorites: (db.query("SELECT lot FROM favorites WHERE user_id = ? ORDER BY created").all(user.id) as { lot: number }[]).map(r => r.lot) }
  : { user: null, favorites: [] };

// Slow down password guessing: at most 10 failed logins per username per 15 minutes
const failures = new Map<string, number[]>();
const WINDOW = 15 * 60e3;
const tooMany = (name: string) => (failures.get(name) ?? []).filter(t => t > Date.now() - WINDOW).length >= 10;
const fail = (name: string) => failures.set(name, [...(failures.get(name) ?? []).filter(t => t > Date.now() - WINDOW), Date.now()]);

async function credentials(req: Request) {
  const body = await req.json().catch(() => ({}));
  return { username: String(body.username ?? "").trim(), password: String(body.password ?? "") };
}

// Returns a Response for /api/* routes, or null for anything else
export async function handleApi(req: Request, path: string, validLots: Set<number>): Promise<Response | null> {
  if (!path.startsWith("/api/")) return null;
  // JSON-only writes: cross-site forms can't send application/json without a CORS preflight
  if (req.method !== "GET" && !req.headers.get("content-type")?.startsWith("application/json"))
    return err("Expected application/json", 415);

  if (path === "/api/me" && req.method === "GET") return json(me(currentUser(req)));

  if (path === "/api/signup" && req.method === "POST") {
    const { username, password } = await credentials(req);
    if (!/^[A-Za-z0-9_.-]{3,30}$/.test(username)) return err("Username must be 3–30 letters, numbers, dots, dashes or underscores.");
    if (password.length < 8) return err("Password must be at least 8 characters.");
    if (db.query("SELECT 1 FROM users WHERE username = ?").get(username)) return err("That username is taken.", 409);
    const pw_hash = await Bun.password.hash(password);
    const { id } = db.query("INSERT INTO users (username, pw_hash, created) VALUES (?, ?, ?) RETURNING id").get(username, pw_hash, Date.now()) as { id: number };
    return startSession(req, { id, username });
  }

  if (path === "/api/login" && req.method === "POST") {
    const { username, password } = await credentials(req);
    const key = username.toLowerCase();
    if (tooMany(key)) return err("Too many failed attempts. Try again in 15 minutes.", 429);
    const row = db.query("SELECT id, username, pw_hash FROM users WHERE username = ?").get(username) as (User & { pw_hash: string }) | null;
    if (!row || !(await Bun.password.verify(password, row.pw_hash))) { fail(key); return err("Wrong username or password.", 401); }
    failures.delete(key);
    return startSession(req, row);
  }

  if (path === "/api/logout" && req.method === "POST") {
    const token = cookieOf(req);
    if (token) db.query("DELETE FROM sessions WHERE token = ?").run(token);
    return json(me(null), 200, { "Set-Cookie": setCookie(req, "", 0) });
  }

  const fav = path.match(/^\/api\/favorites\/(\d+)$/);
  if (fav && (req.method === "PUT" || req.method === "DELETE")) {
    const user = currentUser(req);
    if (!user) return err("Sign in to save favorites.", 401);
    const lot = Number(fav[1]);
    if (!validLots.has(lot)) return err("Unknown athlete.", 404);
    if (req.method === "PUT") db.query("INSERT OR IGNORE INTO favorites (user_id, lot, created) VALUES (?, ?, ?)").run(user.id, lot, Date.now());
    else db.query("DELETE FROM favorites WHERE user_id = ? AND lot = ?").run(user.id, lot);
    return json(me(user));
  }

  return err("Not found", 404);
}
