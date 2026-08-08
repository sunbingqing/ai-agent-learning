# 项目 1：用 FastAPI + SQLite 替换本地会话文件

> 适用项目：`agent-workspace`
> 本阶段目标：不改变聊天体验，只把 `.chats/<chatId>.json` 的存储实现替换为独立的 FastAPI 服务和 SQLite 数据库。
> 建议节奏：每次只做一个小步骤；读 15–25 分钟，写 30–60 分钟，马上验证。

## 先说结论：这次不需要一次学完“后端”

你只需要在实践中理解下面五件事：

1. **HTTP API**：前端（或 Next.js 服务端）通过 `GET`、`POST`、`PUT` 请求后端。
2. **FastAPI 路由**：把一个 URL 和一个 Python 函数对应起来。
3. **请求 / 响应模型**：约定传进来、传出去的数据长什么样。
4. **SQLite**：一个本地数据库文件；用表和 SQL 保存数据，而不是一个会话一个 JSON 文件。
5. **异步边界**：聊天流仍由 Next.js 处理，流结束时再调用 FastAPI 保存完整消息。

暂时不需要学 Docker、用户登录、Redis、消息队列、ORM 高级用法，或把模型流也迁进 Python。

## 本阶段的边界

### 要保持不变的行为

| 用户动作 | 现在的实现 | 迁移后的结果 |
| --- | --- | --- |
| 打开 `/chat` | 创建一个随机 ID 和空 JSON 文件，再跳转 | FastAPI 创建空会话记录，再跳转 |
| 打开 `/chat/:id` | 读取 JSON 文件，传给 `useChat` | 从 FastAPI 读取消息，传给 `useChat` |
| 发送消息 | Next.js 调模型并流式返回 | 完全不变 |
| 模型结束输出 | `onEnd` 写入完整消息数组 | `onEnd` 调 FastAPI，写入 SQLite |
| 刷新页面 | 从 JSON 恢复 | 从 SQLite 恢复 |

### 本阶段明确不做

- 不把浏览器直接连到 FastAPI。
- 不把 DeepSeek / OpenAI 兼容模型调用迁到 FastAPI。
- 不在每个 token 到达时都写数据库。
- 不设计用户账户、多用户隔离、会话标题、删除会话。
- 不急着把每条消息拆成一张数据库记录。

这些限制不是偷工，而是为了只替换一个变量：**存储介质**。模型流、UI 和页面路由保持不动，出问题更容易定位。

## 推荐的目标架构

```text
浏览器
  │ useChat：显示流式内容
  ▼
Next.js
  ├─ /chat                 创建会话（服务端调用 FastAPI）
  ├─ /chat/[id]            读取历史（服务端调用 FastAPI）
  └─ POST /api/chat        调用模型、把内容流给浏览器
                             │
                             └─ 流结束时 onEnd：保存完整 messages
                                        ▼
                                  FastAPI（Python）
                                  ├─ POST /chats
                                  ├─ GET /chats/{id}
                                  └─ PUT /chats/{id}
                                        ▼
                                  SQLite：chat.db
```

这里有一个很重要的工程判断：浏览器先只和 Next.js 通信；Next.js 再访问 FastAPI。因此目前不需要 CORS，也不会把后端地址暴露成 `NEXT_PUBLIC_*` 环境变量。

## 先认识当前代码：只需要看四个地方

| 文件 | 当前职责 | 本阶段是否应改 |
| --- | --- | --- |
| `agent-workspace/util/chat-store.ts` | 创建、读取、保存会话；当前直接读写 `.chats` | 是，改为请求 FastAPI；对外函数名尽量不变 |
| `agent-workspace/app/chat/page.tsx` | 调用 `createChat()`，然后重定向 | 否 |
| `agent-workspace/app/chat/[id]/page.tsx` | 调用 `loadChat(id)`，把历史交给 UI | 否 |
| `agent-workspace/app/api/chat/route.ts` | 模型流式输出；`onEnd` 调用 `saveChat()` | 否，除非补充错误日志 |

这叫做**适配器迁移**：调用方仍然只认识 `createChat`、`loadChat`、`saveChat`，只替换它们内部的实现。它是这次最值得学的设计技巧。

## 数据库设计：从最小模型开始

先只建一张 `chats` 表：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `id` | `TEXT PRIMARY KEY` | 沿用 `generateId()` 生成的会话 ID |
| `messages_json` | `TEXT NOT NULL` | 完整 `UIMessage[]` 的 JSON 字符串，初始值为 `[]` |
| `created_at` | `TEXT NOT NULL` | 创建时间（ISO 8601） |
| `updated_at` | `TEXT NOT NULL` | 最后保存时间（ISO 8601） |

为什么不立刻做 `messages` 表？因为当前应用就是在流结束时整体保存 `UIMessage[]`。先保持同样的数据形状，就能把迁移风险降到最低；以后需要按消息搜索、分页或编辑时，再把消息拆表。

## API 契约：写代码前先固定下来

FastAPI 和 Next.js 都要遵守这份约定。接口路径使用复数名词，响应保持 JSON。

| 用途 | HTTP 请求 | 请求体 | 成功响应 | 失败响应 |
| --- | --- | --- | --- | --- |
| 创建会话 | `POST /chats` | 无 | `201 { "id": "…", "messages": [] }` | `500` |
| 获取历史 | `GET /chats/{id}` | 无 | `200 { "id": "…", "messages": [...] }` | 不存在时 `404` |
| 保存完整历史 | `PUT /chats/{id}` | `{ "messages": [...] }` | `200 { "id": "…", "messages": [...] }` | 不存在时 `404`；非法内容 `422` |
| 健康检查 | `GET /health` | 无 | `200 { "status": "ok" }` | — |

### 关于 `POST`、`GET`、`PUT`

- `POST`：创建新资源。重复调用会创建不同的会话。
- `GET`：只读数据，不应修改数据库。
- `PUT`：用请求中的完整内容替换指定资源。这里正好对应“保存完整 `messages`”。

## 建议目录

在仓库根目录增加一个独立服务目录：

```text
myAI/
├─ agent-workspace/             # 现有 Next.js 应用
├─ backend/
│  ├─ app/
│  │  ├─ __init__.py
│  │  ├─ main.py                # FastAPI 路由
│  │  └─ database.py            # SQLite 连接、建表、SQL 函数
│  ├─ data/                     # 运行时生成 chat.db（不提交）
│  ├─ requirements.txt
│  └─ .gitignore
└─ FastAPI-SQLite-边学边做指南.md
```

`chat.db` 是运行数据，不应提交到 Git；`backend/data/.gitkeep` 可以提交，以保留目录结构。

## 边学边做清单

每完成一项就打勾。没通过验收不要继续下一项。

### 0. 准备 Python 环境（约 20 分钟）

- [x] 确认本机安装 Python 3.11 或更高版本：`python3 --version`。
- [x] 在 `backend` 中创建虚拟环境：`python3 -m venv .venv`。
- [x] 激活虚拟环境：macOS / Linux 使用 `source .venv/bin/activate`。
- [x] 安装最少依赖：`python -m pip install fastapi "uvicorn[standard]"`。
- [x] 把依赖记录到 `requirements.txt`，并忽略 `.venv/` 与 `data/*.db`。

此时理解：虚拟环境只是给这个 Python 服务单独安装依赖，避免污染系统 Python；它和 Node 的 `node_modules` 是同一个思想。

建议阅读（只读到能理解示例即可）：[FastAPI First Steps](https://fastapi.tiangolo.com/tutorial/first-steps/)。

#### FastAPI 文档：这次只需要读这五章

不要从左侧目录自上而下阅读。下面按你写代码的先后顺序打开；每章只要理解“它解决什么问题”和示例代码，不必记住全部细节。

| 标记 | 何时阅读 | 章节 | 这次只需掌握什么 |
| --- | --- | --- | --- |
| **现在必读** | 写 `/health` 前 | [First Steps（第一步）](https://fastapi.tiangolo.com/tutorial/first-steps/) | `app = FastAPI()` 创建应用；`@app.get(...)` 把 URL 绑定到函数；`uvicorn` 启动服务；`/docs` 可测试接口。 |
| **写读取接口前必读** | 实现 `GET /chats/{chat_id}` 前 | [Path Parameters（路径参数）](https://fastapi.tiangolo.com/tutorial/path-params/) | URL 中的 `{chat_id}` 如何自动传入函数参数；不合法值如何处理。 |
| **写保存接口前必读** | 实现 `PUT /chats/{chat_id}` 前 | [Request Body（请求正文）](https://fastapi.tiangolo.com/tutorial/body/) | 用 Pydantic 类描述 JSON 请求体，例如 `{ "messages": [...] }`。 |
| **同一阶段必读** | API 能返回数据后 | [Response Model（响应模型）](https://fastapi.tiangolo.com/tutorial/response-model/) | 明确接口只返回 `id`、`messages` 等约定字段，避免意外暴露内部数据。 |
| **写 404 前必读** | 加入“不存在的会话”处理前 | [Handling Errors（处理错误）](https://fastapi.tiangolo.com/tutorial/handling-errors/) | 用 `HTTPException(status_code=404, ...)` 返回清晰的 API 错误。 |

**暂时跳过**：Query Parameters、Cookie / Header、Security、Dependencies、Background Tasks、WebSockets、Async / Await 的深入章节，以及 SQLModel 教程。它们都不是完成这次“会话存储迁移”的前置知识。

### 1. 先跑通一个没有数据库的 FastAPI（约 20 分钟）

- [x] 在 `backend/app/main.py` 创建 `FastAPI()` 应用。
- [x] 实现 `GET /health`，返回 `{ "status": "ok" }`。
- [x] 用下面命令启动：

```bash
uvicorn app.main:app --reload --port 8000
```

- [x] 打开 [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)，在自动生成的文档中试一次 `/health`。

本步验收：`GET /health` 返回 HTTP 200。这里的 `@app.get("/health")` 就是“把 URL 交给一个函数处理”的路由。

### 2. 建立 SQLite 和初始化表（约 40 分钟）

- [x] 只用 Python 标准库 `sqlite3`，暂时不要引入 SQLAlchemy、SQLModel 或 Alembic。
- [x] 写一个“获取数据库连接”的函数，数据库路径固定在 `backend/data/chat.db`。
- [x] 在应用启动时执行 `CREATE TABLE IF NOT EXISTS chats (...)`。
- [x] 每次写入成功后 `commit()`，不再使用连接时关闭它。

本步要会的 SQL 只有三句：

```sql
INSERT INTO chats (id, messages_json, created_at, updated_at) VALUES (?, ?, ?, ?);
SELECT id, messages_json FROM chats WHERE id = ?;
UPDATE chats SET messages_json = ?, updated_at = ? WHERE id = ?;
```

`?` 是参数占位符，**不要**用字符串拼接把 ID 或消息塞进 SQL；这样才能正确处理引号并避免 SQL 注入。

建议阅读：[Python sqlite3 — How to use placeholders](https://docs.python.org/3/library/sqlite3.html#how-to-use-placeholders-to-bind-values-in-sql-queries)。

### 3. 实现创建和读取 API（约 50 分钟）

- [x] 创建 `POST /chats`：生成 ID，插入一条 `messages_json = "[]"` 的记录。
- [x] 创建 `GET /chats/{chat_id}`：查询记录，解析 `messages_json` 后返回 `messages`。
- [x] 用 Pydantic 响应模型明确声明返回的 `id` 与 `messages` 字段。
- [x] 找不到 ID 时明确抛出 404，不要返回空数组伪装成“空会话”。

在这个阶段，`messages` 可以先声明为 `list[dict]` 或较宽松的 JSON 类型。`UIMessage` 的细节来自 TypeScript / AI SDK，不要在第一个 Python 版本里手工复制一套易过期的复杂 Schema。

本步验收：在 `/docs` 连续执行一次 `POST /chats` 和一次对应 ID 的 `GET /chats/{id}`，两次都能得到同一个 ID 和空数组。

推荐阅读顺序：[FastAPI Request Body](https://fastapi.tiangolo.com/tutorial/body/) → [FastAPI Response Model](https://fastapi.tiangolo.com/tutorial/response-model/)。

### 4. 实现保存 API（约 40 分钟）

- [x] 定义 `SaveChatRequest`，只包含 `messages`。
- [x] 创建 `PUT /chats/{chat_id}`，把请求中的数组 `json.dumps()` 后更新到 `messages_json`。
- [x] 更新时同步修改 `updated_at`。
- [x] 用一条含有用户消息和助手消息的假数据测试 `PUT` 后再 `GET`，确认 JSON 结构没有被改变。

本步验收：同一条会话在 `PUT` 后的 `GET` 返回内容与提交的 `messages` 完全一致（字段顺序可以不同）。

### 5. 将 Next.js 存储层改成 API 适配器（约 60 分钟）

只修改 `agent-workspace/util/chat-store.ts` 的内部实现：

| 函数 | 原来的职责 | 新的 HTTP 调用 |
| --- | --- | --- |
| `createChat()` | 新建 JSON 文件 | `POST ${FASTAPI_BASE_URL}/chats` |
| `loadChat(id)` | 读 JSON 文件 | `GET ${FASTAPI_BASE_URL}/chats/{id}` |
| `saveChat({ id, messages })` | 覆盖 JSON 文件 | `PUT ${FASTAPI_BASE_URL}/chats/{id}` |

- [x] 在 `agent-workspace/.env.local` 设置 `FASTAPI_BASE_URL=http://127.0.0.1:8000`。
- [x] **不要**使用 `NEXT_PUBLIC_FASTAPI_BASE_URL`：当前请求只发生在 Next.js 服务端。
- [x] 对 `fetch` 的非 2xx 响应抛出带状态码的错误，而不是悄悄返回空数组。
- [x] 保留 `createChat`、`loadChat`、`saveChat` 的函数签名，让页面和流式路由不需要改动。
- [x] 删除或停止使用 `fs`、`fs/promises`、`path` 和 `.chats` 目录逻辑。

写 Next.js 代码前，先阅读项目的 `agent-workspace/AGENTS.md` 要求的 Next.js 16 本地文档；版本行为不应靠旧教程猜测。

### 6. 做行为验收（约 30 分钟）

- [x] 同时启动 FastAPI（8000）与 Next.js（通常是 3000）。
- [x] 访问 `/chat`，确认 URL 变为 `/chat/<id>`，且 FastAPI / SQLite 有新记录。
- [x] 发送一条消息，确认文字仍逐段显示，而不是等整段回答结束才出现。
- [x] 等模型输出结束后刷新页面，确认整段历史恢复。
- [x] 连续发送第二条消息，再刷新，确认两轮都存在。
- [x] 手动输入不存在的 `/chat/<id>`，确认页面报错清晰，而不是假装没有历史。

## 关于“流式保存”的真实含义

现有代码在 `app/api/chat/route.ts` 中使用 `toUIMessageStream(... onEnd ...)`。它的逻辑是：

```text
模型不断产生 token → Next.js 持续推给浏览器 → 模型正常结束 → onEnd 保存完整 messages
```

所以本阶段的“保持流式保存”是指：**流式 UI 不变，成功结束时仍保存完整的最终结果**。

它并不意味着每个 token 都已经落库。如果用户中途关闭页面、网络中断或模型报错，尚未执行 `onEnd` 的部分可能不会保存——这也是当前 JSON 方案已有的行为。先保持语义一致；将来需要“断流也保存部分回复”时，再单独设计追加接口、节流写入和中断状态。

## 常见错误与排查顺序

| 现象 | 优先检查 |
| --- | --- |
| FastAPI 启动失败 | 虚拟环境是否激活；`uvicorn app.main:app --reload --port 8000` 是否在 `backend` 目录执行 |
| `404` | 是否复制了完整 chat ID；路径应是 `/chats/{id}`，不是 `/chat/{id}` |
| `422 Unprocessable Entity` | 请求体是否为 JSON；字段名是否是 `messages`；打开 `/docs` 看实际 Schema |
| Next.js 页面创建会话失败 | FastAPI 是否运行；`FASTAPI_BASE_URL` 是否有设置；查看 Next.js 终端中的非 2xx 错误 |
| 发送正常但刷新丢失历史 | 检查 `onEnd` 是否执行；检查 `saveChat` 的 `PUT`；再查看 SQLite 中对应记录 |
| 浏览器报 CORS | 本方案不该发生。检查是否错误地从 Client Component 直接请求了 `http://127.0.0.1:8000` |
| 数据库内容是乱码或 JSON 解析失败 | `json.dumps()` 写入、`json.loads()` 读取；不要二次 `JSON.stringify` / `json.dumps` |

排查原则：先用 FastAPI 的 `/docs` 或 `curl` 证明 API 本身可用，再检查 Next.js 的适配器，最后才看 UI。不要同时修改三层。

## 最小测试样例

在 FastAPI 的 `/docs` 中先完成下面两轮，随后再接 Next.js：

```json
{
  "messages": [
    {
      "id": "message-1",
      "role": "user",
      "parts": [{ "type": "text", "text": "你好" }]
    },
    {
      "id": "message-2",
      "role": "assistant",
      "parts": [{ "type": "text", "text": "你好！有什么可以帮助你？" }]
    }
  ]
}
```

把它提交给 `PUT /chats/{id}` 后再 `GET /chats/{id}`。如果这一步保真，Next.js 的 `useChat` 才有可靠的历史数据可以恢复。

## 完成定义（Definition of Done）

满足以下全部条件，就可以把这个里程碑标记完成：

- [x] `.chats` 不再是运行时的会话数据来源，并已按需求删除旧 JSON 数据。
- [x] FastAPI 在单独进程运行，并能从 `/docs` 测试四个接口。
- [x] SQLite 中存在会话记录，重启 FastAPI 后记录仍然存在。
- [x] 新建会话、发送、流式显示、刷新恢复、连续对话均与迁移前一致。
- [x] 找不到会话、后端不可用、请求体错误时都有可定位的错误，而不是静默丢数据。
- [x] `npm run lint` 与 `tsc --noEmit` 通过。
- [ ] `npm run build` 尚未重新验证：当前环境无法连接 Google Fonts，需在联网环境重试或改用本地字体。
- [x] `backend/.venv`、`backend/data/*.db`、`.env.local` 未被提交；依赖说明和启动方式已写入 README。

## 只在卡住时阅读的资料

按需打开，避免把学习变成收集教程：

1. [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)：优先 First Steps、Request Body、Response Model、Handling Errors。
2. [FastAPI SQL Databases](https://fastapi.tiangolo.com/tutorial/sql-databases/)：完成本阶段后再读，用来理解何时引入 SQLModel / ORM。
3. [Python sqlite3](https://docs.python.org/3/library/sqlite3.html)：重点看参数化查询与事务。
4. [HTTP 状态码参考（MDN）](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Reference/Status)：对 200、201、404、422、500 有概念即可。

## 下一阶段的自然延伸（现在不做）

完成后，可以按产品需要再选择一个方向：

- 把 `messages_json` 拆成 `messages` 表，支持会话列表、标题、搜索和分页。
- 在 FastAPI 增加认证和按用户隔离数据。
- 将模型请求和 SSE 流也迁到 FastAPI，形成真正的单一后端入口。
- 为中断的回答保存“部分内容 + 状态”。

先把这次迁移做稳，后面的设计才会建立在真实的痛点上。
