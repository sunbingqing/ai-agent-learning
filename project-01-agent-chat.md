# 项目 1：Agent Chat Workspace

## 项目目标

做一个面向非技术用户的聊天式 AI 工作台。用户能清楚看到回复正在生成、请求失败的原因，以及后续工具调用和人工确认的状态。

## 当前进展（2026-08-06）

已完成：

- 初始化 Next.js + TypeScript 项目（`agent-workspace`）。
- 接入 Vercel AI SDK 的 `useChat`，支持在页面中逐段显示模型回复。
- 新增 `POST /api/chat`，通过 OpenAI 兼容接口调用 `xmyun@alibaba/deepseek-v4-pro`。
- 使用 `.env.local` 提供模型服务地址和 API Key（密钥未提交）。
- 完成消息气泡、固定输入区、发送中状态，以及空输入拦截。
- 完成请求校验、用户可读的错误提示和“重试最后一轮”操作。
- 已完成端到端手工验收：正常提问、连续提问、空输入不请求、接口异常提示与重试入口。

待验证 / 待完善：

- 增加会话持久化，再进入 FastAPI 和独立服务端阶段。

## 当前架构

```text
浏览器页面（useChat）
        ↓ POST /api/chat
Next.js Route Handler（streamText）
        ↓ OpenAI-compatible API
DeepSeek 模型
```

## 已知验证项

- `npm run build` 已启动到生产构建阶段，但当前环境无法连接 Google Fonts，`next/font/google` 拉取 Geist 字体失败；这不是聊天路由的 TypeScript / 打包错误。联网环境下重新验证即可；若要离线构建，再将字体改为本地字体或移除远程字体依赖。

## 下一里程碑

完成一个可演示的最小聊天产品：有清晰的界面状态、能处理失败、可重复验证，并有简要的技术说明。
