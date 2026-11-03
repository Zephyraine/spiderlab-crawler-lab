import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, LockKey, MagnifyingGlass, MapPin, SignOut } from "@phosphor-icons/react";

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

async function json(response) {
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || "请求失败"), { status: response.status });
  return data;
}

function SourceNote({ platform }) {
  return <span className="source-note">{platform}公开数据快照</span>;
}

function FoodDetail({ id }) {
  const [food, setFood] = useState(null); const [error, setError] = useState("");
  useEffect(() => { fetch(`/api/l2/foods/${id}`).then(json).then(setFood).catch((e) => setError(e.message)); }, [id]);
  if (error) return <main><Header active="L2"/><section className="target-wrap"><a className="back" href={route("target/l2/foods")}>← 返回餐厅列表</a><p className="empty-state">{error}</p></section></main>;
  if (!food) return <div className="page-loader"><i/></div>;
  return <main><Header active="L2"/><section className="target-wrap"><a className="back" href={route("target/l2/foods")}>← 返回餐厅列表</a><article className="detail"><img src={image(food.image)} alt=""/><div><span className="eyebrow">{food.area} · {food.category}</span><h1>{food.name}</h1><p className="lead">{food.address}</p><dl><dt>城市</dt><dd>{food.city}</dd><dt>商圈</dt><dd>{food.area}</dd><dt>菜系</dt><dd>{food.category}</dd><dt>评分</dt><dd>{food.score || "—"}（{food.reviews} 条评价）</dd><dt>人均</dt><dd>{food.price ? `¥${food.price}` : "暂无"}</dd><dt>口味</dt><dd>{food.taste || "—"}</dd><dt>环境</dt><dd>{food.environment || "—"}</dd><dt>服务</dt><dd>{food.service || "—"}</dd><dt>数据来源</dt><dd><SourceNote platform={food.source_platform}/></dd><dt>采集时间</dt><dd>{food.collected_at}</dd></dl></div></article></section></main>;
}

export function Foods() {
  const detailId = currentPath().match(/^\/target\/l2\/foods\/(\d+)$/)?.[1];
  const [draft, setDraft] = useState({ keyword:"", area:"", category:"" });
  const [filters, setFilters] = useState(draft); const [page, setPage] = useState(1);
  const [data, setData] = useState({ items:[], total:0, total_pages:1, areas:[], categories:[] });
  const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => {
    if (detailId) return;
    setLoading(true); setError("");
    fetch("/api/l2/foods/search", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({...filters, page}) })
      .then(json).then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [detailId, filters, page]);
  if (detailId) return <FoodDetail id={detailId}/>;
  const submit = (event) => { event.preventDefault(); setPage(1); setFilters({...draft}); };
  return <main><Header active="L2"/><section className="target-wrap"><section className="target-hero food"><p>L2 · 大众点评</p><h1>上海餐厅</h1><strong>{data.total} 家</strong></section><form className="filters" onSubmit={submit}><input value={draft.keyword} onChange={(e)=>setDraft({...draft,keyword:e.target.value})} placeholder="餐厅名称"/><select value={draft.area} onChange={(e)=>setDraft({...draft,area:e.target.value})}><option value="">全部商圈</option>{data.areas.map((value)=><option key={value}>{value}</option>)}</select><select value={draft.category} onChange={(e)=>setDraft({...draft,category:e.target.value})}><option value="">全部菜系</option>{data.categories.map((value)=><option key={value}>{value}</option>)}</select><button>筛选</button></form><div className="target-meta"><strong>{data.total} 条结果</strong></div>{error ? <p className="empty-state">{error}</p> : loading ? <div className="inline-loader"><i/></div> : <section className="data-grid">{data.items.map((food)=><a className="data-card data-card-link" href={route(`target/l2/foods/${food.id}`)} key={food.id} aria-label={`查看餐厅 ${food.name}`}><img src={image(food.image)} alt=""/><div><span className="eyebrow">{food.area} · {food.category}</span><h2>{food.name}</h2><p>{food.address}</p><strong>{food.score || "—"}</strong><small>{food.reviews} 条评价</small><SourceNote platform={food.source_platform}/></div></a>)}</section>}<nav className="pagination" aria-label="分页">{Array.from({length:data.total_pages},(_,i)=>i+1).filter((value)=>data.total_pages<=12||value===1||value===data.total_pages||Math.abs(value-page)<=2).map((value)=><button key={value} className={value===page?"active":""} onClick={()=>setPage(value)}>{value}</button>)}</nav><div className="page-step-nav"><a href={route("target/l1/books")}>←<span><small>上一关</small>L1 图书列表</span></a><a href={route("target/l3/jobs")}><span><small>下一关</small>L3 北上广职位</span>→</a></div></section></main>;
}

function JobDetail({ id, onUnauthorized }) {
  const [job, setJob] = useState(null); const [error, setError] = useState("");
  useEffect(() => { fetch(`/api/l3/jobs/${id}`).then(json).then(setJob).catch((e) => { if (e.status === 401) onUnauthorized(); else setError(e.message); }); }, [id]);
  if (error) return <main><Header active="L3"/><section className="target-wrap"><a className="back" href={route("target/l3/jobs")}>← 返回职位列表</a><p className="empty-state">{error}</p></section></main>;
  if (!job) return <div className="page-loader"><i/></div>;
  return <main><Header active="L3"/><section className="target-wrap"><a className="back" href={route("target/l3/jobs")}>← 返回职位列表</a><article className="detail job-detail"><img src={image(job.image)} alt=""/><div><span className="eyebrow">{job.city} · {job.category}</span><h1>{job.title}</h1><p className="job-salary">{job.salary}</p><p className="lead">{job.description}</p><dl><dt>公司</dt><dd>{job.company}</dd><dt>地点</dt><dd>{job.location}</dd><dt>学历</dt><dd>{job.degree}</dd><dt>行业</dt><dd>{job.industry || "—"}</dd><dt>技能</dt><dd>{job.skills?.length ? job.skills.join("、") : "—"}</dd><dt>数据来源</dt><dd><SourceNote platform={job.source_platform}/></dd><dt>采集时间</dt><dd>{job.collected_at}</dd></dl></div></article></section></main>;
}

export function Jobs() {
  const detailId = currentPath().match(/^\/target\/l3\/jobs\/(\d+)$/)?.[1];
  const [session,setSession]=useState({loading:true,authenticated:false,csrf:""});
  const [form,setForm]=useState({username:"admin",password:"admin123"});
  const [error,setError]=useState(""); const [jobs,setJobs]=useState([]); const [meta,setMeta]=useState({total:0,has_more:false});
  const [page,setPage]=useState(1); const [city,setCity]=useState(""); const [category,setCategory]=useState(""); const [degree,setDegree]=useState(""); const [keyword,setKeyword]=useState("");
  const refresh=()=>fetch("/api/l3/session").then(json).then(data=>setSession({loading:false,...data})).catch(()=>setSession({loading:false,authenticated:false,csrf:""}));
  useEffect(()=>{refresh()},[]);
  useEffect(()=>{if(!session.authenticated||detailId)return;const qs=new URLSearchParams({page:String(page),...(city&&{city}),...(category&&{category}),...(degree&&{degree}),...(keyword&&{keyword})});fetch(`/api/l3/jobs?${qs}`).then(json).then(data=>{setJobs(prev=>page===1?data.items:[...prev,...data.items]);setMeta(data)}).catch(e=>{if(e.status===401)setSession(s=>({...s,authenticated:false}))})},[session.authenticated,detailId,page,city,category,degree,keyword]);
  const login=async(e)=>{e.preventDefault();setError("");try{await fetch("/api/l3/login",{method:"POST",headers:{"content-type":"application/json","x-csrf-token":session.csrf},body:JSON.stringify({...form,csrf:session.csrf})}).then(json);setPage(1);await refresh()}catch(err){setError(err.message)}};
  const logout=async()=>{await fetch("/api/l3/logout",{method:"POST"});setPage(1);setJobs([]);setSession(s=>({...s,authenticated:false}))};
  const reset=(setter,value)=>{setter(value);setPage(1);setJobs([])};
  if(session.loading)return <div className="page-loader"><i/></div>;
  if(!session.authenticated)return <main className="lab-page jobs-page"><Header active="L3"/><section className="auth-layout"><div className="auth-visual"><img src={route("assets/level-jobs.png")} alt=""/><span>L3</span></div><form className="login-panel" onSubmit={login}><div className="lock"><LockKey weight="duotone"/></div><p className="section-kicker">L3 · 北上广职位</p><h1>职位数据登录</h1><label>用户名<input value={form.username} onChange={e=>setForm({...form,username:e.target.value})}/></label><label>密码<input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label><input type="hidden" name="csrf" value={session.csrf}/>{error&&<p className="form-error">{error}</p>}<button className="primary">登录 <ArrowRight/></button><small>admin / admin123</small></form></section><div className="page-step-nav"><a href={route("target/l2/foods")}><ArrowLeft/><span><small>上一关</small>L2 上海餐厅</span></a><span className="finish">L3 / 03</span></div></main>;
  if(detailId)return <JobDetail id={detailId} onUnauthorized={()=>setSession(s=>({...s,authenticated:false}))}/>;
  return <main className="lab-page jobs-page"><Header active="L3"/><section className="job-title"><div><p className="section-kicker">L3 · BOSS直聘</p><h1>北上广职位</h1><p>{meta.total} 条结果</p></div><button className="ghost-button" onClick={logout}><SignOut/>退出</button></section><section className="lab-controls job-filters"><div><MagnifyingGlass/><input value={keyword} placeholder="岗位 / 公司" onChange={e=>reset(setKeyword,e.target.value)}/></div><div><MapPin/><select value={city} onChange={e=>reset(setCity,e.target.value)}><option value="">全部城市</option>{["北京","上海","广州"].map(v=><option key={v}>{v}</option>)}</select></div><select value={category} onChange={e=>reset(setCategory,e.target.value)}><option value="">全部方向</option>{["后端开发","算法与 AI","数据分析","数据开发","爬虫采集","测试与运维","其他技术"].map(v=><option key={v}>{v}</option>)}</select><select value={degree} onChange={e=>reset(setDegree,e.target.value)}><option value="">全部学历</option>{["学历不限","大专","本科","硕士","博士"].map(v=><option key={v}>{v}</option>)}</select></section><section className="job-list">{jobs.map(job=><a className="job-card" href={route(`target/l3/jobs/${job.id}`)} key={job.id} aria-label={`查看职位 ${job.title}`}><img className="job-logo" src={image(job.image)} alt=""/><div className="job-main"><div><h2>{job.title}</h2><strong>{job.salary}</strong></div><p>{job.company} · {job.location} · {job.degree}</p><div className="job-tags"><span>{job.category}</span>{job.skills.map(skill=><span key={skill}>{skill}</span>)}</div><SourceNote platform={job.source_platform}/></div><ArrowRight className="job-arrow"/></a>)}</section>{meta.has_more&&<button className="load-more" onClick={()=>setPage(p=>p+1)}>加载更多 <ArrowRight/></button>}<div className="page-step-nav"><a href={route("target/l2/foods")}><ArrowLeft/><span><small>上一关</small>L2 上海餐厅</span></a><span className="finish">完成 L1—L3</span></div></main>;
}
