# ClawBot Replacement Candidates

这份文件把 `C:\Users\wwx1385281\.openclaw\ClawBot` 中现有文档整理成一个“候选事实池”。

用途不是直接渲染到前台文档站，而是给后续新增页面、改写段落、替换占位符时使用。

## 使用原则

- 产品名统一优先使用 `ClawBot`
- CLI 与配置命令统一优先使用 `openclaw`
- 如果旧资料里出现 `OpenClaw`、`clawbot`、`clawdbot`，默认按 `ClawBot（命令为 openclaw）` 归一
- 涉及端口、Webhook、Tunnel、Feishu 权限等内容时，优先从这份候选池取值
- 如果将来 `ClawBot` 源文档更新，优先同步更新本文件和旁边的 `clawbot-replacement-candidates.json`

## 最常用替换项

| 占位符 | 建议替换值 | 说明 |
| --- | --- | --- |
| `<product-name>` | `ClawBot` | 产品命名统一 |
| `<cli-command>` | `openclaw` | 所有 CLI 命令统一 |
| `<feishu-webhook-path>` | `/feishu/events` | 飞书事件路径 |
| `<local-webhook-url>` | `http://127.0.0.1:3000/feishu/events` | 本地回调地址 |
| `<public-webhook-url>` | `https://<your-domain>/feishu/events` | 公网回调地址 |
| `<gateway-port>` | `18789` | Gateway / ws |
| `<browser-control-port>` | `18791` | browser control |
| `<feishu-webhook-port>` | `3000` | Feishu webhook |
| `<shared-codex-home>` | `/mnt/c/Users/wwx1385281/.codex` | WSL 共享配置目录 |

## 可直接复用的候选表述

### 产品定位

- `ClawBot 是一个面向 Feishu 和 CLI 的本地智能体网关方案。`
- `ClawBot Gateway 位于 Feishu 或 CLI 与底层模型、工具、Skill 之间，负责接入渠道、模型路由与能力编排。`

### 架构与路由

- `默认模型路由示例包括 primary: qwen-portal、code: ollama/qwen2.5-coder、fallback: ollama/qwen2.5。`
- `核心工具可包括 shell、filesystem、web/http、search/docs；Skill 层可包括 openclaw-ops、deploy-helper、feishu-helper、log-troubleshooter。`

### 安装与飞书接入

- `iwr -useb https://molt.bot/install.ps1 | iex`
- `openclaw plugins install @miheng-clawd/feishu`
- `openclaw config set channels.feishu.appid "<YOUR_APP_ID>"`
- `openclaw config set channels.feishu.appSecret "<YOUR_APP_SECRET>"`
- `openclaw gateway restart`
- `openclaw gateway status`

### Tunnel 与网络链路

- `cloudflared tunnel login`
- `cloudflared tunnel create openclaw`
- `cloudflared tunnel route dns openclaw <YOUR_DOMAIN>`
- `cloudflared tunnel run openclaw`
- 推荐叙述：`本地 Feishu webhook 先监听 127.0.0.1:3000，再通过 Cloudflare Tunnel 暴露到公网 HTTPS 地址供飞书事件订阅使用。`

### 模型与 Agent 策略

- `defaults -> openrouter/anthropic/claude-3.7-sonnet`
- `coder -> openrouter/openai/gpt-4o-mini`
- `research -> openrouter/anthropic/claude-3.7-sonnet`
- `@coder` / `@research` 可以作为聊天场景中的 Agent 路由示例

### Token 优化与工程实践

- `成本来源可拆成系统提示、工作区文件、对话历史、工具输出和当轮问题五部分。`
- `QMD 按需知识注入` 适合作为上下文优化章节的核心候选内容
- `本地小模型跑心跳` 适合作为自动化成本控制章节的候选内容

### 运维工作流

- `Windows 长期运维工作流可采用 WSL + tmux + Codex CLI 组合，并共享 CODEX_HOME。`
- `pane 1 跑 codex，pane 2 跑测试，pane 3 跑服务或日志` 可作为日常操作布局候选

## 来源文件

- `README.md`
- `Setup.md`
- `tmux-codexcli.md`
- `tokensave.summary.md`

## 备注

更完整的机器可读版本在：

- `content/authoring/clawbot-replacement-candidates.json`
