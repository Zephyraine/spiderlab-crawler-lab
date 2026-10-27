# SpiderLab 爬虫靶场

一个本地运行的三级渐进式爬虫靶场。关卡数据来自公开页面的真实快照，并在本地稳定提供给练习者。

## 启动

```bash
npm install
npm run dev -- --host 0.0.0.0 --port 4173 --strictPort
```

打开 `http://localhost:4173/`。

## 关卡

- L1 图书列表：`/target/l1/books`，544 条豆瓣读书记录，10 个分类，包含列表、详情和分页。
- L2 上海餐厅：`/target/l2/foods`，427 条大众点评公开研究数据，包含 28 个商圈和 46 个菜系，支持 GET/POST 组合筛选。
- L3 北上广职位：`/target/l3/jobs`，328 条 BOSS 直聘公开岗位，包含 3 个城市和 7 个职位方向，使用 CSRF、Cookie 和 Session 保护 `/api/l3/jobs`。

L3 练习账号：

```text
admin / admin123
```

## 说明

运行以下命令可重新采集公开数据并更新 `data/real-data.json`：

```bash
npm run sync:data
```

采集器不会登录第三方账号、破解验证码或读取用户私有数据。每条记录包含来源平台、原始链接、来源 ID 和采集时间。大众点评数据来自两份公开研究数据集（`Liangchengdeye/DaZhongdianping` 与 `wq1224/dianpingspider`）；豆瓣封面、餐厅图片和公司图标会缓存到本地，无法下载的图片自动使用本地占位图。

开发服务器 `server.mjs` 同时承载 Vite 页面和靶场接口。`npm run build` 可构建界面，但完整爬虫接口练习需要运行开发服务器。
