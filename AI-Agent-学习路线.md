# 前端开发者的 AI Agent 学习路线

> 目标：从前端开发转向 **AI 应用 / Agent 全栈工程师**。先能独立做出可靠的 Agent 产品，再按兴趣向 Agent Infra 深入。
>
> 维护方式：后续学习计划、项目设计、复盘和作品链接都持续补充在此目录；本文件作为总路线图。

## 1. 先确定方向

不要把“会调用模型 API”和“能做 Agent 工程”混为一谈。

```text
模型 API + 好的交互体验
        ↓
Tool Calling + 后端服务 + RAG
        ↓
可观测、可评测、权限与失败处理
        ↓
可部署、可维护的 Agent 产品
```

第一阶段的目标岗位是 **AI 应用工程师 / Agent 全栈工程师**，而不是一开始就瞄准需要 Rust、Kubernetes、Sandbox、RL 训练链路的 Agent Infra 岗。

## 2. 知识优先级

### 必须先掌握

- TypeScript / React / Next.js 的 AI 交互：流式输出、Markdown、结构化卡片、任务进度、人工确认、会话状态。
- Python 与 FastAPI：API、异步、SSE、鉴权、后台任务。
- LLM 应用基础：System Prompt、结构化输出、Token 与上下文、模型选择、成本和错误处理。
- Tool / Function Calling：JSON Schema、工具输入输出设计、重试、幂等性与权限。
- RAG：文档解析、切块、Embedding、检索、重排序、引用来源与权限过滤。
- Agent 工程化：状态、Trace、日志、评测集、人工审批、Prompt Injection 防护。
- Docker 与基础部署。

### 做完前述内容后再深入

- MCP Client / Server、OAuth 与第三方工具集成。
- 队列、Redis、PostgreSQL、缓存、限流、任务调度。
- LangGraph 等有状态工作流。
- Kubernetes、Sandbox、浏览器 / 代码执行隔离。
- Rust 与 Agent Runtime。
- RL / Agent 训练链路（偏算法平台或 Agent Infra 岗，不是通用入门要求）。

## 3. 推荐资料（按使用顺序）

### LLM 应用与前端 AI 体验

1. [Vercel AI SDK](https://github.com/vercel/ai)
   - 最适合前端起步；重点学习 streaming、tool UI、structured output 和 AI 聊天界面状态。
2. [OpenAI Cookbook](https://github.com/openai/openai-cookbook)
   - 优先阅读 structured outputs、function/tool calling、RAG、agents、evals 示例；不要试图从头刷完。
3. [Generative AI for Beginners](https://github.com/microsoft/generative-ai-for-beginners)
   - 用来建立 LLM、RAG、安全与应用架构的整体认知。

### Agent 与工作流

1. [AI Agents for Beginners](https://github.com/microsoft/ai-agents-for-beginners)
   - 适合作为 Agent 概念与实践课程，边学边做小实验。
2. [OpenAI Agents SDK for TypeScript](https://github.com/openai/openai-agents-js)
   - 先理解 Agent、工具、handoff、guardrails 的基本抽象；结合原始 API 理解其底层，而非只记 SDK。
3. [LangGraph.js](https://github.com/langchain-ai/langgraphjs)
   - 当需要多步骤、可暂停、可恢复、有人审查的工作流时再学。
4. [Hugging Face Agents Course](https://github.com/huggingface/agents-course)
   - 用于补 Agent 设计原则、评估和生态认知。

### RAG、MCP 与可观测性

1. [LLM Universe（中文）](https://github.com/datawhalechina/llm-universe)
   - RAG 的中文实践资料；重点是检索质量与引用，避免只会“接向量库”。
2. [Model Context Protocol TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
   - 学完 Tool Calling 后，再做一个小型 MCP Server。
3. [Langfuse](https://github.com/langfuse/langfuse)
   - 了解 Agent Trace、Prompt 版本、成本与评测该如何被记录和比较。

### 原理补充（后置）

1. [LLMs from Scratch](https://github.com/rasbt/LLMs-from-scratch)
2. [Neural Networks: Zero to Hero](https://github.com/karpathy/nn-zero-to-hero)

这两份资料适合建立模型原理直觉；它们不是做出第一个 Agent 产品的前置条件。

## 4. 10 周学习与项目计划

| 周期 | 学习主题 | 当周可交付成果 |
| --- | --- | --- |
| 第 1–2 周 | 模型 API、流式 UI、结构化输出 | 项目 1：Agent Chat Workspace |
| 第 3 周 | Python、FastAPI、SSE、数据库与鉴权 | 将项目 1 接入独立服务端并保存会话 |
| 第 4–5 周 | RAG、引用与权限 | 项目 2：私有文档知识库 |
| 第 6–7 周 | Tool Calling、Agent 状态、人工确认 | 项目 3：数据分析 / 业务自动化 Agent |
| 第 8 周 | Trace、Eval、成本与安全 | 为项目 3 建测试集、调用轨迹与失败处理 |
| 第 9 周 | MCP、任务队列、Docker | 接入一个 MCP 工具并容器化部署 |
| 第 10 周 | 整理作品集与复盘 | 可公开演示的 README、架构图、演示视频与技术复盘 |

## 5. 项目路线

### 项目 1：Agent Chat Workspace

**目标**：把前端优势做成作品亮点。

- 流式对话、代码块、文件附件、会话管理。
- 结构化输出展示为表格、卡片、图表或待办，而不只是 Markdown 文本。
- 展示“正在调用哪个工具”“为什么失败”“需要用户确认什么”。
- 技术建议：Next.js + TypeScript + Vercel AI SDK + 任意模型 API。

完成标准：非技术用户能理解 Agent 当前状态，并能修改或确认结果。

### 项目 2：私有文档知识库

**目标**：学会真正有用的 RAG。

- 上传或导入 Markdown / PDF / 网页文档。
- 文档解析、切块、Embedding、检索、回答时附带引用来源。
- 加入“无法从资料确认”的明确拒答策略。
- 增加用户 / 文档权限过滤；不要把所有文档无差别塞给模型。

完成标准：准备 30 个真实问题，记录回答正确率、引用正确率和失败案例。

### 项目 3：带工具的业务 Agent

**目标**：从聊天应用进入 Agent 工程。

示例任选其一：

- 数据分析 Agent：自然语言问题 → 安全查询数据 → 图表与结论。
- 研发助手：读取 Issue / 文档 → 任务拆解 → 生成测试清单。
- 内容运营 Agent：读取素材 → 生成方案 → 人工审核后才执行发布。

必须具备：

- 2–3 个边界明确的工具；所有写操作必须人工确认。
- 输入校验、权限校验、超时、重试和幂等性考虑。
- 工具调用 Trace、Token / 成本记录、失败提示。
- 一组固定 Eval 用例，而不是只凭感觉调 Prompt。

完成标准：能演示正常路径、工具失败、权限不足、模型误用工具和人工拒绝执行五种情况。

## 6. 每周学习方法

每个主题按“**读 → 复刻 → 改造 → 解释**”推进：

1. 读一份官方文档或高质量仓库的一个最小章节。
2. 复刻最小可运行示例，确认自己理解数据如何流动。
3. 改造为自己的业务场景，至少增加一个真实约束，例如权限、失败重试、流式状态或引用。
4. 写一篇短复盘：问题、方案、失败案例、下一步。

建议每周投入比例：

- 40%：写项目。
- 25%：读官方文档和源码示例。
- 20%：调试、测试、记录失败案例。
- 15%：复盘、整理作品集和输出。

每学一个概念，都要回答：它解决什么生产问题？失败时会怎样？如何观察它是否有效？

## 7. 常见误区

- 不要同时学 LangChain、AutoGen、CrewAI、LangGraph。先掌握原始 API + 一个 SDK。
- 不要过早做多 Agent。工具可靠、流程清晰的单 Agent 更有价值。
- 不要把 RAG 等同于向量数据库；检索质量、引用与权限才是关键。
- 不要把 MCP 当成安全方案。MCP 带来工具标准化，也带来权限、信任边界与 Prompt Injection 风险。
- 不要把 Kubernetes、Rust、RL 当入门门票；它们对应更偏平台和基础设施的路线。
- 不要只做 Demo。每个作品至少补上失败处理、日志 / Trace 和可重复测试的问题集。

## 8. 进度记录

### 当前状态

- [x] 确定第一个项目的业务主题：Agent Chat Workspace。
- [x] 实现项目 1 的最小流式聊天链路（待完成端到端手工验收）。
- [ ] 补齐 FastAPI 与会话存储。
- [ ] 完成带引用的 RAG。
- [ ] 完成带人工确认的 Tool Calling。
- [ ] 接入 Trace / Eval。
- [ ] Docker 部署并完成作品集整理。

最近更新：2026-08-06。当前代码已具备 Next.js 前端、Vercel AI SDK 的 `useChat` 流式 UI，以及调用 DeepSeek 模型的 `/api/chat` 路由；详情与今日任务见 `project-01-agent-chat.md`、`weekly-log.md`。

### 后续文件建议

当项目开始后，在此目录新增：

- `project-01-agent-chat.md`：需求、架构、任务拆分与复盘。
- `project-02-rag.md`：数据集、评测题、效果记录。
- `weekly-log.md`：每周学习、踩坑、下周计划。
