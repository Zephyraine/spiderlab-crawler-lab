import { ArrowLeft, ArrowRight, BookOpen, BowlFood, Briefcase, CheckCircle } from "@phosphor-icons/react";
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

function Logo(){ return <a className="brand" href={route()}><img src={route("assets/spider-mascot.png")} alt=""/><span>SpiderLab</span><small>爬虫靶场</small></a>; }

function LevelSwitch({active}){
  return <nav className="level-switch" aria-label="关卡切换">{levels.map((level)=><a key={level.id} className={active===level.id?"active":""} href={route(level.href)}><span>{level.id}</span><b>{level.title}</b></a>)}</nav>;
}

function Home(){
  return <main className="home">
    <div className="home-context"><span>数海探真 · 实践课程</span><span>SPIDERLAB / 01—03</span></div>
    <section className="workspace">
    <section className="hero">
      <header>
        <Logo/>
        <nav className="desktop-nav" aria-label="首页导航"><a href="#levels">01—03 实验关卡</a></nav>
      </header>
      <div className="hero-content">
        <div className="hero-copy">
          <p className="hero-kicker">PRACTICE ARCHIVE / CRAWLER LABORATORY</p>
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
  </main>;
}

export function App(){
  const path=appPath();
  if(BASE!=="/"&&path.startsWith("/target/"))return <StaticLab/>;
  if(path.startsWith("/target/l2/foods"))return <Foods/>;
  if(path.startsWith("/target/l3/jobs"))return <Jobs/>;
  return <Home/>;
}
