import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, MagnifyingGlass, MapPin } from "@phosphor-icons/react";

const BASE = import.meta.env.BASE_URL;
const route = (path = "") => `${BASE}${path.replace(/^\/+/, "")}`;
const image = (path = "") => /^https?:/.test(path) ? path : route(path);
const currentPath = () => {
  const path = window.location.pathname;
  const basePath = BASE.endsWith("/") ? BASE.slice(0, -1) : BASE;
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
};

const levels = [["L1", "图书列表", "target/l1/books"], ["L2", "上海餐厅", "target/l2/foods"], ["L3", "北上广职位", "target/l3/jobs"]];

function Header({ active }) {
  return <>
    <header className="target-nav"><a className="target-brand" href={route()}><img src={route("assets/spider-mascot.png")} alt=""/><b>SpiderLab</b><small>爬虫靶场</small></a><a href={route()}>关卡首页</a></header>
    <nav className="level-switch" aria-label="关卡切换">{levels.map(([id, label, href]) => <a key={id} className={active === id ? "active" : ""} href={route(href)}><span>{id}</span><b>{label}</b></a>)}</nav>
  </>;
}

function Pagination({ page, totalPages, makeHref }) {
  const visible = Array.from({ length: totalPages }, (_, index) => index + 1).filter((value) => totalPages <= 12 || value === 1 || value === totalPages || Math.abs(value - page) <= 2);
  return <nav className="pagination">{visible.map((value, index) => <span key={value} className="page-cluster">{index > 0 && value - visible[index - 1] > 1 && <i>…</i>}<a className={value === page ? "active" : ""} href={makeHref(value)}>{value}</a></span>)}</nav>;
}

function Books({ books, path }) {
  const detailId = path.match(/^\/target\/l1\/books\/(\d+)$/)?.[1];
  if (detailId) {
    const book = books.find((item) => item.id === Number(detailId));
    if (!book) return <main><Header active="L1"/><section className="target-wrap"><h1>没有找到这本书</h1></section></main>;
    return <main><Header active="L1"/><section className="target-wrap"><a className="back" href={route("target/l1/books")}>← 返回图书列表</a><article className="detail"><img src={image(book.image)} alt=""/><div><span className="eyebrow">{book.category} · {book.year}</span><h1>{book.title}</h1><p className="lead">{book.description}</p><dl><dt>作者</dt><dd>{book.author}</dd><dt>出版社</dt><dd>{book.publisher}</dd><dt>定价</dt><dd>{book.price || "—"}</dd>{book.pages&&<><dt>页数</dt><dd>{book.pages}</dd></>}{book.binding&&<><dt>装帧</dt><dd>{book.binding}</dd></>}{book.isbn&&<><dt>ISBN</dt><dd>{book.isbn}</dd></>}<dt>评分</dt><dd>{book.score || "—"}（{book.reviews} 人评价）</dd><dt>数据来源</dt><dd><span className="source-note">{book.source_platform}公开数据快照</span></dd></dl></div></article></section></main>;
  }
  const params = new URLSearchParams(window.location.search); const category = params.get("category") || "";
  const filtered = books.filter((book) => !category || book.category === category); const totalPages = Math.max(1, Math.ceil(filtered.length / 20));
  const page = Math.min(totalPages, Math.max(1, Number(params.get("page") || 1))); const rows = filtered.slice((page - 1) * 20, page * 20);
  const categories = [...new Set(books.map((book) => book.category))];
  const href = (targetPage, targetCategory = category) => route(`target/l1/books?page=${targetPage}&category=${encodeURIComponent(targetCategory)}`);
  return <main><Header active="L1"/><section className="target-wrap"><section className="target-hero books" style={{backgroundImage:`url(${route("assets/level-books.png")})`}}><p>L1 · 豆瓣读书</p><h1>图书列表</h1><strong>{filtered.length} 本</strong></section><div className="category-bar"><a className={!category ? "active" : ""} href={href(1, "")}>全部</a>{categories.map((value) => <a key={value} className={category === value ? "active" : ""} href={href(1, value)}>{value}</a>)}</div><div className="target-meta"><strong>{category || "全部分类"}</strong></div><section className="data-grid">{rows.map((book) => <a className="data-card data-card-link" href={route(`target/l1/books/${book.id}`)} key={book.id} aria-label={`查看图书 ${book.title}`}><img src={image(book.image)} alt=""/><div><span className="eyebrow">{book.category} · {book.year}</span><h2>{book.title}</h2><p>{book.author} · {book.publisher}</p><strong>{book.score || "—"}</strong><small>{book.reviews} 人评价</small><span className="source-note">{book.source_platform}公开数据快照</span></div></a>)}</section><Pagination page={page} totalPages={totalPages} makeHref={href}/><div className="page-step-nav"><span className="finish">L1 / 03</span><a href={route("target/l2/foods")}><span><small>下一关</small>L2 上海餐厅</span>→</a></div></section></main>;
}

function Foods({ foods, path }) {
  const detailId = path.match(/^\/target\/l2\/foods\/(\d+)$/)?.[1];
  if (detailId) {
    const food = foods.find((item) => item.id === Number(detailId));
    if (!food) return <main><Header active="L2"/><section className="target-wrap"><h1>没有找到这家餐厅</h1></section></main>;
    return <main><Header active="L2"/><section className="target-wrap"><a className="back" href={route("target/l2/foods")}>← 返回餐厅列表</a><article className="detail"><img src={image(food.image)} alt=""/><div><span className="eyebrow">{food.area} · {food.category}</span><h1>{food.name}</h1><p className="lead">{food.address}</p><dl><dt>城市</dt><dd>{food.city}</dd><dt>商圈</dt><dd>{food.area}</dd><dt>菜系</dt><dd>{food.category}</dd><dt>评分</dt><dd>{food.score || "—"}（{food.reviews} 条评价）</dd><dt>参考人均</dt><dd>{food.price ? `¥${food.price}` : "公开数据未提供"}</dd><dt>口味</dt><dd>{food.taste || "—"}</dd><dt>环境</dt><dd>{food.environment || "—"}</dd><dt>服务</dt><dd>{food.service || "—"}</dd>{food.shop_level&&<><dt>商户等级</dt><dd>{food.shop_level}</dd></>}{food.labels&&<><dt>特色标签</dt><dd className="detail-tags">{food.labels}</dd></>}{food.coordinates&&<><dt>坐标</dt><dd>{food.coordinates}</dd></>}<dt>数据来源</dt><dd><span className="source-note">{food.source_platform}公开数据快照</span></dd></dl></div></article></section></main>;
  }
  const params = new URLSearchParams(window.location.search); const keyword = params.get("keyword") || ""; const area = params.get("area") || ""; const category = params.get("category") || "";
  const filtered = foods.filter((food) => (!keyword || food.name.includes(keyword)) && (!area || food.area === area) && (!category || food.category === category));
  const totalPages = Math.max(1, Math.ceil(filtered.length / 18)); const page = Math.min(totalPages, Math.max(1, Number(params.get("page") || 1))); const rows = filtered.slice((page - 1) * 18, page * 18);
  const areas = [...new Set(foods.map((food) => food.area))].sort(); const categories = [...new Set(foods.map((food) => food.category))].sort();
  const href = (targetPage) => route(`target/l2/foods?page=${targetPage}&keyword=${encodeURIComponent(keyword)}&area=${encodeURIComponent(area)}&category=${encodeURIComponent(category)}`);
  return <main><Header active="L2"/><section className="target-wrap"><section className="target-hero food" style={{backgroundImage:`url(${route("assets/level-food.png")})`}}><p>L2 · 大众点评</p><h1>上海餐厅</h1><strong>{filtered.length} 家</strong></section><form className="filters" method="get"><input name="keyword" defaultValue={keyword} placeholder="餐厅名称"/><select name="area" defaultValue={area}><option value="">全部商圈</option>{areas.map((value) => <option key={value}>{value}</option>)}</select><select name="category" defaultValue={category}><option value="">全部菜系</option>{categories.map((value) => <option key={value}>{value}</option>)}</select><button>筛选</button></form><div className="target-meta"><strong>{filtered.length} 条结果</strong></div><section className="data-grid">{rows.map((food) => <a className="data-card data-card-link" href={route(`target/l2/foods/${food.id}`)} key={food.id} aria-label={`查看餐厅 ${food.name}`}><img src={image(food.image)} alt=""/><div><span className="eyebrow">{food.area} · {food.category}</span><h2>{food.name}</h2><p>{food.address}</p><strong>{food.score || "—"}</strong><small>{food.reviews} 条评价</small><span className="source-note">{food.source_platform}公开数据快照</span></div></a>)}</section><Pagination page={page} totalPages={totalPages} makeHref={href}/><div className="page-step-nav"><a href={route("target/l1/books")}>←<span><small>上一关</small>L1 图书列表</span></a><a href={route("target/l3/jobs")}><span><small>下一关</small>L3 北上广职位</span>→</a></div></section></main>;
}

function Jobs({ jobs, path }) {
  const [page, setPage] = useState(1); const [city, setCity] = useState(""); const [category, setCategory] = useState(""); const [degree, setDegree] = useState(""); const [keyword, setKeyword] = useState("");
  const detailId = path.match(/^\/target\/l3\/jobs\/(\d+)$/)?.[1];
  if (detailId) {
    const job = jobs.find((item) => item.id === Number(detailId));
    if (!job) return <main><Header active="L3"/><section className="target-wrap"><h1>没有找到这个职位</h1></section></main>;
    return <main><Header active="L3"/><section className="target-wrap"><a className="back" href={route("target/l3/jobs")}>← 返回职位列表</a><article className="detail job-detail"><img src={image(job.image)} alt=""/><div><span className="eyebrow">{job.city} · {job.category}</span><h1>{job.title}</h1><p className="job-salary">{job.salary}</p><p className="lead">{job.description}</p><dl><dt>公司</dt><dd>{job.company}</dd><dt>地点</dt><dd>{job.location}</dd><dt>学历</dt><dd>{job.degree}</dd><dt>行业</dt><dd>{job.industry || "—"}</dd><dt>技能</dt><dd>{job.skills?.length ? job.skills.join("、") : "—"}</dd><dt>数据来源</dt><dd><span className="source-note">{job.source_platform}公开数据快照</span></dd></dl></div></article></section></main>;
  }
  const filtered = useMemo(() => jobs.filter((job) => (!city || job.city === city) && (!category || job.category === category) && (!degree || job.degree.includes(degree)) && (!keyword || job.title.toLowerCase().includes(keyword.toLowerCase()) || job.company.includes(keyword))), [jobs, city, category, degree, keyword]);
  const rows = filtered.slice(0, page * 16); const reset = (setter, value) => { setter(value); setPage(1); };
  return <main className="lab-page jobs-page"><Header active="L3"/><section className="job-title"><div><p className="section-kicker">L3 · BOSS直聘</p><h1>北上广职位</h1><p>{filtered.length} 条结果</p></div></section><section className="lab-controls job-filters"><div><MagnifyingGlass/><input value={keyword} placeholder="岗位 / 公司" onChange={(event) => reset(setKeyword, event.target.value)}/></div><div><MapPin/><select value={city} onChange={(event) => reset(setCity, event.target.value)}><option value="">全部城市</option>{["北京", "上海", "广州"].map((value) => <option key={value}>{value}</option>)}</select></div><select value={category} onChange={(event) => reset(setCategory, event.target.value)}><option value="">全部方向</option>{["后端开发", "算法与 AI", "数据分析", "数据开发", "爬虫采集", "测试与运维", "其他技术"].map((value) => <option key={value}>{value}</option>)}</select><select value={degree} onChange={(event) => reset(setDegree, event.target.value)}><option value="">全部学历</option>{["学历不限", "大专", "本科", "硕士", "博士"].map((value) => <option key={value}>{value}</option>)}</select></section><section className="job-list">{rows.map((job) => <a className="job-card" href={route(`target/l3/jobs/${job.id}`)} key={job.id} aria-label={`查看职位 ${job.title}`}><img className="job-logo" src={image(job.image)} alt=""/><div className="job-main"><div><h2>{job.title}</h2><strong>{job.salary}</strong></div><p>{job.company} · {job.location} · {job.degree}</p><div className="job-tags"><span>{job.category}</span>{job.skills.map((skill) => <span key={skill}>{skill}</span>)}</div><span className="source-note">{job.source_platform}公开数据快照</span></div><ArrowRight className="job-arrow"/></a>)}</section>{rows.length < filtered.length && <button className="load-more" onClick={() => setPage((value) => value + 1)}>加载更多 <ArrowRight/></button>}<div className="page-step-nav"><a href={route("target/l2/foods")}><ArrowLeft/><span><small>上一关</small>L2 上海餐厅</span></a><span className="finish">完成 L1—L3</span></div></main>;
}

export function StaticLab() {
  const [data, setData] = useState(null); const [error, setError] = useState(""); const path = currentPath();
  useEffect(() => { fetch(route("real-data.json")).then((response) => { if (!response.ok) throw new Error(String(response.status)); return response.json(); }).then(setData).catch(() => setError("数据加载失败，请刷新页面")); }, []);
  if (error) return <div className="page-loader"><p>{error}</p></div>; if (!data) return <div className="page-loader"><i/></div>;
  if (path.startsWith("/target/l1/books")) return <Books books={data.books} path={path}/>;
  if (path.startsWith("/target/l2/foods")) return <Foods foods={data.foods} path={path}/>;
  return <Jobs jobs={data.jobs} path={path}/>;
}
