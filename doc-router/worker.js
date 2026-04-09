// Routes:
//   openclaw.aiedi.cn/doc/*              → Cloudflare Pages proxy
//   openclaw.aiedi.cn/api/auth/*         → Register / Login
//   openclaw.aiedi.cn/api/comments*      → Comments CRUD
//   openclaw.aiedi.cn/api/annotations*   → Legacy annotation API (KV-backed)
//   aiedi.cn/<verification-file>         → Domain verification

const PAGES_HOST = "https://clean-main.openclaw-docs-17d.pages.dev";
const JWT_SECRET_ENV = "JWT_SECRET"; // set via `wrangler secret put JWT_SECRET`

const VERIFICATION_FILES = {
  "/7693314d39083a420bd8e8bfca7a2e63.txt": "5c8fe1bbddefb8e4e66aeafc05f66e677f0e935f",
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

// ── Crypto helpers ────────────────────────────────────────────────────────────

function hex(buf) {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: enc.encode(salt), iterations: 100_000, hash: "SHA-256" },
    key, 256
  );
  return hex(bits);
}

function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function signJwt(payload, secret) {
  const enc = new TextEncoder();
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const data = `${header}.${body}`;
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return `${data}.${b64url(sig)}`;
}

async function verifyJwt(token, secret) {
  try {
    const [header, body, sig] = token.split(".");
    if (!header || !body || !sig) return null;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]
    );
    const sigBuf = Uint8Array.from(atob(sig.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify("HMAC", key, sigBuf, enc.encode(`${header}.${body}`));
    if (!valid) return null;
    const payload = JSON.parse(atob(body.replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

async function authenticate(request, secret) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  return verifyJwt(token, secret);
}

// ── Auth API ──────────────────────────────────────────────────────────────────

async function handleAuth(request, url, db, secret) {
  const route = url.pathname.replace(/^\/api\/auth\/?/, "");

  // POST /api/auth/register
  if (request.method === "POST" && route === "register") {
    let body;
    try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

    const username = (body.username || "").trim().slice(0, 40);
    const password = (body.password || "").trim();
    if (!username || username.length < 2) return json({ error: "用户名至少 2 个字符" }, 400);
    if (!password || password.length < 6) return json({ error: "密码至少 6 位" }, 400);

    const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
    const hash = await hashPassword(password, salt);
    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    try {
      await db.prepare(
        "INSERT INTO users (id, username, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?)"
      ).bind(id, username, hash, salt, now).run();
    } catch (e) {
      if (e.message?.includes("UNIQUE")) return json({ error: "用户名已被注册" }, 409);
      throw e;
    }

    const token = await signJwt({ sub: id, username, exp: Math.floor(Date.now() / 1000) + 30 * 86400 }, secret);
    return json({ token, username, id }, 201);
  }

  // POST /api/auth/login
  if (request.method === "POST" && route === "login") {
    let body;
    try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

    const username = (body.username || "").trim();
    const password = (body.password || "").trim();
    if (!username || !password) return json({ error: "请填写用户名和密码" }, 400);

    const user = await db.prepare("SELECT * FROM users WHERE username = ?").bind(username).first();
    if (!user) return json({ error: "用户名或密码错误" }, 401);

    const hash = await hashPassword(password, user.salt);
    if (hash !== user.password_hash) return json({ error: "用户名或密码错误" }, 401);

    const now = Math.floor(Date.now() / 1000);
    await db.prepare("UPDATE users SET last_login_at = ? WHERE id = ?").bind(now, user.id).run();

    const token = await signJwt({ sub: user.id, username, exp: now + 30 * 86400 }, secret);
    return json({ token, username, id: user.id });
  }

  return json({ error: "Not found" }, 404);
}

// ── Comments API ──────────────────────────────────────────────────────────────

async function handleComments(request, url, db, secret) {
  const parts = url.pathname.replace(/^\/api\/comments\/?/, "").split("/").filter(Boolean);
  // GET /api/comments?slug=...
  // POST /api/comments                    { articleSlug, content }
  // DELETE /api/comments/:id
  // POST /api/comments/:id/replies        { content }
  // DELETE /api/comments/:id/replies/:rid (same as DELETE comment)

  // GET — list comments for an article (nested structure)
  if (request.method === "GET" && parts.length === 0) {
    const slug = url.searchParams.get("slug");
    if (!slug) return json({ error: "slug required" }, 400);

    const rows = await db.prepare(`
      SELECT c.id, c.content, c.parent_id, c.created_at, u.username, u.id as user_id
      FROM comments c JOIN users u ON c.user_id = u.id
      WHERE c.article_slug = ?
      ORDER BY c.created_at ASC
    `).bind(slug).all();

    // Build nested structure: top-level comments with replies[]
    const map = {};
    const roots = [];
    for (const row of rows.results) {
      map[row.id] = { ...row, replies: [] };
    }
    for (const row of rows.results) {
      if (row.parent_id && map[row.parent_id]) {
        map[row.parent_id].replies.push(map[row.id]);
      } else if (!row.parent_id) {
        roots.push(map[row.id]);
      }
    }
    return json(roots);
  }

  // POST — create top-level comment
  if (request.method === "POST" && parts.length === 0) {
    const user = await authenticate(request, secret);
    if (!user) return json({ error: "请先登录" }, 401);

    let body;
    try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

    const slug = (body.articleSlug || "").trim();
    const content = (body.content || "").trim();
    if (!slug) return json({ error: "articleSlug required" }, 400);
    if (!content || content.length > 2000) return json({ error: "内容不能为空，且不超过 2000 字" }, 400);

    // Upsert article record
    await db.prepare(
      "INSERT INTO articles (slug, title) VALUES (?, ?) ON CONFLICT(slug) DO NOTHING"
    ).bind(slug, slug).run();

    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    await db.prepare(
      "INSERT INTO comments (id, article_slug, user_id, content, parent_id, created_at) VALUES (?, ?, ?, ?, NULL, ?)"
    ).bind(id, slug, user.sub, content, now).run();

    return json({ id, content, username: user.username, user_id: user.sub, created_at: now, replies: [] }, 201);
  }

  // POST /api/comments/:id/replies — reply to a comment
  if (request.method === "POST" && parts.length === 2 && parts[1] === "replies") {
    const user = await authenticate(request, secret);
    if (!user) return json({ error: "请先登录" }, 401);

    const parentId = parts[0];
    const parent = await db.prepare("SELECT * FROM comments WHERE id = ?").bind(parentId).first();
    if (!parent) return json({ error: "评论不存在" }, 404);
    // Replies always attach to top-level (flatten one level)
    const topId = parent.parent_id || parentId;

    let body;
    try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

    const content = (body.content || "").trim();
    if (!content || content.length > 2000) return json({ error: "内容不能为空，且不超过 2000 字" }, 400);

    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    await db.prepare(
      "INSERT INTO comments (id, article_slug, user_id, content, parent_id, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(id, parent.article_slug, user.sub, content, topId, now).run();

    return json({ id, content, username: user.username, user_id: user.sub, parent_id: topId, created_at: now }, 201);
  }

  // DELETE /api/comments/:id — delete own comment (and its replies)
  if (request.method === "DELETE" && parts.length === 1) {
    const user = await authenticate(request, secret);
    if (!user) return json({ error: "请先登录" }, 401);

    const comment = await db.prepare("SELECT * FROM comments WHERE id = ?").bind(parts[0]).first();
    if (!comment) return json({ error: "评论不存在" }, 404);
    if (comment.user_id !== user.sub) return json({ error: "无权删除" }, 403);

    await db.prepare("DELETE FROM comments WHERE id = ? OR parent_id = ?").bind(parts[0], parts[0]).run();
    return json({ ok: true });
  }

  return json({ error: "Not found" }, 404);
}

// ── Legacy annotation API (KV) ────────────────────────────────────────────────

async function handleAnnotations(request, url, kv) {
  const parts = url.pathname.replace(/^\/api\/annotations\/?/, "").split("/").filter(Boolean);

  if (request.method === "GET" && parts.length === 0) {
    const slug = url.searchParams.get("slug") || "/";
    const raw = await kv.get(`page:${slug}`);
    const ids = raw ? JSON.parse(raw) : [];
    const items = await Promise.all(
      ids.map((id) => kv.get(`annotation:${id}`).then((v) => (v ? JSON.parse(v) : null)))
    );
    return json(items.filter(Boolean));
  }

  if (request.method === "POST" && parts.length === 0) {
    let body;
    try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
    const id = crypto.randomUUID();
    const annotation = {
      id,
      pageSlug: (body.pageSlug || "/").slice(0, 200),
      selectedText: (body.selectedText || "").slice(0, 500),
      comment: (body.comment || "").trim().slice(0, 2000),
      author: (body.author || "Anonymous").trim().slice(0, 80),
      createdAt: Date.now(),
      replies: [],
    };
    if (!annotation.comment) return json({ error: "comment required" }, 400);
    await kv.put(`annotation:${id}`, JSON.stringify(annotation));
    const rawIdx = await kv.get(`page:${annotation.pageSlug}`);
    const ids = rawIdx ? JSON.parse(rawIdx) : [];
    ids.push(id);
    await kv.put(`page:${annotation.pageSlug}`, JSON.stringify(ids));
    return json(annotation, 201);
  }

  if (request.method === "POST" && parts.length === 2 && parts[1] === "replies") {
    const raw = await kv.get(`annotation:${parts[0]}`);
    if (!raw) return json({ error: "Not found" }, 404);
    let body;
    try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
    const annotation = JSON.parse(raw);
    const reply = {
      id: crypto.randomUUID(),
      comment: (body.comment || "").trim().slice(0, 2000),
      author: (body.author || "Anonymous").trim().slice(0, 80),
      createdAt: Date.now(),
    };
    if (!reply.comment) return json({ error: "comment required" }, 400);
    annotation.replies.push(reply);
    await kv.put(`annotation:${parts[0]}`, JSON.stringify(annotation));
    return json(reply, 201);
  }

  return json({ error: "Not found" }, 404);
}

// ── Main fetch handler ────────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const secret = env.JWT_SECRET || "dev-secret-change-me";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (url.pathname in VERIFICATION_FILES) {
      return new Response(VERIFICATION_FILES[url.pathname], {
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Stats API
    if (url.pathname.startsWith("/api/stats")) {
      const [visitsRaw, usersResult] = await Promise.all([
        env.ANNOTATIONS_KV.get("stats:visits:total"),
        env.DB.prepare("SELECT COUNT(*) as count FROM users").first(),
      ]);
      return json({
        visits: parseInt(visitsRaw || "0"),
        users: usersResult?.count || 0,
      });
    }

    if (url.pathname.startsWith("/api/auth")) {
      return handleAuth(request, url, env.DB, secret);
    }

    if (url.pathname.startsWith("/api/comments")) {
      return handleComments(request, url, env.DB, secret);
    }

    if (url.pathname.startsWith("/api/annotations")) {
      return handleAnnotations(request, url, env.ANNOTATIONS_KV);
    }

    if (url.pathname.startsWith("/doc")) {
      // Count page visits (exclude static assets)
      const isPage = !url.pathname.match(/\.[a-z0-9]{2,5}$/i);
      if (isPage) {
        ctx.waitUntil(
          env.ANNOTATIONS_KV.get("stats:visits:total").then(raw =>
            env.ANNOTATIONS_KV.put("stats:visits:total", String(parseInt(raw || "0") + 1))
          )
        );
      }
      const newPath = url.pathname.slice("/doc".length) || "/";
      const targetUrl = `${PAGES_HOST}${newPath}${url.search}`;
      const response = await fetch(new Request(targetUrl, {
        method: request.method,
        headers: request.headers,
      }));
      return response;
    }

    return fetch(request);
  },
};
