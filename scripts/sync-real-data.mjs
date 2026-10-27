import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import * as cheerio from "cheerio";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "data");
const imageRoot = path.join(root, "public", "data-images");
const collectedAt = new Date().toISOString();
const headers = { "user-agent": "Mozilla/5.0 (compatible; CrawlerLabResearch/1.0)", "accept-language": "zh-CN,zh;q=0.9" };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const clean = (value = "") => value.replace(/\s+/g, " ").trim();
const absolute = (base, href = "") => href ? new URL(href, base).href : base;

async function getText(url, extraHeaders = {}) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { ...headers, ...extraHeaders } });
      if (!response.ok) throw new Error(`${response.status} ${url}`);
      return response.text();
    } catch (error) {
      lastError = error;
      if (attempt < 3) await sleep(attempt * 700);
    }
  }
  throw new Error(`无法读取 ${url}: ${lastError?.message}`);
}

async function localizeImages(rows, folder, fallback, referer, batchSize = 8, pause = 0) {
  const directory = path.join(imageRoot, folder);
  await mkdir(directory, { recursive: true });
  for (let start = 0; start < rows.length; start += batchSize) {
    await Promise.all(rows.slice(start, start + batchSize).map(async (row, offset) => {
      if (!/^https?:/.test(row.image || "")) { row.image = fallback; return; }
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          const response = await fetch(row.image, { headers: { ...headers, "user-agent": "Mozilla/5.0", referer } });
          if (!response.ok) throw new Error(String(response.status));
          const mime = response.headers.get("content-type") || "";
          const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
          const file = `${String(row.source_id || start + offset + 1).replace(/[^a-zA-Z0-9_-]/g, "_")}.${ext}`;
          await writeFile(path.join(directory, file), Buffer.from(await response.arrayBuffer()));
          row.image = `/data-images/${folder}/${file}`;
          return;
        } catch { if (attempt === 2) row.image = fallback; else await sleep(300); }
      }
    }));
    if (pause) await sleep(pause);
  }
  return rows;
}

async function syncDouban() {
  const tags = ["文学", "小说", "历史", "科普", "艺术", "哲学", "社会学", "心理学", "经济学", "技术"];
  const rows = [];
  for (const tag of tags) {
    for (const start of [0, 20, 40]) {
      const sourcePage = `https://book.douban.com/tag/${encodeURIComponent(tag)}?start=${start}&type=T`;
      const $ = cheerio.load(await getText(sourcePage, { referer: "https://book.douban.com/" }));
      $(".subject-item").each((_, node) => {
        const item = $(node); const link = item.find(".info h2 a").first(); const sourceUrl = link.attr("href") || sourcePage;
        const info = clean(item.find(".pub").text()).split(" / "); const reviewsText = clean(item.find(".pl").text());
        rows.push({
          title: clean(link.attr("title") || link.text()), author: info[0] || "", publisher: info.length >= 3 ? info[info.length - 3] : "",
          year: info.length >= 2 ? info[info.length - 2] : "", price: info.at(-1) || "", score: clean(item.find(".rating_nums").text()) || null,
          reviews: Number((reviewsText.match(/[\d,]+/)?.[0] || "0").replaceAll(",", "")), category: tag,
          description: clean(item.find(".info > p").first().text()), image: absolute(sourcePage, item.find(".pic img").attr("src")),
          source_platform: "豆瓣读书", source_url: sourceUrl, source_id: sourceUrl.match(/subject\/(\d+)/)?.[1] || "", collected_at: collectedAt,
        });
      });
      await sleep(450);
    }
  }
  const unique = [...new Map(rows.filter((row) => row.title).map((row) => [row.source_url, row])).values()].map((row, i) => ({ ...row, id: i + 1 }));
  return localizeImages(unique, "books", "/assets/level-books.png", "https://book.douban.com/", 3, 100);
}

async function syncDianping() {
  const datasetUrl = "https://raw.githubusercontent.com/Liangchengdeye/DaZhongdianping/master/daZhongFood/data/dazhongdianping.sql";
  let sql;
  try { sql = await getText(datasetUrl); }
  catch { sql = await readFile(path.join(dataDir, "raw", "dianping-restaurants.sql"), "utf8"); }
  const rows = [];
  for (const line of sql.split(/\r?\n/)) {
    if (!line.startsWith("INSERT INTO `dazhongfood` VALUES")) continue;
    const values = [...line.matchAll(/'((?:\\'|[^'])*)'/g)].map((m) => m[1].replaceAll("\\'", "'"));
    if (values.length < 15 || values[13] !== "上海") continue;
    const [recordId, sourceUrl, name, sourceId, star, area, category, taste, environment, service, comments, address, image] = values;
    rows.push({ name, city: "上海", area, category, score: (Number(star) / 10).toFixed(1), price: null, reviews: Number(comments) || 0,
      address, taste, environment, service, image: absolute(sourceUrl, image), source_platform: "大众点评", source_url: sourceUrl,
      source_id: sourceId || recordId, dataset_source_url: "https://github.com/Liangchengdeye/DaZhongdianping", collected_at: collectedAt });
  }

  const supplementalSql = await readFile(path.join(dataDir, "raw", "dianping-shanghai-zhangjiang.sql"), "utf8");
  for (const line of supplementalSql.split(/\r?\n/)) {
    const match = line.trim().match(/^\((\d+),(.+)\)[,;]$/);
    if (!match) continue;
    const values = [...match[2].matchAll(/'((?:\\'|[^'])*)'/g)].map((item) => item[1].replaceAll("\\'", "'"));
    if (values.length < 13) continue;
    const [name, sourceUrl, shopLevel, comments, avgCost, taste, environment, service, category, area, coordinates, address, labels] = values;
    const sourceId = sourceUrl.match(/shop\/(\d+)/)?.[1] || `zhangjiang-${match[1]}`;
    const scores = [taste, environment, service].map(Number).filter((value) => value > 0);
    rows.push({
      name, city: "上海", area, category,
      score: scores.length ? (scores.reduce((sum, value) => sum + value, 0) / scores.length / 2).toFixed(1) : null,
      price: Number(avgCost) || null, reviews: Number(comments) || 0, address, taste, environment, service,
      shop_level: shopLevel, coordinates, labels, image: "/assets/level-food.png", source_platform: "大众点评",
      source_url: sourceUrl, source_id: sourceId, dataset_source_url: "https://github.com/wq1224/dianpingspider",
      collected_at: collectedAt,
    });
  }

  const unique = [...new Map(rows.map((row) => [row.source_id, row])).values()].slice(0, 600).map((row, i) => ({ ...row, id: i + 1 }));
  return localizeImages(unique, "foods", "/assets/level-food.png", "https://www.dianping.com/");
}

async function syncBoss() {
  const sourcePages = [
    "https://www.zhipin.com/zhaopin/d162c9a8513006cf03192N-5GA~~/", "https://www.zhipin.com/zhaopin/ea1763b12ecdaa6603Jz2dy9GQ~~/",
    "https://www.zhipin.com/zhaopin/0892e4a0af1f977403N52d68FA~~/", "https://www.zhipin.com/zhaopin/b0ba718999b41bbf1HF909W7Ew~~/",
    "https://www.zhipin.com/zhaopin/7f70ade5c79e834e0XZ_3ti-/", "https://www.zhipin.com/zhaopin/f9eb790d99c8137a33x8092_/",
    "https://www.zhipin.com/zhaopin/7524e29e1484e49c1XN-2dS5/", "https://www.zhipin.com/zhaopin/2f1a99c8ba79759303V62926FA~~/",
    "https://www.zhipin.com/zhaopin/9b96a549e0d2fdc70nZ53dm8Fw~~/", "https://www.zhipin.com/zhaopin/93dde838e97dfbbf03Z72tW4GA~~/",
    "https://www.zhipin.com/zhaopin/9c4ab1e60f5e73c61HB43N60Ew~~/", "https://www.zhipin.com/zhaopin/9bce708d337d705603Jz2di-Fw~~/",
    "https://www.zhipin.com/zhaopin/cbf9dc408b6db4b80nR83N21GA~~/", "https://www.zhipin.com/zhaopin/5d922a0632aa8e621XZ92d64EQ~~/",
    "https://www.zhipin.com/zhaopin/b1530c40192609b31HF90t2_FA~~/",
  ];
  const rows = [];
  for (const sourcePage of sourcePages) {
    const $ = cheerio.load(await getText(sourcePage, { referer: "https://www.zhipin.com/" }));
    $(".job-list li").each((_, node) => {
      const item = $(node); const jobLink = item.find(".info-primary h3.name a").first(); const sourceUrl = absolute(sourcePage, jobLink.attr("href"));
      const titleNode = jobLink.clone(); titleNode.find("span").remove(); const demand = clean(item.find(".job-demand").text());
      const locationInfo = clean(item.find(".info-primary > p").first().text()).split(" "); const companyNode = item.find(".info-company h3.name a").first(); const location = locationInfo[0] || "";
      const title = clean(titleNode.text()); const jobText = `${title} ${demand}`;
      const category = /算法|机器学习|深度学习|大模型|AI|人工智能/i.test(jobText) ? "算法与 AI" : /数据分析|商业分析|BI|数据挖掘/i.test(jobText) ? "数据分析" : /数据开发|数据仓库|数仓|ETL/i.test(jobText) ? "数据开发" : /爬虫|采集|Scrapy|Selenium/i.test(jobText) ? "爬虫采集" : /测试|运维|DevOps/i.test(jobText) ? "测试与运维" : /后端|后台|服务端|Python|Java|Golang|Go开发/i.test(jobText) ? "后端开发" : "其他技术";
      rows.push({ title, salary: clean(jobLink.find(".red").text()), company: clean(companyNode.text()), category,
        city: ["北京", "上海", "广州"].find((city) => location.startsWith(city)) || "", location, degree: locationInfo.at(-1) || "",
        skills: [...new Set((demand.match(/Python|Scrapy|Playwright|Selenium|SQL|Linux|Git|Redis|Django|Flask/gi) || []).map((v) => v[0].toUpperCase() + v.slice(1)))].slice(0, 4),
        description: demand, industry: clean(item.find(".info-company p").first().text()), image: absolute(sourcePage, item.find(".info-company img").attr("src")),
        source_platform: "BOSS直聘", source_url: sourceUrl, source_id: sourceUrl.match(/job_detail\/([^/.]+)/)?.[1] || sourceUrl, collected_at: collectedAt });
    });
    await sleep(650);
  }
  const unique = [...new Map(rows.filter((row) => row.title && row.city).map((row) => [row.source_url, row])).values()].map((row, i) => ({ ...row, id: i + 1 }));
  return localizeImages(unique, "jobs", "/assets/level-jobs.png", "https://www.zhipin.com/");
}

await mkdir(dataDir, { recursive: true }); await mkdir(imageRoot, { recursive: true });
const foodsOnly = process.argv.includes("--foods-only");
const previous = foodsOnly ? JSON.parse(await readFile(path.join(dataDir, "real-data.json"), "utf8")) : null;
const [books, foods, jobs] = foodsOnly
  ? [previous.books, await syncDianping(), previous.jobs]
  : await Promise.all([syncDouban(), syncDianping(), syncBoss()]);
const snapshot = { generated_at: collectedAt, policy: "public metadata snapshots and public research dataset; no authentication bypass, user profiles, contact details, or private data",
  counts: { books: books.length, foods: foods.length, jobs: jobs.length }, books, foods, jobs };
await writeFile(path.join(dataDir, "real-data.json"), `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
console.log(JSON.stringify(snapshot.counts, null, 2));
