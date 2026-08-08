# Agent Chat Workspace

面向非技术用户的流式 AI 聊天工作台。项目使用 Next.js 提供聊天界面和模型流，使用独立的 FastAPI + SQLite 服务持久化会话。

## 当前能力

- 使用 Vercel AI SDK 的 `useChat` 显示模型的流式回复。
- 新建会话、连续对话，以及刷新页面后的历史恢复。
- 请求失败时显示可读错误和重试入口。
- FastAPI 提供会话创建、读取和完整消息保存接口。
- SQLite 在本地保存会话 ID、消息 JSON、创建时间和更新时间。

## 架构

```text
浏览器
  │ POST /api/chat
  ▼
Next.js（聊天 UI、模型流）
  ├─ 调用 OpenAI-compatible API → DeepSeek 模型
  ├─ 页面服务端创建 / 读取会话
  └─ 流结束时保存完整消息
       │
       ▼
FastAPI（会话 API）
       │
       ▼
SQLite：backend/data/chat.db
```

浏览器不会直接访问 FastAPI；Next.js 服务端通过 `FASTAPI_BASE_URL` 调用它，因此本地开发阶段不需要配置 CORS。

## 本地启动

需要 Node.js、Python 3.11+，以及模型服务的 OpenAI 兼容地址和 API Key。

### 1. 启动 FastAPI

从仓库根目录在第一个终端中执行：

```bash
cd backend
python3.11 -m venv .venv # 仅首次需要
source .venv/bin/activate
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

启动后可访问 [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) 测试会话 API。

### 2. 配置并启动 Next.js

从仓库根目录在第二个终端中执行：

```bash
cd agent-workspace
npm install
npm run dev
```

创建 `agent-workspace/.env.local`，填写实际模型配置；不要提交此文件：

```env
OPENAI_BASE_URL=https://your-model-provider.example/v1
OPENAI_API_KEY=your-api-key
FASTAPI_BASE_URL=http://127.0.0.1:8000
```

打开 [http://localhost:3000/chat](http://localhost:3000/chat) 创建新会话。

## 会话 API

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| `GET` | `/health` | 健康检查 |
| `POST` | `/chats` | 创建空会话 |
| `GET` | `/chats/{id}` | 读取会话历史 |
| `PUT` | `/chats/{id}` | 保存完整 `messages` 数组 |

模型输出结束后，Next.js 的 `onEnd` 回调发起 `PUT /chats/{id}`。因此该请求显示在 FastAPI 终端日志中，而不会显示为浏览器直接发出的网络请求。

## 验证命令

```bash
npm run lint
./node_modules/.bin/tsc --noEmit
```

已手工验证新建会话、流式输出、流结束保存、刷新恢复、连续对话，以及 404 / 422 错误处理。

## 已知限制

- 当前 SQLite 方案适用于单机学习和开发；多用户或生产部署前应重新评估数据库和并发策略。
- 回答只在模型流正常结束后保存；中断时不保证保存部分回复。
- 旧 `.chats` 文件会话已删除，当前版本不迁移旧 JSON 历史。
- 生产构建在当前环境可能因无法下载 Google Fonts 而失败；需在联网环境重试，或改用本地字体。
