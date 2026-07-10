# 📱 摇一摇广告吐槽榜

匿名吐槽那些烦人的「摇一摇」广告。

## 关于

「摇一摇广告」—— 手机稍微动一下就跳转到广告页面的反人类交互。
这个榜单让你匿名给这些 App 打分、吐槽，让更多人知道哪些 App 在耍流氓。

数据完全公开，大家一起真实记录。

## 功能

- **匿名评分** — 1~5 星为 App 打分，无需登录
- **匿名吐槽** — 写下你被摇一摇广告支配的愤怒
- **自添加 App** — 榜单上还没有的 App，自己加上去
- **黑白主题** — 亮色/暗色一键切换，自动记住偏好
- **真实数据** — 没有假数据，全部来自真实用户吐槽

## 技术栈

- **后端** — Cloudflare Pages Functions
- **存储** — Cloudflare KV（Key-Value 存储）
- **前端** — 原生 HTML + CSS + JavaScript


## 部署到 Cloudflare Pages

1. 打开 https://dash.cloudflare.com/ → **Workers & Pages**
2. 创建 Pages 项目，连接 GitHub 仓库，分支选 `cf-pages`
3. 构建设置：输出目录 `public`，无需 Build Command
4. 在 **设置 → 绑定** 中添加 KV 命名空间：
   - 变量名：`DATA`
   - 预先创建一个 KV 命名空间（名称随意）
5. 保存并部署

## Git 分支说明

- `main` — 原始 Express 版本（适合本地运行）
- `cf-pages` — Cloudflare Pages 版本（线上部署，使用 KV 存储）

> 所有数据存储在 Cloudflare KV 中，**不是**本地 JSON 文件。
