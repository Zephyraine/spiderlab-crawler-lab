import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, BowlFood, Briefcase, CheckCircle, LockKey, MagnifyingGlass, MapPin, SignOut } from "@phosphor-icons/react";
import { StaticLab } from "./StaticLab.jsx";

const BASE = import.meta.env.BASE_URL;
const route = (path = "") => `${BASE}${path.replace(/^\/+/, "")}`;
const appPath = () => {
  const basePath = BASE.endsWith("/") ? BASE.slice(0, -1) : BASE;
  return basePath && window.location.pathname.startsWith(basePath) ? window.location.pathname.slice(basePath.length) || "/" : window.location.pathname;
};

const levels = [
  { id:"L1", title:"图书列表", kicker:"豆瓣读书", count:"544 条", image:"assets/level-books.png", href:"target/l1/books", icon:BookOpen, tags:["静态 HTML","详情页","10 个分类","分页"] },
  { id:"L2", title:"上海餐厅", kicker:"大众点评", count:"427 条", image:"assets/level-food.png", href:"target/l2/foods", icon:BowlFood, tags:["继承 L1","GET / POST","28 个商圈","46 个菜系"] },
  { id:"L3", title:"北上广职位", kicker:"BOSS直聘", count:"328 条", image:"assets/level-jobs.png", href:"target/l3/jobs", icon:Briefcase, tags:["继承 L2","3 个城市","7 个方向","登录鉴权"] },
];

function Logo(){ return <a className="brand" href={route()}><img src={route("assets/spider-mascot.png")} alt=""/><span>SpiderLab</span><small>爬虫靶场</small></a>; }

function LevelSwitch({active}){
  return <nav className="level-switch" aria-label="关卡切换">{levels.map((level)=><a key={level.id} className={active===level.id?"active":""} href={route(level.href)}><span>{level.id}</span><b>{level.title}</b></a>)}</nav>;
}

function Home(){
  return <main className="home">
    <section className="hero">
      <header><Logo/><a className="top-action" href="#levels">选择关卡 <ArrowRight/></a></header>
      <div className="hero-content"><p className="hero-kicker">CRAWLER PRACTICE</p><h1>SpiderLab<br/><span>爬虫靶场</span></h1><div className="hero-tags"><span>静态 HTML</span><span>参数筛选</span><span>登录鉴权</span></div></div>
    </section>
    <section className="levels" id="levels">
      <div className="section-title"><div><span>01—03</span><h2>选择关卡</h2></div><p>难度逐级累加</p></div>
      <div className="progress-line" aria-hidden="true">{levels.map((level,index)=><div className="progress-step" key={level.id}><span>{level.id}</span>{index<levels.length-1&&<i><ArrowRight/></i>}</div>)}</div>
      <div className="level-grid">{levels.map((level)=>{const Icon=level.icon;return <article className="level-card" key={level.id}>
        <div className="level-image"><img src={route(level.image)} alt=""/><span>{level.id}</span><em>{level.count}</em></div>
        <div className="level-body"><div className="level-head"><div><p>{level.kicker}</p><h2>{level.title}</h2></div><Icon weight="duotone"/></div><ul>{level.tags.map((tag)=><li key={tag}><CheckCircle weight="fill"/>{tag}</li>)}</ul><a className="primary" href={route(level.href)}>进入 {level.id} <ArrowRight weight="bold"/></a></div>
      </article>})}</div>
    </section>
    <footer className="home-footer"><Logo/><p>公开数据快照 · 仅供练习</p></footer>
  </main>;
}

function LabHeader({active}){
  return <><header className="lab-header"><Logo/><a className="back-home" href={route()}><ArrowLeft/>关卡首页</a></header><LevelSwitch active={active}/></>;
}

function Jobs(){
  const [session,setSession]=useState({loading:true,authenticated:false,csrf:""});
  const [form,setForm]=useState({username:"admin",password:"admin123"});
  const [error,setError]=useState(""); const [jobs,setJobs]=useState([]); const [meta,setMeta]=useState({total:0,has_more:false});
  const [page,setPage]=useState(1); const [city,setCity]=useState(""); const [category,setCategory]=useState(""); const [degree,setDegree]=useState(""); const [keyword,setKeyword]=useState("");
  const refresh=()=>fetch("/api/l3/session").then(r=>r.json()).then(data=>setSession({loading:false,...data}));
  useEffect(()=>{refresh()},[]);
  useEffect(()=>{if(!session.authenticated)return;const qs=new URLSearchParams({page:String(page),...(city&&{city}),...(category&&{category}),...(degree&&{degree}),...(keyword&&{keyword})});fetch(`/api/l3/jobs?${qs}`).then(async r=>{if(r.status===401){setSession(s=>({...s,authenticated:false}));return null}return r.json()}).then(data=>{if(data){setJobs(prev=>page===1?data.items:[...prev,...data.items]);setMeta(data)}})},[session.authenticated,page,city,category,degree,keyword]);
  const login=async(e)=>{e.preventDefault();setError("");const response=await fetch("/api/l3/login",{method:"POST",headers:{"content-type":"application/json","x-csrf-token":session.csrf},body:JSON.stringify({...form,csrf:session.csrf})});const data=await response.json();if(!response.ok){setError(data.error);return}await refresh()};
  const logout=async()=>{await fetch("/api/l3/logout",{method:"POST"});setJobs([]);setSession(s=>({...s,authenticated:false}))};
  const reset=(setter,value)=>{setter(value);setPage(1);setJobs([])};
  if(session.loading)return <div className="page-loader"><i/></div>;
  if(!session.authenticated)return <main className="lab-page jobs-page"><LabHeader active="L3"/><section className="auth-layout"><div className="auth-visual"><img src={route("assets/level-jobs.png")} alt=""/><span>L3</span></div><form className="login-panel" onSubmit={login}><div className="lock"><LockKey weight="duotone"/></div><p className="section-kicker">SESSION / CSRF</p><h1>职位数据登录</h1><label>用户名<input value={form.username} onChange={e=>setForm({...form,username:e.target.value})}/></label><label>密码<input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label><input type="hidden" name="csrf" value={session.csrf}/>{error&&<p className="form-error">{error}</p>}<button className="primary">登录 <ArrowRight/></button><small>admin / admin123</small></form></section><div className="page-step-nav"><a href={route("target/l2/foods")}><ArrowLeft/><span><small>上一关</small>L2 上海餐厅</span></a><span className="finish">L3 / 03</span></div></main>;
  return <main className="lab-page jobs-page"><LabHeader active="L3"/><section className="job-title"><div><p className="section-kicker">L3 · BOSS直聘</p><h1>北上广职位</h1><p>{meta.total} 条结果</p></div><button className="ghost-button" onClick={logout}><SignOut/>退出</button></section><section className="lab-controls job-filters"><div><MagnifyingGlass/><input value={keyword} placeholder="岗位 / 公司" onChange={e=>reset(setKeyword,e.target.value)}/></div><div><MapPin/><select value={city} onChange={e=>reset(setCity,e.target.value)}><option value="">全部城市</option>{["北京","上海","广州"].map(v=><option key={v}>{v}</option>)}</select></div><select value={category} onChange={e=>reset(setCategory,e.target.value)}><option value="">全部方向</option>{["后端开发","算法与 AI","数据分析","数据开发","爬虫采集","测试与运维","其他技术"].map(v=><option key={v}>{v}</option>)}</select><select value={degree} onChange={e=>reset(setDegree,e.target.value)}><option value="">全部学历</option>{["学历不限","大专","本科","硕士","博士"].map(v=><option key={v}>{v}</option>)}</select></section><section className="job-list">{jobs.map(job=><article key={job.id}><img className="job-logo" src={job.image} alt=""/><div className="job-main"><div><h2>{job.title}</h2><strong>{job.salary}</strong></div><p>{job.company} · {job.location} · {job.degree}</p><div className="job-tags"><span>{job.category}</span>{job.skills.map(skill=><span key={skill}>{skill}</span>)}</div><a className="source-link" href={job.source_url} target="_blank" rel="noreferrer">{job.source_platform} ↗</a></div><ArrowRight className="job-arrow"/></article>)}</section>{meta.has_more&&<button className="load-more" onClick={()=>setPage(p=>p+1)}>加载更多 <ArrowRight/></button>}<div className="page-step-nav"><a href="/target/l2/foods"><ArrowLeft/><span><small>上一关</small>L2 上海餐厅</span></a><span className="finish">完成 L1—L3</span></div></main>;
}

export function App(){ const path=appPath(); if(BASE!=="/"&&path.startsWith("/target/"))return <StaticLab/>; return path.startsWith("/target/l3/jobs")?<Jobs/>:<Home/>; }
