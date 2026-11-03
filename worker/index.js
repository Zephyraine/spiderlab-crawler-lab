const enc = new TextEncoder();

const esc = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[char]);
const cookies = (request) => Object.fromEntries((request.headers.get("cookie") || "").split(";").filter(Boolean).map((item) => item.trim().split("=").map(decodeURIComponent)));
const sendJson = (value, status = 200, headers = {}) => new Response(JSON.stringify(value), { status, headers:{ "content-type":"application/json; charset=utf-8", ...headers } });
const levels = [["L1","图书列表","/target/l1/books"],["L2","上海餐厅","/target/l2/foods"],["L3","北上广职位","/target/l3/jobs"]];
const levelNav = (active) => `<nav class="level-switch" aria-label="关卡切换">${levels.map(([id,label,href])=>`<a class="${active===id?"active":""}" href="${href}"><span>${id}</span><b>${label}</b></a>`).join("")}</nav>`;
const shell = (title, content, active) => `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="/assets/spider-mascot.png" type="image/png"><title>${esc(title)} · SpiderLab</title><link rel="stylesheet" href="/target.css"><link rel="stylesheet" href="/lab-overrides.css"></head><body><header class="target-nav"><a class="target-brand" href="/"><img src="/assets/spider-mascot.png" alt=""><b>SpiderLab</b><small>爬虫靶场</small></a><a href="/">关卡首页</a></header>${levelNav(active)}${content}<footer>SpiderLab · 公开数据快照</footer></body></html>`;
const pagination = (page, totalPages, category) => `<nav class="pagination">${Array.from({length:totalPages},(_,i)=>i+1).map((value)=>`<a class="${value===page?"active":""}" href="/target/l1/books?page=${value}&category=${encodeURIComponent(category)}">${value}</a>`).join("")}</nav>`;

async function snapshot(env, requestUrl) {
  const url = new URL("/real-data.json", requestUrl);
  const response = await env.ASSETS.fetch(new Request(url));
  if (!response.ok) throw new Error("real-data.json unavailable");
  return response.json();
}

const bytesToBase64Url = (bytes) => {
  let binary = ""; for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
};
async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), {name:"HMAC",hash:"SHA-256"}, false, ["sign"]);
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(value))));
}
async function createSession(env) {
  const payload = `${Date.now() + 30 * 60 * 1000}.${crypto.randomUUID()}`;
  return `${payload}.${await sign(payload, env.SESSION_SECRET || "spiderlab-practice-session-v1")}`;
}
async function validSession(request, env) {
  const token = cookies(request).crawler_session || ""; const parts = token.split(".");
  if (parts.length !== 3 || Number(parts[0]) <= Date.now()) return false;
  const payload = `${parts[0]}.${parts[1]}`;
  return parts[2] === await sign(payload, env.SESSION_SECRET || "spiderlab-practice-session-v1");
}

async function handleL1(request, env, url) {
  const { books } = await snapshot(env, request.url);
  const detail = url.pathname.match(/^\/target\/l1\/books\/(\d+)$/)?.[1];
  if (detail) {
    const book = books.find((item)=>item.id===Number(detail));
    if (!book) return new Response("Not found", {status:404});
    const content = `<main class="target-wrap"><a class="back" href="/target/l1/books">← 返回图书列表</a><article class="detail"><img src="${esc(book.image)}" alt=""><div><span class="eyebrow">${esc(book.category)} · ${esc(book.year)}</span><h1>${esc(book.title)}</h1><p class="lead">${esc(book.description)}</p><dl><dt>作者</dt><dd>${esc(book.author)}</dd><dt>出版社</dt><dd>${esc(book.publisher)}</dd><dt>评分</dt><dd>${esc(book.score||"—")}（${book.reviews} 人评价）</dd><dt>数据来源</dt><dd><span class="source-note">${esc(book.source_platform)}公开数据快照</span></dd><dt>采集时间</dt><dd>${esc(book.collected_at)}</dd></dl></div></article></main>`;
    return new Response(shell(book.title, content, "L1"), {headers:{"content-type":"text/html; charset=utf-8"}});
  }
  const category = url.searchParams.get("category") || ""; const filtered = books.filter((book)=>!category||book.category===category);
  const totalPages = Math.max(1,Math.ceil(filtered.length/20)); const page = Math.max(1,Math.min(totalPages,Number(url.searchParams.get("page")||1)));
  const rows = filtered.slice((page-1)*20,page*20); const categories = [...new Set(books.map((book)=>book.category))];
  const cards = rows.map((book)=>`<a class="data-card data-card-link" href="/target/l1/books/${book.id}" aria-label="查看图书 ${esc(book.title)}"><img src="${esc(book.image)}" alt=""><div><span class="eyebrow">${esc(book.category)} · ${esc(book.year)}</span><h2>${esc(book.title)}</h2><p>${esc(book.author)} · ${esc(book.publisher)}</p><strong>${esc(book.score||"—")}</strong><small>${book.reviews} 人评价</small><span class="source-note">${esc(book.source_platform)}公开数据快照</span></div></a>`).join("");
  const content = `<main class="target-wrap"><section class="target-hero books"><p>L1 · 豆瓣读书</p><h1>图书列表</h1><strong>${filtered.length} 本</strong></section><div class="category-bar"><a class="${!category?"active":""}" href="/target/l1/books">全部</a>${categories.map((value)=>`<a class="${category===value?"active":""}" href="/target/l1/books?category=${encodeURIComponent(value)}">${esc(value)}</a>`).join("")}</div><div class="target-meta"><strong>${category?esc(category):"全部分类"}</strong></div><section class="data-grid">${cards}</section>${pagination(page,totalPages,category)}<div class="page-step-nav"><span class="finish">L1 / 03</span><a href="/target/l2/foods"><span><small>下一关</small>L2 上海餐厅</span>→</a></div></main>`;
  return new Response(shell("L1 图书列表",content,"L1"),{headers:{"content-type":"text/html; charset=utf-8"}});
}

async function handleApi(request, env, url) {
  if (url.pathname === "/api/l2/foods/search" && request.method === "POST") {
    const data = await snapshot(env, request.url);
    const body = await request.json().catch(()=>({})); const page = Math.max(1,Number(body.page||1));
    const filtered = data.foods.filter((food)=>(!body.category||food.category===body.category)&&(!body.area||food.area===body.area)&&(!body.keyword||food.name.includes(body.keyword)));
    const limit=18,totalPages=Math.max(1,Math.ceil(filtered.length/limit)),safePage=Math.min(page,totalPages);
    return sendJson({page:safePage,total:filtered.length,total_pages:totalPages,items:filtered.slice((safePage-1)*limit,safePage*limit),areas:[...new Set(data.foods.map((food)=>food.area))].sort(),categories:[...new Set(data.foods.map((food)=>food.category))].sort()});
  }
  const foodId = url.pathname.match(/^\/api\/l2\/foods\/(\d+)$/)?.[1];
  if (foodId && request.method === "GET") {
    const data = await snapshot(env, request.url);
    const food=data.foods.find((item)=>item.id===Number(foodId)); return food?sendJson(food):sendJson({error:"没有找到这家餐厅"},404);
  }
  if (url.pathname === "/api/l3/session" && request.method === "GET") {
    const jar=cookies(request),csrf=jar.crawler_csrf||crypto.randomUUID();
    return sendJson({authenticated:await validSession(request,env),csrf},200,{"set-cookie":`crawler_csrf=${encodeURIComponent(csrf)}; Path=/; SameSite=Lax; Secure; Max-Age=1800`});
  }
  if (url.pathname === "/api/l3/login" && request.method === "POST") {
    const body=await request.json().catch(()=>({})),jar=cookies(request),csrf=body.csrf||request.headers.get("x-csrf-token");
    if(!csrf||csrf!==jar.crawler_csrf)return sendJson({error:"CSRF token 无效"},403);
    if(body.username!=="admin"||body.password!=="admin123")return sendJson({error:"用户名或密码错误"},401);
    return sendJson({ok:true},200,{"set-cookie":`crawler_session=${encodeURIComponent(await createSession(env))}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=1800`});
  }
  if (url.pathname === "/api/l3/logout" && request.method === "POST") return sendJson({ok:true},200,{"set-cookie":"crawler_session=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0"});
  if (url.pathname.startsWith("/api/l3/jobs") && request.method === "GET") {
    if(!await validSession(request,env))return sendJson({error:"请先登录"},401);
    const data = await snapshot(env, request.url);
    const jobId=url.pathname.match(/^\/api\/l3\/jobs\/(\d+)$/)?.[1];
    if(jobId){const job=data.jobs.find((item)=>item.id===Number(jobId));return job?sendJson(job):sendJson({error:"没有找到这个职位"},404);}
    const page=Math.max(1,Number(url.searchParams.get("page")||1)),city=url.searchParams.get("city")||"",category=url.searchParams.get("category")||"",degree=url.searchParams.get("degree")||"",keyword=url.searchParams.get("keyword")||"";
    const filtered=data.jobs.filter((job)=>(!city||job.city===city)&&(!category||job.category===category)&&(!degree||job.degree.includes(degree))&&(!keyword||job.title.toLowerCase().includes(keyword.toLowerCase())||job.company.includes(keyword)));
    const limit=16;return sendJson({page,total:filtered.length,items:filtered.slice((page-1)*limit,page*limit),has_more:page*limit<filtered.length});
  }
  return sendJson({error:"Not found"},404);
}

export default {
  async fetch(request, env) {
    const url=new URL(request.url);
    if(url.pathname.startsWith("/target/l1/books")&&request.method==="GET")return handleL1(request,env,url);
    if(url.pathname.startsWith("/api/"))return handleApi(request,env,url);
    const response=await env.ASSETS.fetch(request); const acceptsHtml=request.headers.get("accept")?.includes("text/html");
    if(response.status!==404||!acceptsHtml||!["GET","HEAD"].includes(request.method))return response;
    const indexUrl=new URL(request.url);indexUrl.pathname="/index.html";indexUrl.search="";
    return env.ASSETS.fetch(new Request(indexUrl,request));
  },
};
