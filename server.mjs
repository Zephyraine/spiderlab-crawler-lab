import http from "node:http";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createServer as createViteServer } from "vite";

const arg = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
};

const host = arg("--host", "0.0.0.0");
const port = Number(arg("--port", "4173"));
const snapshot = JSON.parse(readFileSync(new URL("./data/real-data.json", import.meta.url), "utf8"));
const { books, foods, jobs } = snapshot;

const esc = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const cookies = (req) => Object.fromEntries((req.headers.cookie || "").split(";").filter(Boolean).map((item) => item.trim().split("=").map(decodeURIComponent)));
const readBody = (req) => new Promise((resolve) => {
  let body = "";
  req.on("data", (chunk) => { body += chunk; });
  req.on("end", () => resolve(body));
});
const sendJson = (res, value, status = 200, headers = {}) => {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", ...headers });
  res.end(JSON.stringify(value));
};
const levelNav = (active) => `<nav class="level-switch" aria-label="关卡切换">${[["L1","图书列表","/target/l1/books"],["L2","上海餐厅","/target/l2/foods"],["L3","北上广职位","/target/l3/jobs"]].map(([id,label,href])=>`<a class="${active===id?"active":""}" href="${href}"><span>${id}</span><b>${label}</b></a>`).join("")}</nav>`;
const shell = (title, content, active) => `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="/assets/spider-mascot.png" type="image/png"><title>${esc(title)} · SpiderLab</title><link rel="stylesheet" href="/target.css"></head><body><header class="target-nav"><a class="target-brand" href="/"><img src="/assets/spider-mascot.png" alt=""><b>SpiderLab</b><small>爬虫靶场</small></a><a href="/">关卡首页</a></header>${levelNav(active)}${content}<footer>SpiderLab · 公开数据快照</footer></body></html>`;

const renderPagination = (base, page, totalPages, query = "") => `<nav class="pagination">${Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => `<a class="${p === page ? "active" : ""}" href="${base}?page=${p}${query}">${p}</a>`).join("")}</nav>`;
const sessions = new Set();

async function handleLab(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  if (path === "/target/l4/jobs" && req.method === "GET") {
    res.writeHead(302, { location: `/target/l3/jobs${url.search}` }); res.end(); return true;
  }

  if (path === "/target/l1/books" && req.method === "GET") {
    const category = url.searchParams.get("category") || "";
    const filtered = books.filter((book) => !category || book.category === category);
    const totalPages = Math.max(1, Math.ceil(filtered.length / 20));
    const page = Math.max(1, Math.min(totalPages, Number(url.searchParams.get("page") || 1)));
    const rows = filtered.slice((page - 1) * 20, page * 20); const categories = [...new Set(books.map((book)=>book.category))];
    const content = `<main class="target-wrap"><section class="target-hero books"><p>L1 · 豆瓣读书</p><h1>图书列表</h1><strong>${filtered.length} 本</strong></section><div class="category-bar"><a class="${!category?"active":""}" href="/target/l1/books">全部</a>${categories.map((v)=>`<a class="${category===v?"active":""}" href="/target/l1/books?category=${encodeURIComponent(v)}">${esc(v)}</a>`).join("")}</div><div class="target-meta"><strong>${category?esc(category):"全部分类"}</strong><code>GET /target/l1/books?page=${page}</code></div><section class="data-grid">${rows.map((b) => `<article class="data-card"><img src="${esc(b.image)}" alt=""><div><span class="eyebrow">${esc(b.category)} · ${esc(b.year)}</span><h2><a href="/target/l1/books/${b.id}">${esc(b.title)}</a></h2><p>${esc(b.author)} · ${esc(b.publisher)}</p><strong>${esc(b.score || "—")}</strong><small>${b.reviews} 人评价</small><a class="source-link" href="${esc(b.source_url)}" target="_blank" rel="noreferrer">${esc(b.source_platform)} ↗</a></div></article>`).join("")}</section>${renderPagination("/target/l1/books", page, totalPages, `&category=${encodeURIComponent(category)}`)}<div class="page-step-nav"><span class="finish">L1 / 03</span><a href="/target/l2/foods"><span><small>下一关</small>L2 上海餐厅</span>→</a></div></main>`;
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); res.end(shell("L1 图书列表", content, "L1")); return true;
  }

  const bookMatch = path.match(/^\/target\/l1\/books\/(\d+)$/);
  if (bookMatch && req.method === "GET") {
    const book = books.find((b) => b.id === Number(bookMatch[1]));
    if (!book) return false;
    const content = `<main class="target-wrap"><a class="back" href="/target/l1/books">← 返回图书列表</a><article class="detail"><img src="${esc(book.image)}" alt=""><div><span class="eyebrow">${esc(book.category)} · ${esc(book.year)}</span><h1>${esc(book.title)}</h1><p class="lead">${esc(book.description)}</p><dl><dt>作者</dt><dd>${esc(book.author)}</dd><dt>出版社</dt><dd>${esc(book.publisher)}</dd><dt>评分</dt><dd>${esc(book.score || "—")}（${book.reviews} 人评价）</dd><dt>数据来源</dt><dd><a class="source-link" href="${esc(book.source_url)}" target="_blank" rel="noreferrer">${esc(book.source_platform)}原始页面 ↗</a></dd><dt>采集时间</dt><dd>${esc(book.collected_at)}</dd></dl></div></article></main>`;
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); res.end(shell(book.title, content, "L1")); return true;
  }

  if (path === "/target/l2/foods" && ["GET", "POST"].includes(req.method)) {
    let params = url.searchParams;
    if (req.method === "POST") params = new URLSearchParams(await readBody(req));
    const page = Math.max(1, Number(params.get("page") || 1));
    const category = params.get("category") || ""; const area = params.get("area") || ""; const keyword = params.get("keyword") || "";
    const filtered = foods.filter((f) => (!category || f.category === category) && (!area || f.area === area) && (!keyword || f.name.includes(keyword)));
    const totalPages = Math.max(1, Math.ceil(filtered.length / 18));
    const rows = filtered.slice((page - 1) * 18, page * 18);
    const query = `&category=${encodeURIComponent(category)}&area=${encodeURIComponent(area)}&keyword=${encodeURIComponent(keyword)}`;
    const categories = [...new Set(foods.map((food) => food.category))].sort(); const areas = [...new Set(foods.map((food) => food.area))].sort();
    const content = `<main class="target-wrap"><section class="target-hero food"><p>L2 · 大众点评</p><h1>上海餐厅</h1><strong>${filtered.length} 家</strong></section><form class="filters" method="get"><input name="keyword" value="${esc(keyword)}" placeholder="餐厅名称"><select name="area"><option value="">全部商圈</option>${areas.map((v)=>`<option ${area===v?"selected":""}>${esc(v)}</option>`).join("")}</select><select name="category"><option value="">全部菜系</option>${categories.map((v)=>`<option ${category===v?"selected":""}>${esc(v)}</option>`).join("")}</select><button>筛选</button></form><div class="target-meta"><strong>${filtered.length} 条结果</strong><code>${req.method} /target/l2/foods</code></div><section class="data-grid">${rows.map((f)=>`<article class="data-card"><img src="${esc(f.image)}" alt=""><div><span class="eyebrow">${esc(f.area)} · ${esc(f.category)}</span><h2>${esc(f.name)}</h2><p>${esc(f.address)}</p><strong>${esc(f.score || "—")}</strong><small>${f.reviews} 条评价</small><a class="source-link" href="${esc(f.source_url)}" target="_blank" rel="noreferrer">${esc(f.source_platform)} ↗</a></div></article>`).join("")}</section>${renderPagination("/target/l2/foods", page, totalPages, query)}<div class="page-step-nav"><a href="/target/l1/books">←<span><small>上一关</small>L1 图书列表</span></a><a href="/target/l3/jobs"><span><small>下一关</small>L3 北上广职位</span>→</a></div></main>`;
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); res.end(shell("L2 上海餐厅", content, "L2")); return true;
  }

  if (path === "/api/l3/session" && req.method === "GET") {
    const jar = cookies(req); const csrf = jar.crawler_csrf || randomUUID(); const authenticated = sessions.has(jar.crawler_session);
    sendJson(res, { authenticated, csrf }, 200, { "set-cookie": `crawler_csrf=${encodeURIComponent(csrf)}; Path=/; SameSite=Lax` }); return true;
  }

  if (path === "/api/l3/login" && req.method === "POST") {
    const type = req.headers["content-type"] || ""; const raw = await readBody(req); const body = type.includes("application/json") ? JSON.parse(raw || "{}") : Object.fromEntries(new URLSearchParams(raw));
    const jar = cookies(req); const csrf = body.csrf || req.headers["x-csrf-token"];
    if (!csrf || csrf !== jar.crawler_csrf) { sendJson(res, { error: "CSRF token 无效" }, 403); return true; }
    if (body.username !== "admin" || body.password !== "admin123") { sendJson(res, { error: "用户名或密码错误" }, 401); return true; }
    const token = randomUUID(); sessions.add(token);
    sendJson(res, { ok: true }, 200, { "set-cookie": `crawler_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax` }); return true;
  }

  if (path === "/api/l3/logout" && req.method === "POST") {
    const jar = cookies(req); sessions.delete(jar.crawler_session);
    sendJson(res, { ok: true }, 200, { "set-cookie": "crawler_session=; Path=/; Max-Age=0" }); return true;
  }

  if (path === "/api/l3/jobs" && req.method === "GET") {
    const jar = cookies(req); if (!sessions.has(jar.crawler_session)) { sendJson(res, { error: "请先登录" }, 401); return true; }
    const page = Math.max(1, Number(url.searchParams.get("page") || 1)); const city = url.searchParams.get("city") || ""; const category = url.searchParams.get("category") || ""; const degree = url.searchParams.get("degree") || ""; const keyword = url.searchParams.get("keyword") || "";
    const filtered = jobs.filter((j) => (!city || j.city === city) && (!category || j.category === category) && (!degree || j.degree.includes(degree)) && (!keyword || j.title.toLowerCase().includes(keyword.toLowerCase()) || j.company.includes(keyword)));
    const limit = 16; sendJson(res, { page, total: filtered.length, items: filtered.slice((page - 1) * limit, page * limit), has_more: page * limit < filtered.length }); return true;
  }

  return false;
}

const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
const server = http.createServer(async (req, res) => {
  try {
    if (await handleLab(req, res)) return;
    vite.middlewares(req, res, () => { res.statusCode = 404; res.end("Not found"); });
  } catch (error) {
    console.error(error); res.statusCode = 500; res.end("Internal server error");
  }
});

server.listen(port, host, () => console.log(`Crawler Lab running at http://${host}:${port}`));
