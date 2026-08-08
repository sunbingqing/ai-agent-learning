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

- `npm run build` 已启动到生产构建阶段，但当前环境无法连接 Google Fonts，`next/font/google` 拉取 Geist 字体失败；这不是聊天路由的 TypeScript / 打包错误。联网环境下重新验证即可；若要离线构建，再将字体改为本地字体或移除远程字体依赖。
- SQLite 使用本地单文件数据库，适合当前单机学习项目；多用户、并发写入和生产部署前再评估 PostgreSQL 等方案。

## 下一里程碑

为项目 2 规划并实现带引用的私有文档 RAG：文档导入、切块、检索、回答引用与基础评测。
