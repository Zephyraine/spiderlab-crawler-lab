import { ArrowRight, BookOpen, BowlFood, Briefcase, CheckCircle, House } from "@phosphor-icons/react";
import { StaticLab } from "./StaticLab.jsx";
import { Foods, Jobs } from "./LabPages.jsx";

const BASE = import.meta.env.BASE_URL;
const route = (path = "") => `${BASE}${path.replace(/^\/+/, "")}`;
const appPath = () => {
  const basePath = BASE.endsWith("/") ? BASE.slice(0, -1) : BASE;
  return basePath && window.location.pathname.startsWith(basePath) ? window.location.pathname.slice(basePath.length) || "/" : window.location.pathname;
};

const levels = [
  { id:"01", code:"L1", title:"图书列表", kicker:"STATIC COLLECTION", source:"豆瓣读书", count:"544 条", image:"assets/level-books.png", href:"target/l1/books", icon:BookOpen, tags:["静态 HTML","详情页","分类筛选","分页"] },
  { id:"02", code:"L2", title:"上海餐厅", kicker:"ASYNC DATA", source:"大众点评", count:"427 条", image:"assets/level-food.png", href:"target/l2/foods", icon:BowlFood, tags:["异步 JSON","组合筛选","站内详情","参数请求"] },
  { id:"03", code:"L3", title:"北上广职位", kicker:"AUTHENTICATED ACCESS", source:"BOSS直聘", count:"328 条", image:"assets/level-jobs.png", href:"target/l3/jobs", icon:Briefcase, tags:["Cookie 会话","CSRF 校验","登录鉴权","动态列表"] },
];

function Logo(){ return <a className="brand" href={route()}><img src={route("assets/spider-logo-light-v2.png")} alt=""/><span>SpiderLab</span><small>爬虫靶场</small></a>; }

function BottomNav({active="home"}){
  const items=[
    {key:"home",label:"首页",href:"",icon:House},
    ...levels.map((level)=>({key:level.code,label:level.title.replace("列表","").replace("上海","").replace("北上广",""),href:level.href,icon:level.icon})),
  ];
  return <nav className="level-switch student-bottom-nav" aria-label="页面切换">{items.map((item)=>{const Icon=item.icon;return <a key={item.key} className={active===item.key?"active":""} href={route(item.href)}><Icon weight={active===item.key?"fill":"regular"}/><b>{item.label}</b></a>})}</nav>;
}

function Home(){
  return <main className="home">
    <header className="target-nav home-nav"><Logo/><span className="header-status"><i/>课程实践</span></header>
    <div className="home-context"><span>COURSE PRACTICE</span><span>SPIDERLAB · 3 个实验</span></div>
    <section className="workspace">
    <section className="hero">
      <div className="hero-content">
        <div className="hero-copy">
          <p className="hero-kicker">SPIDERLAB · CRAWLER LABORATORY</p>
          <h1>爬虫实验室</h1>
          <p className="hero-intro">从静态页面到登录鉴权，在三组渐进式数据采集实验中理解真实网页结构与请求流程。</p>
        </div>
      </div>
    </section>
    <section className="levels" id="levels">
      <div className="level-grid">{levels.map((level)=>{const Icon=level.icon;return <a className="level-card" href={route(level.href)} key={level.id} aria-label={`进入 ${level.code} ${level.title}`}>
        <div className="level-image"><img src={route(level.image)} alt=""/><span>{level.id}</span><em>{level.count}</em></div>
        <div className="level-body">
          <div className="level-head"><div><p>{level.kicker}</p><h2>{level.title}</h2><small>{level.source}</small></div><Icon weight="light"/></div>
          <ul>{level.tags.map((tag)=><li key={tag}><CheckCircle weight="regular"/>{tag}</li>)}</ul>
          <span className="primary">进入实验 <span>{level.code}</span> <ArrowRight weight="light"/></span>
        </div>
      </a>})}</div>
    </section>
    </section>
    <footer className="home-footer"><Logo/><p>公开数据快照 · 仅供练习</p></footer>
    <BottomNav/>
  </main>;
}

export function App(){
  const path=appPath();
  if(BASE!=="/"&&path.startsWith("/target/"))return <StaticLab/>;
  if(path.startsWith("/target/l1/books"))return <StaticLab/>;
  if(path.startsWith("/target/l2/foods"))return <Foods/>;
  if(path.startsWith("/target/l3/jobs"))return <Jobs/>;
  return <Home/>;
}
