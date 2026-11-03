import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";
import worker from "../worker/index.js";

const fixture = {
  books: [{ id:1, title:"测试图书", author:"作者", publisher:"出版社", year:"2026", score:"9.0", reviews:10, category:"文学", description:"完整简介第一段\n\n完整简介第二段", price:"59.00元", pages:"320", binding:"平装", isbn:"9780000000000", image:"/book.jpg", source_platform:"豆瓣读书", collected_at:"2026-01-01" }],
  foods: [{ id:1, name:"测试餐厅", city:"上海", area:"静安寺", category:"火锅", score:"4.8", reviews:20, address:"测试路 1 号", image:"/food.jpg", source_platform:"大众点评" }],
  jobs: [{ id:1, title:"Python 实习生", salary:"200元/天", company:"测试公司", category:"后端开发", city:"上海", location:"上海静安区", degree:"本科", skills:["Python"], image:"/job.jpg", source_platform:"BOSS直聘" }],
};

const apiEnv = {
  ASSETS: {
    fetch: async (request) => new URL(request.url).pathname === "/real-data.json"
      ? new Response(JSON.stringify(fixture), { headers:{ "content-type":"application/json" } })
      : new Response("missing", { status:404 }),
  },
  SESSION_SECRET: "test-session-secret",
};

test("serves existing static assets without a fallback", async () => {
  const calls = [];
  const response = await worker.fetch(new Request("https://example.test/assets/app.js"), {
    ASSETS: {
      fetch: async (request) => {
        calls.push(new URL(request.url).pathname);
        return new Response("asset", { status: 200 });
      },
    },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(calls, ["/assets/app.js"]);
});

test("falls back to index.html for an unknown app route", async () => {
  const calls = [];
  const response = await worker.fetch(
    new Request("https://example.test/flow/step-two?source=share", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async (request) => {
          const url = new URL(request.url);
          calls.push(url.pathname + url.search);
          return new Response(url.pathname === "/index.html" ? "app" : "missing", {
            status: url.pathname === "/index.html" ? 200 : 404,
          });
        },
      },
    },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(calls, ["/flow/step-two?source=share", "/index.html"]);
});

test("serves the L2 and L3 level routes through the app shell", async () => {
  for (const pathname of ["/target/l2/foods", "/target/l3/jobs"]) {
    const calls = [];
    const response = await worker.fetch(
      new Request(`https://example.test${pathname}`, {
        headers: { accept: "text/html" },
      }),
      {
        ASSETS: {
          fetch: async (request) => {
            const url = new URL(request.url);
            calls.push(url.pathname);
            return new Response(url.pathname === "/index.html" ? "app" : "missing", {
              status: url.pathname === "/index.html" ? 200 : 404,
            });
          },
        },
      },
    );

    assert.equal(response.status, 200);
    assert.deepEqual(calls, [pathname, "/index.html"]);
  }
});

test("does not turn missing API or write requests into the app shell", async () => {
  for (const request of [
    new Request("https://example.test/api/missing", { headers: { accept: "application/json" } }),
    new Request("https://example.test/flow", { method: "POST", headers: { accept: "text/html" } }),
  ]) {
    let calls = 0;
    const response = await worker.fetch(request, {
      ASSETS: {
        fetch: async () => {
          calls += 1;
          return new Response("missing", { status: 404 });
        },
      },
    });

    assert.equal(response.status, 404);
    assert.equal(calls, new URL(request.url).pathname.startsWith("/api/") ? 0 : 1);
  }
});

test("emits the files required by Sites packaging", async () => {
  await access(new URL("../dist/client/index.html", import.meta.url));
  await access(new URL("../dist/server/index.js", import.meta.url));
  await access(new URL("../dist/.openai/hosting.json", import.meta.url));
});

test("renders L1 as crawlable HTML with full-card detail links", async () => {
  const response = await worker.fetch(new Request("https://example.test/target/l1/books"), apiEnv);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /class="data-card data-card-link" href="\/target\/l1\/books\/1"/);
  assert.doesNotMatch(html, /GET \/target\/l1\/books/);
});

test("renders complete L1 detail metadata without collection time", async () => {
  const response = await worker.fetch(new Request("https://example.test/target/l1/books/1"), apiEnv);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /完整简介第一段\n\n完整简介第二段/);
  assert.match(html, /<dt>定价<\/dt><dd>59\.00元<\/dd>/);
  assert.match(html, /<dt>ISBN<\/dt><dd>9780000000000<\/dd>/);
  assert.doesNotMatch(html, /采集时间/);
});

test("serves L2 through an unauthenticated JSON search endpoint", async () => {
  const response = await worker.fetch(new Request("https://example.test/api/l2/foods/search", {
    method:"POST", headers:{ "content-type":"application/json" }, body:JSON.stringify({ area:"静安寺", page:1 }),
  }), apiEnv);
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.total, 1);
  assert.equal(data.items[0].name, "测试餐厅");
});

test("protects L3 job data with CSRF and a signed session cookie", async () => {
  const denied = await worker.fetch(new Request("https://example.test/api/l3/jobs"), apiEnv);
  assert.equal(denied.status, 401);

  const session = await worker.fetch(new Request("https://example.test/api/l3/session"), apiEnv);
  const sessionData = await session.json();
  const csrfCookie = session.headers.get("set-cookie").split(";")[0];

  const login = await worker.fetch(new Request("https://example.test/api/l3/login", {
    method:"POST",
    headers:{ "content-type":"application/json", "cookie":csrfCookie, "x-csrf-token":sessionData.csrf },
    body:JSON.stringify({ username:"admin", password:"admin123", csrf:sessionData.csrf }),
  }), apiEnv);
  assert.equal(login.status, 200);
  const authCookie = login.headers.get("set-cookie").split(";")[0];

  const allowed = await worker.fetch(new Request("https://example.test/api/l3/jobs", { headers:{ cookie:authCookie } }), apiEnv);
  const jobs = await allowed.json();
  assert.equal(allowed.status, 200);
  assert.equal(jobs.items[0].title, "Python 实习生");
});

test("fails closed when the Cloudflare session secret is missing", async () => {
  const envWithoutSecret = { ASSETS: apiEnv.ASSETS };
  const session = await worker.fetch(new Request("https://example.test/api/l3/session"), envWithoutSecret);
  const sessionData = await session.json();
  const csrfCookie = session.headers.get("set-cookie").split(";")[0];

  assert.equal(sessionData.authenticated, false);

  const login = await worker.fetch(new Request("https://example.test/api/l3/login", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: csrfCookie, "x-csrf-token": sessionData.csrf },
    body: JSON.stringify({ username: "admin", password: "admin123", csrf: sessionData.csrf }),
  }), envWithoutSecret);

  assert.equal(login.status, 503);
  assert.deepEqual(await login.json(), { error: "服务端登录密钥未配置" });
});
