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
  { id:"L1", title:"图书列表", kicker:"豆瓣读书", count:"544 条", image:"assets/level-books.png", href:"target/l1/books", icon:BookOpen, tags:["静态 HTML","详情页","10 个分类","分页"] },
  { id:"L2", title:"上海餐厅", kicker:"大众点评", count:"427 条", image:"assets/level-food.png", href:"target/l2/foods", icon:BowlFood, tags:["继承 L1","异步 JSON","组合筛选","站内详情"] },
  { id:"L3", title:"北上广职位", kicker:"BOSS直聘", count:"328 条", image:"assets/level-jobs.png", href:"target/l3/jobs", icon:Briefcase, tags:["继承 L2","Cookie 会话","CSRF 校验","登录鉴权"] },
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
      <div className="level-grid">{levels.map((level)=>{const Icon=level.icon;return <a className="level-card" href={route(level.href)} key={level.id} aria-label={`进入 ${level.id} ${level.title}`}>
        <div className="level-image"><img src={route(level.image)} alt=""/><span>{level.id}</span><em>{level.count}</em></div>
        <div className="level-body"><div className="level-head"><div><p>{level.kicker}</p><h2>{level.title}</h2></div><Icon weight="duotone"/></div><ul>{level.tags.map((tag)=><li key={tag}><CheckCircle weight="fill"/>{tag}</li>)}</ul><span className="primary">进入 {level.id} <ArrowRight weight="bold"/></span></div>
      </a>})}</div>
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
