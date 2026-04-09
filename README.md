# OpenClaw 文档站 (openclaw.aiedi.cn/doc)

基于 Next.js 15 + Cloudflare Pages + Cloudflare Workers 构建的双语文档站，部署在 `https://openclaw.aiedi.cn/doc`。

---

## 视频 → 文章 → 上线 完整工作流

> 这是最常用的内容更新路径：录制或下载一段视频，让 AI 分析内容，自动生成双语文章，部署到线上。
> 换电脑或重新克隆仓库后，按此流程同样适用。

### 前置依赖（一次性安装）

| 工具 | 安装命令 | 用途 |
|------|---------|------|
| Node.js 18+ | 官网下载 | 构建文档站 |
| Wrangler CLI | `npm install -g wrangler` | 部署到 Cloudflare |
| ffmpeg | `winget install ffmpeg` | 提取视频帧供 AI 分析 |
| Claude Code | `npm install -g @anthropic-ai/claude-code` | AI 分析 + 生成文章 |

安装 ffmpeg 后需重启终端（或新开 shell）使 PATH 生效。  
若在 Claude Code 的 bash 会话中，用完整路径调用：  
`~/.../WinGet/Packages/Gyan.FFmpeg_.../ffmpeg-8.1-full_build/bin/ffmpeg.exe`

### 第一步：把视频放进 `video/` 目录

```
Openclaw-web/
└── video/
    └── your-video.mp4   ← 把视频文件放这里
```

文件名无要求，支持 `.mp4`、`.MP4`、`.mov` 等常见格式。

### 第二步：在 Claude Code 中发出指令

打开 Claude Code，切换到 `D:/Openclaw-web` 目录，输入：

```
我在 video/ 里上传了新视频，请分析内容并生成文章上传到网站
```

Claude Code 会自动：
1. 用 ffmpeg 提取关键帧（每 30 秒一帧）
2. 读取帧图像，理解视频主题和内容
3. 对比现有文档，确定新文章的角度
4. 生成中英文双语 MDX 文章
5. 更新导航配置（`navigation.zh.json` / `navigation.json`）

### 第三步：确认生成的文章

文章会出现在：
- 中文：`demo-docs-site/content/docs-zh/guide/<slug>.mdx`
- 英文：`demo-docs-site/content/docs/guide/<slug>.mdx`

本地预览（可选）：

```bash
cd demo-docs-site
npm install   # 首次或依赖变化时
npm run dev
# 访问 http://localhost:3000
```

### 第四步：部署上线

```powershell
# 方式一：一键脚本（推荐）
./deploy.ps1

# 方式二：手动
cd demo-docs-site
npm run build
npx wrangler pages deploy out/ --project-name openclaw-docs --commit-dirty=true --branch=main
```

部署约 30 秒完成，访问 `https://openclaw.aiedi.cn/doc` 验证。

### 换电脑后的完整流程

```bash
# 1. 克隆仓库
git clone <repo-url>
cd Openclaw-web

# 2. 安装工具（见上方"前置依赖"）
winget install ffmpeg
npm install -g wrangler

# 3. 登录 Cloudflare（一次性）
npx wrangler login
# 使用账号 ye.wang.20182131@efrei.net

# 4. 安装 Node 依赖
cd demo-docs-site && npm install && cd ..

# 5. 把视频放进 video/ 目录，在 Claude Code 里发指令
# （同上方第二步）

# 6. 部署
./deploy.ps1
```

> **注意**：`video/` 目录下的视频文件不提交 Git（已在 `.gitignore` 中忽略或体积过大）。
> 换电脑后需重新把视频文件复制到 `video/` 目录，或重新下载。

---

## 目录结构

```
Openclaw-web/
├── demo-docs-site/          # Next.js 文档站主体
│   ├── app/                 # Next.js App Router 页面
│   │   ├── page.tsx         # 中文首页 (/)
│   │   ├── docs/[[...slug]]/page.tsx  # 中文文档页
│   │   ├── en/page.tsx      # 英文首页 (/en)
│   │   └── en/docs/[[...slug]]/page.tsx  # 英文文档页
│   ├── components/          # React 组件
│   ├── content/             # MDX 内容文件（主要编辑区）
│   │   ├── docs-zh/guide/   # 中文 MDX 文档
│   │   ├── docs/guide/      # 英文 MDX 文档
│   │   ├── navigation.zh.json  # 中文导航配置
│   │   └── navigation.json  # 英文导航配置
│   ├── lib/                 # 工具库 (i18n, docs loader)
│   ├── next.config.mjs      # Next.js 配置（静态导出 + basePath）
│   └── out/                 # 构建产物（自动生成，不提交）
├── doc-router/              # Cloudflare Worker（路由代理）
│   ├── worker.js            # Worker 源码
│   └── wrangler.toml        # Wrangler 配置
└── deploy.ps1               # 一键部署脚本
```

---

## 本地开发

### 前置依赖

- Node.js 18+
- npm
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)（用于部署）

```bash
npm install -g wrangler
```

### 启动开发服务器

```bash
cd demo-docs-site
npm install
npm run dev
```

访问 `http://localhost:3000` 查看中文版，`http://localhost:3000/en` 查看英文版。

---

## 内容编辑（日常工作流）

所有文档内容存放在 `demo-docs-site/content/` 目录：

| 文件路径 | 说明 |
|---------|------|
| `content/docs-zh/guide/*.mdx` | 中文文档内容 |
| `content/docs/guide/*.mdx` | 英文文档内容 |
| `content/navigation.zh.json` | 中文导航栏结构（标题、描述、顺序） |
| `content/navigation.json` | 英文导航栏结构 |

**编辑 MDX 文件后，直接运行部署脚本即可同步到线上。**

### MDX 文件格式

```mdx
---
title: 安装和部署
description: 从环境准备到 Gateway 启动的完整部署指南
order: 2
---

# 安装和部署

正文内容，支持标准 Markdown 和 GFM 扩展（表格、代码块、任务列表等）。
```

---

## 部署流程（CI/CD）

### 架构说明

```
本地编辑 MDX
    ↓
npm run build  （生成 out/ 静态文件）
    ↓
wrangler pages deploy out/  （上传到 Cloudflare Pages CDN）
    ↓
Cloudflare Worker 接收 openclaw.aiedi.cn/doc* 请求
    ↓
Worker 转发到 Pages URL（openclaw-docs-17d.pages.dev）
    ↓
用户访问 https://openclaw.aiedi.cn/doc
```

### 一键部署（推荐）

项目根目录有 `deploy.ps1` 脚本，在 PowerShell 中运行：

```powershell
cd D:/Openclaw-web
./deploy.ps1
```

脚本内容：
```powershell
Set-Location demo-docs-site
npm run build
npx wrangler pages deploy out/ --project-name openclaw-docs --commit-dirty=true --branch=main
```

### 手动部署步骤

```bash
# 1. 构建静态文件
cd demo-docs-site
npm run build

# 2. 部署到 Cloudflare Pages
npx wrangler pages deploy out/ --project-name openclaw-docs --commit-dirty=true --branch=main
```

---

## 首次部署（新环境搭建）

如果是全新环境（换电脑或重新配置），按以下顺序操作：

### 1. 登录 Cloudflare

```bash
npx wrangler login
```

使用账号 `ye.wang.20182131@efrei.net` 登录（aiedi.cn 域名所在账号）。

### 2. 创建 Pages 项目（仅首次）

```bash
npx wrangler pages project create openclaw-docs --production-branch=main
```

> 注意：创建后会生成一个新的 Pages URL（如 `openclaw-docs-xxx.pages.dev`）。
> 需要同步更新 `doc-router/worker.js` 中的 `PAGES_HOST` 变量。

### 3. 部署静态文件

```bash
cd demo-docs-site
npm run build
npx wrangler pages deploy out/ --project-name openclaw-docs --commit-dirty=true --branch=main
```

### 4. 部署 Worker（路由代理）

```bash
cd doc-router
npx wrangler deploy
```

Worker 的 `wrangler.toml` 配置：
```toml
name = "openclaw-doc-router"
main = "worker.js"
compatibility_date = "2024-01-01"
account_id = "652120b1b0b9a5755d31e219d1b6c851"
routes = [{ pattern = "openclaw.aiedi.cn/doc*", zone_name = "aiedi.cn" }]
```

---

## 关键配置说明

### next.config.mjs

```js
const nextConfig = {
  reactStrictMode: true,
  output: "export",        // 静态导出，生成纯 HTML/CSS/JS
  basePath: "/doc",        // 所有链接自动加 /doc 前缀
  trailingSlash: true,     // URL 末尾加斜杠，兼容静态文件服务
};
```

### 路由设计（双语）

| URL | 语言 | 对应文件 |
|-----|------|---------|
| `/doc/` | 中文 | `app/page.tsx` |
| `/doc/docs/guide/xxx` | 中文 | `app/docs/[[...slug]]/page.tsx` |
| `/doc/en/` | 英文 | `app/en/page.tsx` |
| `/doc/en/docs/guide/xxx` | 英文 | `app/en/docs/[[...slug]]/page.tsx` |

> 语言切换使用路径前缀（`/en/`），而非 query 参数。
> 这是因为 Next.js 静态导出模式不支持服务端读取 searchParams。

---

## 更新内容后的完整操作流程

```bash
# 第一步：编辑文档
# 修改 demo-docs-site/content/docs-zh/guide/*.mdx（中文）
# 或修改 demo-docs-site/content/docs/guide/*.mdx（英文）

# 第二步：本地预览（可选）
cd demo-docs-site
npm run dev
# 访问 http://localhost:3000 确认效果

# 第三步：构建 + 部署（一行命令）
cd ..
./deploy.ps1
# 或者：
cd demo-docs-site && npm run build && npx wrangler pages deploy out/ --project-name openclaw-docs --commit-dirty=true --branch=main

# 第四步：验证线上
# 访问 https://openclaw.aiedi.cn/doc
```

部署通常在 30 秒内完成，Cloudflare CDN 全球生效。

---

## 常见问题

### Q: 部署报错 "Project not found [code: 8000007]"

Pages 项目在新账号下不存在，需要先创建：
```bash
npx wrangler pages project create openclaw-docs --production-branch=main
```
创建后记录新的 Pages URL，更新 `doc-router/worker.js` 中的 `PAGES_HOST`，然后重新部署 Worker。

### Q: wrangler login 卡在 "submitting"

正常现象，OAuth 回调可能稍慢，等待 30–60 秒。如果终端返回 exit code 0 则成功。
用 `npx wrangler whoami` 确认登录状态。

### Q: 切换语言后内容没有变化

检查 `/en/` 路由是否正确生成。确认 `app/en/page.tsx` 和 `app/en/docs/[[...slug]]/page.tsx` 存在，
且 `lib/i18n.ts` 的 `buildLanguageHref()` 使用路径前缀而非 query 参数。

### Q: 修改了 MDX 但线上没有更新

需要重新构建并部署。Cloudflare Pages 是静态 CDN，不会自动同步本地文件。
每次更新内容后都需要运行部署脚本。

---

## Cloudflare 账号信息

| 项目 | 值 |
|------|---|
| 账号邮箱 | ye.wang.20182131@efrei.net |
| Account ID | 652120b1b0b9a5755d31e219d1b6c851 |
| Pages 项目名 | openclaw-docs |
| Pages URL | openclaw-docs-17d.pages.dev |
| Worker 名称 | openclaw-doc-router |
| 目标域名 | openclaw.aiedi.cn/doc |
