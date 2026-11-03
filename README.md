# SpiderLab 爬虫靶场

一个三级渐进式爬虫靶场。关卡数据来自公开页面的真实快照，并在本站稳定提供给练习者。

当前在线地址：[GitHub Pages 静态兼容版](https://zephyraine.github.io/spiderlab-crawler-lab/)

GitHub Pages 地址保留为静态兼容版；完整在线版和本地运行版提供真实的异步接口、Cookie Session 与 CSRF 校验。

## 启动

```bash
npm install
npm run dev -- --host 0.0.0.0 --port 4173 --strictPort
```

打开 `http://localhost:4173/`。

## 关卡

- L1 图书列表：服务端 HTML，544 条豆瓣读书记录，包含分类、分页和站内详情。
- L2 上海餐厅：继承 L1，并通过异步 JSON 接口加载 427 条餐厅数据，支持多条件组合筛选和站内详情。
- L3 北上广职位：继承 L2，使用 CSRF、HttpOnly Cookie 和 30 分钟 Session 保护 328 条职位数据及详情接口。

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

开发服务器 `server.mjs` 同时承载 Vite 页面和靶场接口；生产版使用 Worker 提供同等的 L1 页面、L2 JSON 接口和 L3 会话接口。
