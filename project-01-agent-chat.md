# 项目 1：Agent Chat Workspace

## 项目目标

做一个面向非技术用户的聊天式 AI 工作台。用户能清楚看到回复正在生成、请求失败的原因，以及后续工具调用和人工确认的状态。

## 当前进展（2026-08-08）

已完成：

- 初始化 Next.js + TypeScript 项目（`agent-workspace`）。
- 接入 Vercel AI SDK 的 `useChat`，支持在页面中逐段显示模型回复。
- 新增 `POST /api/chat`，通过 OpenAI 兼容接口调用 `xmyun@alibaba/deepseek-v4-pro`。
- 使用 `.env.local` 提供模型服务地址和 API Key（密钥未提交）。
- 完成消息气泡、固定输入区、发送中状态，以及空输入拦截。
- 完成请求校验、用户可读的错误提示和“重试最后一轮”操作。
- 已完成端到端手工验收：正常提问、连续提问、空输入不请求、接口异常提示与重试入口。
- 完成从本地 JSON 文件到 FastAPI + SQLite 的会话存储迁移。
- 新增独立 Python 后端：`GET /health`、`POST /chats`、`GET /chats/{id}`、`PUT /chats/{id}`。
- 使用 SQLite 的 `chats` 表保存会话 ID、完整 `UIMessage[]` JSON、创建时间和更新时间。
- 将 Next.js 的 `createChat`、`loadChat`、`saveChat` 改为服务端调用 FastAPI；浏览器仍只请求 Next.js。
- 完成端到端手工验收：新建会话、流式输出、流结束保存、刷新恢复、连续对话、404 与 422 错误处理均符合预期。
- 已生成 Python 依赖清单；`npm run lint` 与 TypeScript 类型检查通过。
- 已按当前需求删除旧 `.chats` 文件会话；不提供旧 JSON 历史迁移。

## 当前架构

```text
浏览器页面（useChat）
        │
        ├─ POST /api/chat
        ▼
Next.js Route Handler（streamText，流式响应）
        ├─ OpenAI-compatible API → DeepSeek 模型
        └─ onEnd → PUT /chats/{id}
                         │
浏览器访问 /chat、/chat/[id] ── Next.js Server Components
                         │ POST / GET /chats
                         ▼
                  FastAPI（独立进程）
                         ▼
                  SQLite：backend/data/chat.db
```

## 已知验证项

- 已移除 `next/font/google` 并改用系统字体，`npm run build -- --webpack` 已完成生产构建，不再依赖 Google Fonts 网络下载。当前 Codex 沙箱的默认 Turbopack 构建受内部端口权限限制；本地或 CI 仍应运行 `npm run build` 验证，若遇到同一环境错误可使用 Webpack 参数。
- SQLite 使用本地单文件数据库，适合当前单机学习项目；多用户、并发写入和生产部署前再评估 PostgreSQL 等方案。

## 项目一收尾学习计划：会话工作台与 FastAPI SSE

> 不立即进入项目 2。先把项目一从“可用聊天 Demo”补成一个可演示的全栈作品，并在过程中完成一次 REST API、SQLite、测试与 SSE 的后端闭环。

### 完成标准

- 可以查看、新建、改名、切换和删除会话；会话按最近更新时间排序。
- FastAPI 提供会话管理 API，并有自动化测试覆盖正常路径和常见失败路径。
- 模型流经过 FastAPI 的 SSE 接口；能区分增量、错误和完成事件，浏览器断开不会让服务异常。
- 聊天能渲染 Markdown 与代码块；至少有一种结构化结果（待办卡片）而不是只显示纯文本。
- 新同学按 README 能启动两端服务，并通过验收清单完成一次验证。

### 学习节奏

每个关卡都按 **读 20 分钟 → 改 45–90 分钟 → 测 20 分钟 → 记录 10 分钟** 执行。一次只动一层，验收通过才进入下一关。

| 关卡 | 要做的功能 | 后端学习重点 | 交付与验收 |
| --- | --- | --- | --- |
| 0. 熟悉现状（约 1 小时） | 从 `/docs` 调用现有接口，跟踪一次新建、读取、保存会话 | HTTP 方法、请求/响应模型、SQLite 数据流、Next.js 与 FastAPI 的边界 | 能画出一次发送消息后数据经过的路径，并说明为什么浏览器不直接访问 FastAPI。 |
| 1. 会话列表（约半天） | `GET /chats` 返回会话摘要；前端增加侧边栏和“新会话”入口 | SQL `SELECT`、排序、响应模型、列表 API 设计 | 新建两条会话后，列表按 `updated_at` 倒序显示，点击可恢复对应历史。 |
| 2. 标题与删除（约半天） | 会话可改标题、删除；SQLite 安全演进表结构 | `ALTER TABLE`、`PATCH`、`DELETE`、204/404、输入校验 | 改名刷新后仍保留；删除后跳回新会话，重复删除得到清晰 404。 |
| 3. 后端自动化测试（约半天） | 为 CRUD API 建立独立测试数据库和测试用例 | pytest、FastAPI `TestClient`、测试隔离、断言状态码与响应体 | 一条命令可执行创建、列表、改名、删除、404 与 422 测试。 |
| 4. SSE 最小实验（约 1–2 小时） | 新增仅用于学习的 SSE 调试端点，依次推送 3 条事件 | `StreamingResponse`、异步生成器、`text/event-stream`、`event` / `data` / 空行格式 | 使用 `curl -N` 看到事件逐条到达，而非最后一次性返回。 |
| 5. FastAPI 模型 SSE（约一天） | FastAPI 调模型并输出标准化 `delta`、`error`、`done` 事件；Next.js 负责桥接到现有聊天 UI | 上游流转发、事件协议、超时、客户端中断、错误边界 | 保持逐字显示；模型正常结束才保存完整消息；配置错误与上游错误可见。 |
| 6. 表达层（约半天） | Markdown/代码块渲染；实现一个待办卡片式结构化结果 | API 契约如何支持前端状态；何时用 JSON Schema/结构化输出 | 代码块可读、可复制；待办不再只是 Markdown 列表。 |
| 7. 交付收尾（约半天） | 完善 README、更新架构图、运行回归与生产构建 | 可复现启动、可观测错误、验收与复盘 | 自动化测试、lint、类型检查、构建和手工流式验收全部通过。 |

### SSE 的目标架构

```text
浏览器（useChat）
       │ POST /api/chat
       ▼
Next.js：保持浏览器协议与 UI 状态
       │ POST /chat/stream
       ▼
FastAPI：调用模型，输出标准化 SSE 事件
       │ data: {"type":"delta","text":"..."}
       ▼
模型服务
```

第一版 SSE 不直接让浏览器访问 FastAPI：这样无需新增 CORS 和浏览器端密钥边界，且能把“浏览器协议”和“模型流协议”分开学习。Next.js 在收到 FastAPI 的 SSE 后，转换为 Vercel AI SDK 所需的 UI 流；模型成功结束时，沿用现有保存逻辑写入完整消息。

### 第一关：现在开始

先不改代码，完成下面的观察练习：

1. 在 `backend` 启动 FastAPI，打开 `http://127.0.0.1:8000/docs`。
2. 依次调用 `POST /chats`、`GET /chats/{id}`、`PUT /chats/{id}`，记录每个请求的 URL、方法、请求体、状态码和响应体。
3. 阅读 `backend/app/main.py`、`backend/app/database.py`、`agent-workspace/util/chat-store.ts` 与 `agent-workspace/app/api/chat/route.ts`。
4. 用自己的话回答：为什么创建会话用 `POST`，保存完整历史用 `PUT`？一次模型回复结束后，哪段代码负责把消息写入 SQLite？

完成后，把你看到的接口结果或两个问题的答案发来；再一起设计 `GET /chats` 的返回结构和数据库查询，不会一次性跳到 SSE 实现。
