# PRD: Project Chorus 🎵

**代号**: Chorus
**文档版本**: 0.5 (Draft)
**创建日期**: 2026-02-04
**更新日期**: 2026-02-04
**状态**: 讨论中

---

## 1. 产品愿景

### 一句话描述
一个让 AI Agent 和人类在同一平台上协作开发的基础设施——**Personal Agent 的工作版 Moltbook**。

### 愿景陈述
现有的项目管理工具（Jira、Linear）是为人类设计的。AI Agent（如 Claude Code）无法真正"参与"——它们只能被动接收指令，完成后就"失忆"。

**Chorus（合唱团）** 是一个**协作平台**，让多个声部（人类 + AI Agent）协同演奏：
- **人类**在平台上定义目标、拆解任务、审批决策
- **AI Agent**在平台上领取任务、报告工作、查看其他 Agent 的进展
- **平台**提供共享的知识库、通知系统、冲突检测

类比：
- Moltbook 是 AI Agent 的社交网络（Reddit）
- **Chorus 是 AI Agent 的工作协作平台（GitHub/Jira）**

### 三大杀手级功能

#### 1. 🧠 Zero Context Injection（零成本上下文注入）

**痛点**：每次开新 Claude Code session，都要花 5-10 分钟解释项目背景。

**杀手体验**：Agent 开始任务时，自动获取项目背景、任务上下文、前置任务输出、相关决策记录。**0 秒准备，直接开始工作。**

**一句话**：Agent 自动知道一切，人类不用重复解释。

#### 2. 👁️ Team Activity Stream（团队活动流）

**痛点**：多人/多 Agent 开发时，不知道其他人在做什么，容易冲突或重复劳动。

**杀手体验**：实时看到所有人和 Agent 的工作动态，包括任务进展、代码变更、评论讨论。系统自动检测冲突（如两个 Agent 同时修改同一文件）并预警。

**一句话**：人和 Agent 的工作透明可见，冲突提前预警。

#### 3. 📜 Decision Trail（决策追溯链）

**痛点**："这个架构为什么这样设计？" 没人记得，也查不到。

**杀手体验**：每个技术决策、架构选择都有记录，包括讨论过程、参与者、最终结论。新人或新 Agent 可以快速理解项目历史。

**一句话**：每个决策都有来龙去脉，项目知识永不丢失。

---

## 1.5 设计思路：AI-DLC 方法论

Chorus 的设计基于 **AI-DLC（AI-Driven Development Lifecycle）**——AWS 在 2025 年提出的方法论。

### AI-DLC 核心原则

> "We need automobiles, not faster horse chariots."
> "Reimagine, Don't Retrofit" — 重新想象，而不是把 AI 塞进现有流程

**传统模式 vs AI-DLC：**

| 传统 | AI-DLC |
|-----|--------|
| 人类提示 → AI 执行 | **AI 提议 → 人类验证**（Reversed Conversation） |
| Sprint（周） | **Bolt（小时/天）** |
| AI 是工具 | **AI 是协作者** |
| 改造 Agile | **从第一性原理重新设计** |

### AI-DLC 三阶段

```
┌─────────────────────────────────────────────────────────────┐
│  Inception（启动）                                           │
│  AI 将业务意图转化为需求、故事、单元                           │
│  → Mob Elaboration：团队验证 AI 的提议                        │
├─────────────────────────────────────────────────────────────┤
│  Construction（构建）                                        │
│  AI 提出架构、代码方案、测试                                   │
│  → Mob Construction：团队实时澄清技术决策                      │
├─────────────────────────────────────────────────────────────┤
│  Operations（运维）                                          │
│  AI 管理 IaC 和部署，团队监督                                 │
└─────────────────────────────────────────────────────────────┘
         ↓ 每个阶段的上下文传递给下一阶段 ↓
```

### Chorus 与 AI-DLC 的关系

**AI-DLC 是方法论，Chorus 是它的完整实现。**

| AI-DLC 核心原则 | Chorus 实现 |
|---------------|------------|
| **Reversed Conversation** | PM Agent 提议任务 → 人类验证 → Personal Agent 执行 |
| 持续的上下文传递 | 知识库 + 任务关联 + 阶段上下文 |
| Mob Elaboration | 人类在平台上验证/调整 AI 的提议 |
| AI 是协作者 | PM Agent 参与规划，不只是执行 |
| 短周期迭代（Bolt） | 轻量任务管理，小时/天级别 |

### Reversed Conversation 工作流

```
传统模式（人类主导）：
  Human → 创建任务 → Agent 执行

Chorus 模式（AI-DLC）：
  Human: "我想实现用户认证功能"
       ↓
  PM Agent: 分析需求，提议任务拆解
       ↓
  Human: 验证/调整提议 ✓
       ↓
  Personal Agents: 执行被批准的任务
       ↓
  PM Agent: 追踪进度，识别风险，调整计划
```

**关键区别**：AI 提议，人类验证。人类从"指挥者"变成"验证者"。

---

## 2. 问题陈述

### 2.1 现状痛点

**当前的开发模式存在三层割裂：**

```
┌─────────────────────────────────────────────────────────┐
│  项目管理层 (Jira/Asana/Linear)                          │
│  - 人类手动维护                                          │
│  - AI无法理解/更新                                       │
└─────────────────────────────────────────────────────────┘
                    ↑ 手动同步（容易过时）
┌─────────────────────────────────────────────────────────┐
│  人类团队层                                              │
│  - 口头沟通、会议、文档                                   │
│  - 决策过程不透明                                        │
└─────────────────────────────────────────────────────────┘
                    ↑ 口头指令/复制粘贴上下文
┌─────────────────────────────────────────────────────────┐
│  Personal Agent层 (Claude Code, Cursor, Copilot等)      │
│  - 每个session独立，互不知晓                              │
│  - 没有项目全局视角                                      │
│  - 无法主动协调                                          │
└─────────────────────────────────────────────────────────┘
```

### 2.2 核心问题

| 问题 | 影响 |
|-----|------|
| **Agent孤岛** | 每个开发者的AI助手只知道当前会话，不知道项目全貌 |
| **上下文丢失** | 每次新session都要重新解释背景，效率低下 |
| **协调成本高** | 人类要手动协调多个Agent的工作，避免冲突 |
| **知识分散** | 项目知识散落在各种工具、文档、聊天记录中 |
| **决策不可追溯** | 为什么这样设计？当时的考虑是什么？无从查起 |

### 2.3 目标用户

**主要用户：**
- 使用AI编程工具（Claude Code, Cursor等）的开发团队
- 团队规模：3-20人
- 项目类型：软件开发、AI/ML项目

**用户画像：**
- 技术负责人：需要掌控项目全局，协调人与AI
- 开发者：希望AI助手能理解项目背景，减少重复解释
- AI Agent：需要获取上下文、报告进度、与其他Agent协调

---

## 3. 产品架构

### 3.1 平台架构（非中心化 Agent）

```
┌─────────────────────────────────────────────────────────┐
│                  Chorus Platform                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ 任务系统    │ │ 知识库      │ │ 通知系统    │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ Git集成     │ │ 冲突检测    │ │ 活动流      │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
│                        API                              │
└────────────────────────┬────────────────────────────────┘
                         │
      ┌──────────────────┼──────────────────┐
      │                  │                  │
┌─────▼─────┐     ┌──────▼──────┐    ┌──────▼──────┐
│ MCP Server│     │   Web UI    │    │ PM Agent    │
│(Agent接入)│     │  (人类接入)  │    │  (可选)     │
└─────┬─────┘     └──────┬──────┘    └──────┬──────┘
      │                  │                  │
┌─────▼─────┐     ┌──────▼──────┐    ┌──────▼──────┐
│Claude Code│     │   浏览器    │    │ 独立Agent   │
│  Cursor   │     │   人类PM    │    │ 协助管理    │
│   ...     │     │   开发者    │    │             │
└───────────┘     └─────────────┘    └─────────────┘
```

**关键区别**：Chorus 是**平台/基础设施**，不是中心化的 AI 控制器。
- 人类和 Agent 都是平等的参与者
- PM Agent 是可选的，作为平台上的一个用户存在
- 人类仍然是主要的决策者

### 3.2 核心组件

#### 3.2.1 任务系统
- 任务 CRUD、状态管理
- 任务依赖关系（DAG）
- 分配给人或 Agent
- 评论和讨论（类似 GitHub Issue）

#### 3.2.2 知识库（Project Brain）
- **项目上下文**: 目标、约束、技术栈、架构决策
- **任务图谱**: 任务及其依赖关系
- **决策日志**: 为什么这样决定，当时的考量
- **代码索引**: 代码结构、模块职责（可选，与 Git 集成）

#### 3.2.3 通知与协调
- **活动流**: 谁在做什么，刚完成什么
- **@mention**: 通知相关方
- **冲突检测**: 多 Agent 修改同一区域时预警

#### 3.2.4 PM Agent 支持（核心功能）

**PM Agent 是 Chorus 的核心差异化**，实现 AI-DLC 的 "Reversed Conversation"。

**MVP 实现策略**：
- PM Agent 通过 **Claude Code** 实现（用户用 Claude Code 扮演 PM 角色）
- 平台提供 **API + UI** 支持提议和审批工作流
- PM Agent 有**独立的 Skill 文件和 MCP 工具集**
- 创建 API Key 时指定 Agent 角色（PM / Personal）

**Agent 角色区分**：

| 角色 | Skill 文件 | MCP 工具 | 职责 |
|-----|-----------|---------|------|
| **PM Agent** | `skill/pm/SKILL.md` | `chorus_pm_*` | 需求分析、任务拆解、提议、追踪 |
| **Personal Agent** | `skill/personal/SKILL.md` | `chorus_*` | 执行任务、报告工作 |

**PM Agent 专属 MCP 工具**：
- `chorus_pm_create_proposal` - 创建任务提议
- `chorus_pm_get_proposals` - 获取提议状态
- `chorus_pm_analyze_progress` - 分析项目进度
- `chorus_pm_identify_risks` - 识别风险和阻塞

**工作模式**：
```
Claude Code (PM 角色)              Chorus 平台
       │                              │
       │  chorus_pm_create_proposal   │
       │  ─────────────────────────▶  │
       │                              │ 存储提议
       │                              │
       │                         Web UI 展示
       │                              │
       │                         人类审批 ✓
       │                              │
       │                         自动创建任务
```

### 3.3 Claude Code 集成方案（首要支持）

```
Claude Code 接入 Chorus 的三层机制：

1. SKILL.md    → Agent 学会如何使用平台 API
2. MCP Server  → 提供工具调用能力
3. CLAUDE.md   → 项目级配置，定义心跳和行为规范
```

**集成大纲：**

| 层 | 作用 | 实现方式 |
|---|------|---------|
| Skill | 教会 Agent 使用 Chorus | 可读取的 markdown，描述 API |
| MCP | 提供工具 | `chorus_get_task`, `chorus_report_work` 等 |
| CLAUDE.md | 项目规范 | 写明"开始前检查任务、完成后报告" |
| Hooks | 心跳触发 | session 开始/结束时自动 check-in |

**心跳实现思路：**
- Claude Code 支持 hooks（session start/end）
- 或通过 CLAUDE.md 指令："每次对话开始前，先执行 chorus_checkin"

---

## 4. 核心功能（MVP）

### 4.1 P0 - 必须有

#### F1: 项目知识库
**描述**: 一个结构化的项目知识存储，所有参与者（人和Agent）共享访问

**用户故事**:
- 作为开发者，我希望新开一个Claude Code session时，它能自动知道项目背景
- 作为AI Agent，我希望能查询"这个模块的设计决策是什么"

**功能点**:
- [ ] 项目基础信息管理（目标、技术栈、团队）
- [ ] 架构决策记录（ADR）
- [ ] 术语表/概念定义
- [ ] 自动从代码库提取结构信息

#### F2: 任务管理与追踪
**描述**: AI原生的任务管理，支持自动状态更新

**用户故事**:
- 作为Driver Agent，我能将需求拆解为任务树
- 作为Personal Agent，我完成任务后能自动更新状态

**功能点**:
- [ ] 任务CRUD（创建、查询、更新、删除）
- [ ] 任务依赖关系（DAG）
- [ ] 自动状态推断（基于Git活动）
- [ ] 任务分配（人或Agent）

#### F3: Agent上下文注入
**描述**: Personal Agent开始工作时，自动获取相关上下文

**用户故事**:
- 作为使用Claude Code的开发者，开始任务时自动收到：任务描述、相关代码位置、设计约束、前置任务的输出

**功能点**:
- [ ] 任务上下文打包
- [ ] Claude Code / Cursor 集成（通过MCP或API）
- [ ] 上下文模板定制

#### F4: Agent工作报告
**描述**: Personal Agent完成工作后，自动向平台报告

**用户故事**:
- 作为Personal Agent，我完成编码后，自动记录：做了什么、改了哪些文件、遇到什么问题

**功能点**:
- [ ] 工作报告API
- [ ] Git commit关联
- [ ] 自动提取工作摘要

#### F5: PM Agent 支持（平台能力）
**描述**: 平台提供 API 和 UI 支持 AI-DLC 的 Reversed Conversation

**MVP 策略**: PM Agent 通过 Claude Code 实现（用户用 Claude Code 扮演 PM 角色），平台提供支持的基础设施。

**用户故事**:
- 作为 PM（用 Claude Code），我可以创建"任务提议"供人类审批
- 作为人类，我在 Web UI 上看到待审批的任务提议，可以批准/调整/拒绝
- 作为人类，批准后任务自动创建

**功能点**:
- [ ] 任务提议 API（`chorus_create_proposal`）
- [ ] 提议数据模型（status: pending/approved/rejected）
- [ ] Web UI 审批界面
- [ ] 批准后自动创建任务

**工作流**:
```
┌─────────────────────────────────────────────────────────────┐
│  1. 人类与 Claude Code 对话                                  │
│     "帮我规划用户认证功能的实现"                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Claude Code (作为 PM Agent)                              │
│     - 分析需求                                              │
│     - 调用 chorus_query_knowledge 获取项目上下文             │
│     - 调用 chorus_create_proposal 创建任务提议               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Chorus Web UI - 审批界面                                 │
│     📋 新提议：用户认证功能实现                               │
│     Task 1: 设计认证数据模型                                 │
│     Task 2: 实现 OAuth 集成                                  │
│     Task 3: 实现邮箱密码登录                                 │
│     ...                                                     │
│     [✓ 批准] [✏️ 调整] [✗ 拒绝]                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  4. 批准后                                                   │
│     - 任务自动创建，状态为 todo                              │
│     - Personal Agents 可以领取执行                           │
└─────────────────────────────────────────────────────────────┘
```

**关键点**：平台不内置 LLM 调用，PM 的"智能"由 Claude Code 提供。

### 4.2 P1 - 应该有

#### F6: PM Agent 进度追踪
- 监控任务进展
- 识别风险和阻塞
- 动态调整计划建议

#### F6: 团队仪表板
- 项目进度可视化
- 人员/Agent工作负载
- 阻塞问题看板

#### F7: 人类审批工作流
- 关键节点人类审批（PRD、技术方案）
- 审批历史记录
- @mention通知

### 4.3 P2 - 可以有

#### F8: Agent间实时通信
- Agent A完成任务 → 实时通知Agent B
- 冲突检测与自动协调

#### F9: 智能复盘
- 项目结束后自动生成复盘报告
- 识别改进点

#### F10: 多项目管理
- 项目组合视图
- 跨项目资源调度

---

## 5. 技术方案

### 5.1 技术栈

| 层 | 选择 | 理由 |
|---|------|------|
| **框架** | Next.js 15 (App Router) | 全栈统一、SSR/API Routes |
| **语言** | TypeScript | 类型安全 |
| **ORM** | Prisma | 类型安全、迁移管理、良好 DX |
| **数据库** | PostgreSQL | 可靠、支持 JSON |
| **UI** | Tailwind + shadcn/ui | 快速开发、美观 |
| **部署** | Docker Compose | 本地一键启动 |
| **Agent 集成** | MCP Server | Claude Code 原生支持 |

### 5.2 系统架构

**单进程架构**：Next.js 同时提供 Web UI、REST API 和 MCP Server（HTTP 模式）。

```
┌─────────────────────────────────────────────────────────┐
│                 Next.js App (:3000)                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Pages (React Server Components)                  │  │
│  │  Kanban看板 │ 任务列表 │ 知识库浏览 │ 活动流       │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  API Routes                                       │  │
│  │    /api/projects/*  - REST API (Web 调用)         │  │
│  │    /api/tasks/*     - REST API (Web 调用)         │  │
│  │    /api/mcp         - MCP HTTP 端点 (Agent 调用)  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
              ┌───────────▼───────────┐
              │  PostgreSQL + Prisma  │
              └───────────────────────┘
```

**Claude Code 配置**：
```json
{
  "mcpServers": {
    "chorus": {
      "type": "http",
      "url": "http://localhost:3000/api/mcp"
    }
  }
}
```

### 5.3 本地部署

```yaml
# docker-compose.yml
services:
  chorus:
    build: .
    ports:
      - "3000:3000"      # Next.js (Web + API + MCP)
    environment:
      - DATABASE_URL=postgres://chorus:chorus@db:5432/chorus
      - OIDC_ISSUER=${OIDC_ISSUER}
      - OIDC_CLIENT_ID=${OIDC_CLIENT_ID}
    depends_on:
      - db

  db:
    image: postgres:16
    environment:
      - POSTGRES_USER=chorus
      - POSTGRES_PASSWORD=chorus
      - POSTGRES_DB=chorus
    volumes:
      - chorus-data:/var/lib/postgresql/data

volumes:
  chorus-data:
```

### 5.4 MCP Server 实现

**MCP 通过 Next.js API Route 暴露（HTTP Streamable Transport）**：

```typescript
// src/app/api/mcp/route.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { prisma } from '@/lib/prisma';
import * as z from 'zod';

const server = new McpServer({ name: 'chorus', version: '1.0.0' });

// 注册工具示例
server.registerTool(
  'chorus_get_project',
  {
    description: '获取项目详情和上下文',
    inputSchema: { projectId: z.string() }
  },
  async ({ projectId }) => {
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });
    return { content: [{ type: 'text', text: JSON.stringify(project) }] };
  }
);

// ... 其他工具

export async function POST(req: Request) {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
  });
  await server.connect(transport);
  return transport.handleRequest(req);
}
```

**MCP 工具列表**：

| 工具 | 描述 |
|-----|------|
| `chorus_get_project` | 获取项目背景信息 |
| `chorus_get_task` | 获取任务详情和上下文 |
| `chorus_list_tasks` | 列出任务 |
| `chorus_query_knowledge` | 查询知识库 |
| `chorus_update_task` | 更新任务状态 |
| `chorus_add_comment` | 添加任务评论 |
| `chorus_report_work` | 报告工作完成 |
| `chorus_get_activity` | 获取最近活动 |
| `chorus_checkin` | 心跳签到 |

---

## 6. 成功指标

### 6.1 北极星指标
**Agent上下文准备时间减少 50%**
- 当前：每次新session需要5-10分钟解释背景
- 目标：自动注入上下文，<1分钟开始工作

### 6.2 关键指标

| 指标 | 当前基线 | MVP目标 |
|-----|---------|---------|
| 上下文准备时间 | 5-10分钟 | <1分钟 |
| 任务状态准确率 | 60%（手动更新滞后） | >90% |
| 项目信息可查询率 | 30%（分散在各处） | >80% |
| Agent工作冲突率 | 未知 | <5% |

---

## 7. MVP 范围与里程碑

### 7.1 MVP 范围

**技术栈**：全栈 TypeScript + PostgreSQL + Docker Compose

**核心交付**:

| 模块 | 功能 | 优先级 |
|-----|------|-------|
| **知识库** | 项目上下文存储、查询 | P0 |
| **任务系统** | CRUD、状态、评论、审批流 | P0 |
| **MCP Server** | Claude Code 集成 | P0 |
| **Web UI** | Kanban 看板、任务列表、知识库、审批界面 | P0 |
| **PM Agent** | 需求分析、任务拆解、提议生成 | P0 |
| **活动流** | 最近操作记录 | P1 |

**认证与多租户**:
- ✅ 多租户：数据库层面支持（company_id 字段），MVP 阶段单租户使用
- ✅ 人类认证：OIDC + PKCE，启动时配置 issuer / client_id
- ✅ Agent 认证：API Key（注册时生成）

**明确不做**:
- ❌ 复杂的任务依赖（DAG）
- ❌ Git 集成
- ❌ 复杂权限（RBAC）
- ❌ 多 PM Agent 协作

### 7.2 里程碑

| 阶段 | 周期 | 交付 |
|-----|------|------|
| **M0: 项目骨架** | Week 1 | Next.js 项目、Docker Compose、Prisma schema |
| **M1: 后端 API** | Week 2 | 项目/任务/知识库/提议 CRUD API |
| **M2: MCP Server** | Week 3 | Personal Agent MCP 工具 + PM Agent MCP 工具 |
| **M3: Web UI** | Week 4 | Kanban、任务详情、知识库、提议审批界面 |
| **M4: Skill 文件** | Week 5 | PM Skill + Personal Skill + 文档 |
| **M5: 联调测试** | Week 6 | 端到端测试、Demo |

**Focus**: 平台开发，PM Agent 的"智能"由 Claude Code 提供

### 7.3 数据模型 (Prisma Schema)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 租户
model Company {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())

  users      User[]
  agents     Agent[]
  apiKeys    ApiKey[]
  projects   Project[]
  tasks      Task[]
  proposals  Proposal[]
  activities Activity[]
}

// 用户（人类，OIDC 登录）
model User {
  id        String   @id @default(uuid())
  companyId String
  company   Company  @relation(fields: [companyId], references: [id])
  oidcSub   String   @unique    // OIDC subject
  email     String?
  name      String?
  createdAt DateTime @default(now())

  ownedAgents Agent[]
}

// Agent（Claude Code 等）
model Agent {
  id        String   @id @default(uuid())
  companyId String
  company   Company  @relation(fields: [companyId], references: [id])
  name      String
  role      String   @default("personal")  // pm | personal
  ownerId   String?
  owner     User?    @relation(fields: [ownerId], references: [id])
  createdAt DateTime @default(now())

  apiKeys   ApiKey[]
}

// API Key（独立管理，支持轮换和撤销）
model ApiKey {
  id        String    @id @default(uuid())
  companyId String
  company   Company   @relation(fields: [companyId], references: [id])
  agentId   String
  agent     Agent     @relation(fields: [agentId], references: [id])
  key       String    @unique    // 实际的 API Key
  name      String?              // 可选的描述名称
  lastUsed  DateTime?
  expiresAt DateTime?
  revokedAt DateTime?
  createdAt DateTime  @default(now())
}

// 项目
model Project {
  id          String   @id @default(uuid())
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  name        String
  description String?
  context     Json?    // 项目上下文/知识库
  createdAt   DateTime @default(now())

  tasks      Task[]
  proposals  Proposal[]
  activities Activity[]
}

// 任务
model Task {
  id           String   @id @default(uuid())
  companyId    String
  company      Company  @relation(fields: [companyId], references: [id])
  projectId    String
  project      Project  @relation(fields: [projectId], references: [id])
  title        String
  description  String?
  status       String   @default("todo")  // todo | in_progress | done
  assigneeType String?  // user | agent
  assigneeId   String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  activities Activity[]
}

// 任务提议（PM Agent 创建，人类审批）
model Proposal {
  id          String   @id @default(uuid())
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  title       String
  description String?
  tasks       Json     // 提议的任务列表
  status      String   @default("pending")  // pending | approved | rejected
  createdBy   String   // PM Agent ID
  reviewedBy  String?  // User ID who approved/rejected
  reviewedAt  DateTime?
  createdAt   DateTime @default(now())
}

// 活动流
model Activity {
  id        String   @id @default(uuid())
  companyId String
  company   Company  @relation(fields: [companyId], references: [id])
  projectId String
  project   Project  @relation(fields: [projectId], references: [id])
  taskId    String?
  task      Task?    @relation(fields: [taskId], references: [id])
  actorType String   // user | agent
  actorId   String
  action    String   // created | updated | commented | proposal_created | proposal_approved | ...
  payload   Json?
  createdAt DateTime @default(now())
}
```

### 7.4 认证流程

```
人类登录 (OIDC + PKCE):
┌────────┐     ┌─────────┐     ┌──────────────┐
│  Web   │────▶│ Chorus  │────▶│ OIDC Provider│
│  UI    │◀────│  API    │◀────│ (Cognito等)  │
└────────┘     └─────────┘     └──────────────┘
   授权码 + PKCE verifier    →    access_token

Agent 认证 (API Key):
┌────────────┐     ┌─────────┐
│Claude Code │────▶│ Chorus  │
│(MCP Client)│     │  API    │
└────────────┘     └─────────┘
   Header: Authorization: Bearer {api_key}
```

### 7.5 目录结构

```
chorus/
├── docker-compose.yml
├── Dockerfile
├── package.json
├── prisma/
│   └── schema.prisma           # 数据模型
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx            # 首页
│   │   ├── projects/
│   │   │   └── [id]/
│   │   │       ├── page.tsx         # 项目详情
│   │   │       ├── board/page.tsx   # Kanban 看板
│   │   │       └── knowledge/page.tsx
│   │   └── api/                # API Routes
│   │       ├── projects/
│   │       │   └── route.ts
│   │       ├── tasks/
│   │       │   └── route.ts
│   │       ├── agents/
│   │       │   └── route.ts
│   │       ├── auth/
│   │       │   └── route.ts
│   │       └── mcp/            # MCP HTTP 端点
│   │           ├── route.ts    # POST /api/mcp
│   │           └── tools.ts    # MCP 工具定义
│   ├── components/             # React 组件
│   │   ├── kanban/
│   │   ├── task-card.tsx
│   │   └── ...
│   └── lib/
│       ├── prisma.ts           # Prisma client
│       ├── auth.ts             # OIDC 认证
│       └── api-key.ts          # Agent API Key 验证
├── skill/                      # Chorus Skill 文件 (给 Agent 阅读)
│   ├── pm/                     # PM Agent 专用
│   │   ├── SKILL.md
│   │   └── HEARTBEAT.md
│   └── personal/               # Personal Agent 专用
│       ├── SKILL.md
│       └── HEARTBEAT.md
└── .env.example
```

---

## 8. 风险与挑战

### 8.1 技术风险

| 风险 | 概率 | 影响 | 缓解措施 |
|-----|------|------|---------|
| MCP协议限制 | 中 | 高 | 预研MCP能力边界，准备备选方案 |
| LLM成本过高 | 中 | 中 | 缓存、批处理、使用小模型处理简单任务 |
| 知识库质量差 | 中 | 高 | 人工审核机制、渐进式完善 |

### 8.2 产品风险

| 风险 | 概率 | 影响 | 缓解措施 |
|-----|------|------|---------|
| 用户习惯难改变 | 高 | 高 | 从增量价值切入，不要求完全替换现有工具 |
| 价值感知不明显 | 中 | 高 | 设计明确的"Aha moment"，量化效率提升 |

### 8.3 市场风险

| 风险 | 概率 | 影响 | 缓解措施 |
|-----|------|------|---------|
| 大厂快速跟进 | 高 | 高 | 快速迭代、深耕垂直场景、建立社区 |
| Claude Code自己做 | 中 | 极高 | 保持兼容、提供差异化价值 |

---

## 9. 开放问题

以下问题需要进一步讨论：

1. **商业模式**: 免费增值？按Agent数收费？按项目收费？
2. **开源策略**: 核心开源+云服务？还是全闭源？
3. **首批用户**: 先服务内部项目？还是直接找外部早期用户？
4. **竞品定位**: 替代Jira？还是与Jira并存作为AI协调层？
5. **Agent自主权边界**: Driver Agent能自动分配任务？还是只能建议？

---

## 10. 附录

### A. 术语表

| 术语 | 定义 |
|-----|------|
| Chorus | 合唱团，多声部（人类+Agent）协作的隐喻 |
| AI-DLC | AI-Driven Development Lifecycle，AWS 提出的 AI 原生开发方法论 |
| Bolt | AI-DLC 中的短周期迭代单位（小时/天），替代传统 Sprint |
| Reversed Conversation | AI 提议、人类验证的交互模式 |
| Personal Agent | 个人使用的AI编程助手（如Claude Code） |
| PM Agent | 可选的项目管理 Agent，作为平台参与者协助管理 |
| 知识库 | 项目的统一信息存储，包括上下文、决策、代码理解等 |
| MCP | Model Context Protocol，Anthropic 的 Agent 工具协议 |
| Skill | 教会 Agent 如何使用平台的 markdown 说明文件 |
| Heartbeat | Agent 定期检查平台的机制，保持持续参与 |

### B. 参考资料

**方法论：**
- [AWS AI-DLC Blog](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/) - AI-DLC 官方介绍
- [AWS re:Invent 2025 DVT214](https://www.youtube.com/watch?v=1HNUH6j5t4A) - AI-DLC 发布演讲

**技术参考：**
- [Anthropic MCP 文档](https://modelcontextprotocol.io/)
- [Moltbook Skill 机制](./moltbook-skill/) - Agent 平台参与模式参考

**项目文档：**
- [市场调研报告](./ai_project_management_market_research.md)
- [Moltbook 机制分析](./moltbook_analysis.md)
- [架构图](./AIDLC.png)

---

**文档历史**:
| 版本 | 日期 | 作者 | 变更 |
|-----|------|------|------|
| 0.1 | 2026-02-04 | AI Assistant | 初稿 |
| 0.2 | 2026-02-04 | AI Assistant | 重新定位为平台（非中心化Agent） |
| 0.3 | 2026-02-04 | AI Assistant | 更名为 Project Chorus |
| 0.4 | 2026-02-04 | AI Assistant | 单进程架构：MCP 通过 HTTP 集成到 Next.js |
| 0.5 | 2026-02-04 | AI Assistant | PM Agent 作为核心功能，Agent 角色区分，API Key 独立表 |
