# Project Chorus - 技术架构文档

**版本**: 1.0
**更新日期**: 2026-02-04

---

## 1. 系统概述

### 1.1 定位

Chorus 是一个 AI Agent 与人类协作的平台，实现 AI-DLC（AI-Driven Development Lifecycle）方法论。核心理念是 **Reversed Conversation**：AI 提议，人类验证。

### 1.2 核心能力

| 能力 | 描述 |
|-----|------|
| **知识库** | 项目上下文存储和查询 |
| **任务管理** | 任务 CRUD、状态流转、Kanban |
| **提议审批** | PM Agent 创建提议，人类审批 |
| **MCP Server** | Agent 通过 MCP 协议接入平台 |
| **活动流** | 实时追踪所有参与者的操作 |

### 1.3 参与者

```
┌─────────────────────────────────────────────────────────────┐
│                      Chorus Platform                        │
└─────────────────────────────────────────────────────────────┘
        ↑               ↑               ↑
        │               │               │
   ┌────┴────┐    ┌─────┴─────┐   ┌─────┴─────┐
   │  Human  │    │ PM Agent  │   │ Personal  │
   │         │    │           │   │  Agent    │
   └─────────┘    └───────────┘   └───────────┘
   Web UI 访问     Claude Code     Claude Code
   审批提议        提议任务        执行任务
```

---

## 2. 技术栈

### 2.1 核心技术选型

| 层 | 技术 | 版本 | 选型理由 |
|---|------|------|---------|
| **框架** | Next.js | 15.x | 全栈统一，App Router，RSC 支持 |
| **语言** | TypeScript | 5.x | 类型安全，前后端一致 |
| **ORM** | Prisma | 6.x | 类型安全，迁移管理，良好 DX |
| **数据库** | PostgreSQL | 16 | 可靠，JSON 支持，后续可扩展 pgvector |
| **UI 组件** | shadcn/ui | - | 基于 Radix，可定制，美观 |
| **样式** | Tailwind CSS | 4.x | 原子化 CSS，快速开发 |
| **认证** | next-auth | 5.x | OIDC 支持，与 Next.js 深度集成 |
| **MCP SDK** | @modelcontextprotocol/sdk | latest | 官方 TypeScript SDK |
| **容器化** | Docker Compose | - | 本地开发一键启动 |

### 2.2 开发工具

| 工具 | 用途 |
|-----|------|
| pnpm | 包管理 |
| ESLint + Prettier | 代码规范 |
| Vitest | 单元测试 |
| Playwright | E2E 测试 |

---

## 3. 系统架构

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         Clients                                 │
├──────────────────┬──────────────────┬───────────────────────────┤
│    Web Browser   │    PM Agent      │    Personal Agent         │
│    (Human)       │    (Claude Code) │    (Claude Code)          │
└────────┬─────────┴────────┬─────────┴─────────┬─────────────────┘
         │                  │                   │
         │ HTTPS            │ MCP/HTTP          │ MCP/HTTP
         │                  │                   │
┌────────▼──────────────────▼───────────────────▼─────────────────┐
│                     Next.js Application                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Middleware Layer                       │   │
│  │  - OIDC Authentication (Human)                           │   │
│  │  - API Key Authentication (Agent)                        │   │
│  │  - Rate Limiting                                         │   │
│  │  - Request Logging                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────┐  ┌─────────────────────────────────┐   │
│  │   React Pages       │  │        API Routes               │   │
│  │   (App Router)      │  │                                 │   │
│  │                     │  │  /api/projects/*                │   │
│  │  - Dashboard        │  │  /api/tasks/*                   │   │
│  │  - Kanban Board     │  │  /api/proposals/*               │   │
│  │  - Task Detail      │  │  /api/knowledge/*               │   │
│  │  - Knowledge Base   │  │  /api/agents/*                  │   │
│  │  - Proposal Review  │  │  /api/activities/*              │   │
│  │  - Activity Feed    │  │  /api/auth/*                    │   │
│  │                     │  │  /api/mcp    ← MCP HTTP 端点    │   │
│  └─────────────────────┘  └─────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Service Layer                          │   │
│  │  - ProjectService                                        │   │
│  │  - TaskService                                           │   │
│  │  - ProposalService                                       │   │
│  │  - KnowledgeService                                      │   │
│  │  - AgentService                                          │   │
│  │  - ActivityService                                       │   │
│  │  - MCPService                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Data Access Layer                      │   │
│  │                    (Prisma Client)                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │    PostgreSQL     │
                    │    Database       │
                    └───────────────────┘
```

### 3.2 目录结构

```
chorus/
├── docker-compose.yml          # 本地开发环境
├── Dockerfile                  # 生产镜像
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── .env.example
│
├── prisma/
│   ├── schema.prisma           # 数据模型定义
│   └── migrations/             # 数据库迁移
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # 根布局
│   │   ├── page.tsx            # 首页/Dashboard
│   │   ├── globals.css
│   │   │
│   │   ├── (auth)/             # 认证相关页面
│   │   │   ├── login/page.tsx
│   │   │   └── callback/page.tsx
│   │   │
│   │   ├── projects/
│   │   │   ├── page.tsx        # 项目列表
│   │   │   └── [id]/
│   │   │       ├── page.tsx    # 项目详情
│   │   │       ├── board/page.tsx      # Kanban 看板
│   │   │       ├── tasks/page.tsx      # 任务列表
│   │   │       ├── knowledge/page.tsx  # 知识库
│   │   │       ├── proposals/page.tsx  # 提议列表
│   │   │       └── activity/page.tsx   # 活动流
│   │   │
│   │   ├── agents/
│   │   │   ├── page.tsx        # Agent 管理
│   │   │   └── [id]/page.tsx   # Agent 详情/Key 管理
│   │   │
│   │   └── api/                # API Routes
│   │       ├── auth/
│   │       │   └── [...nextauth]/route.ts
│   │       ├── projects/
│   │       │   ├── route.ts    # GET (list), POST (create)
│   │       │   └── [id]/route.ts
│   │       ├── tasks/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── proposals/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       └── approve/route.ts
│   │       ├── knowledge/
│   │       │   └── route.ts
│   │       ├── agents/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       └── keys/route.ts
│   │       ├── activities/
│   │       │   └── route.ts
│   │       └── mcp/
│   │           └── route.ts    # MCP HTTP 端点
│   │
│   ├── components/             # React 组件
│   │   ├── ui/                 # shadcn/ui 组件
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── nav.tsx
│   │   ├── kanban/
│   │   │   ├── board.tsx
│   │   │   ├── column.tsx
│   │   │   └── card.tsx
│   │   ├── task/
│   │   │   ├── task-card.tsx
│   │   │   ├── task-detail.tsx
│   │   │   └── task-form.tsx
│   │   ├── proposal/
│   │   │   ├── proposal-card.tsx
│   │   │   ├── proposal-review.tsx
│   │   │   └── approval-buttons.tsx
│   │   ├── knowledge/
│   │   │   ├── knowledge-editor.tsx
│   │   │   └── knowledge-viewer.tsx
│   │   └── activity/
│   │       ├── activity-feed.tsx
│   │       └── activity-item.tsx
│   │
│   ├── lib/                    # 核心库
│   │   ├── prisma.ts           # Prisma Client 单例
│   │   ├── auth.ts             # NextAuth 配置
│   │   ├── api-key.ts          # API Key 验证
│   │   └── utils.ts            # 工具函数
│   │
│   ├── services/               # 业务逻辑层
│   │   ├── project.service.ts
│   │   ├── task.service.ts
│   │   ├── proposal.service.ts
│   │   ├── knowledge.service.ts
│   │   ├── agent.service.ts
│   │   ├── activity.service.ts
│   │   └── mcp.service.ts
│   │
│   ├── mcp/                    # MCP Server 实现
│   │   ├── server.ts           # MCP Server 初始化
│   │   ├── tools/
│   │   │   ├── index.ts
│   │   │   ├── personal/       # Personal Agent 工具
│   │   │   │   ├── get-project.ts
│   │   │   │   ├── get-task.ts
│   │   │   │   ├── list-tasks.ts
│   │   │   │   ├── update-task.ts
│   │   │   │   ├── add-comment.ts
│   │   │   │   ├── report-work.ts
│   │   │   │   ├── query-knowledge.ts
│   │   │   │   ├── get-activity.ts
│   │   │   │   └── checkin.ts
│   │   │   └── pm/             # PM Agent 工具
│   │   │       ├── create-proposal.ts
│   │   │       ├── get-proposals.ts
│   │   │       ├── analyze-progress.ts
│   │   │       └── identify-risks.ts
│   │   └── middleware.ts       # MCP 认证中间件
│   │
│   └── types/                  # TypeScript 类型定义
│       ├── api.ts
│       ├── mcp.ts
│       └── index.ts
│
├── skill/                      # Agent Skill 文件
│   ├── pm/
│   │   ├── SKILL.md
│   │   └── HEARTBEAT.md
│   └── personal/
│       ├── SKILL.md
│       └── HEARTBEAT.md
│
└── tests/
    ├── unit/
    └── e2e/
```

---

## 4. 数据模型

### 4.1 ER 图

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Company   │───┬───│    User     │       │   Agent     │
│             │   │   │             │───────│             │
│  id         │   │   │  id         │       │  id         │
│  name       │   │   │  companyId  │       │  companyId  │
│  createdAt  │   │   │  oidcSub    │       │  name       │
└─────────────┘   │   │  email      │       │  role       │
       │          │   │  name       │       │  ownerId    │
       │          │   └─────────────┘       └─────────────┘
       │          │                                │
       │          │   ┌─────────────┐              │
       │          └───│   ApiKey    │──────────────┘
       │              │             │
       │              │  id         │
       │              │  companyId  │
       │              │  agentId    │
       │              │  key        │
       │              │  name       │
       │              │  lastUsed   │
       │              │  expiresAt  │
       │              │  revokedAt  │
       │              └─────────────┘
       │
       ├──────────────────────────────────────────┐
       │                                          │
┌──────▼──────┐       ┌─────────────┐      ┌──────▼──────┐
│   Project   │───────│    Task     │      │  Proposal   │
│             │       │             │      │             │
│  id         │       │  id         │      │  id         │
│  companyId  │       │  companyId  │      │  companyId  │
│  name       │       │  projectId  │      │  projectId  │
│  description│       │  title      │      │  title      │
│  context    │       │  description│      │  description│
│  createdAt  │       │  status     │      │  tasks      │
└─────────────┘       │  assigneeType      │  status     │
       │              │  assigneeId │      │  createdBy  │
       │              │  createdAt  │      │  reviewedBy │
       │              │  updatedAt  │      │  reviewedAt │
       │              └─────────────┘      └─────────────┘
       │                     │
       │                     │
       │              ┌──────▼──────┐
       └──────────────│  Activity   │
                      │             │
                      │  id         │
                      │  companyId  │
                      │  projectId  │
                      │  taskId     │
                      │  actorType  │
                      │  actorId    │
                      │  action     │
                      │  payload    │
                      │  createdAt  │
                      └─────────────┘
```

### 4.2 核心实体说明

#### Company（租户）
- 多租户隔离的根实体
- 所有数据通过 companyId 关联

#### User（用户）
- 人类用户，通过 OIDC 登录
- `oidcSub` 存储 OIDC Provider 的 subject

#### Agent（代理）
- AI Agent 实体（Claude Code 等）
- `role`: `pm` | `personal`
- 一个 Agent 可以有多个 API Key

#### ApiKey（API 密钥）
- 独立管理，支持轮换和撤销
- `key`: 实际的 API 密钥（哈希存储）
- `expiresAt`: 可选的过期时间
- `revokedAt`: 撤销时间

#### Project（项目）
- 项目容器
- `context`: JSON 格式的项目知识库

#### Task（任务）
- 任务实体
- `status`: `todo` | `in_progress` | `done`
- `assigneeType`: `user` | `agent`
- `assigneeId`: 关联的 User 或 Agent ID

#### Proposal（提议）
- PM Agent 创建的任务提议
- `tasks`: JSON 格式的任务列表
- `status`: `pending` | `approved` | `rejected`
- 批准后自动创建 Task

#### Activity（活动）
- 活动日志
- `actorType`: `user` | `agent`
- `action`: `created` | `updated` | `commented` | `proposal_created` | `proposal_approved` | ...

---

## 5. API 设计

### 5.1 REST API

#### 认证
- **Human**: OIDC + Session Cookie
- **Agent**: `Authorization: Bearer {api_key}`

#### 端点概览

| 方法 | 路径 | 描述 | 权限 |
|-----|------|------|------|
| **Projects** |
| GET | /api/projects | 项目列表 | User, Agent |
| POST | /api/projects | 创建项目 | User |
| GET | /api/projects/:id | 项目详情 | User, Agent |
| PATCH | /api/projects/:id | 更新项目 | User |
| DELETE | /api/projects/:id | 删除项目 | User |
| **Tasks** |
| GET | /api/tasks | 任务列表 | User, Agent |
| POST | /api/tasks | 创建任务 | User, PM Agent |
| GET | /api/tasks/:id | 任务详情 | User, Agent |
| PATCH | /api/tasks/:id | 更新任务 | User, Agent |
| POST | /api/tasks/:id/comments | 添加评论 | User, Agent |
| **Proposals** |
| GET | /api/proposals | 提议列表 | User, PM Agent |
| POST | /api/proposals | 创建提议 | PM Agent |
| GET | /api/proposals/:id | 提议详情 | User, PM Agent |
| POST | /api/proposals/:id/approve | 批准提议 | User |
| POST | /api/proposals/:id/reject | 拒绝提议 | User |
| **Knowledge** |
| GET | /api/knowledge | 查询知识库 | User, Agent |
| PUT | /api/knowledge | 更新知识库 | User |
| **Agents** |
| GET | /api/agents | Agent 列表 | User |
| POST | /api/agents | 创建 Agent | User |
| GET | /api/agents/:id | Agent 详情 | User |
| POST | /api/agents/:id/keys | 创建 API Key | User |
| DELETE | /api/agents/:id/keys/:keyId | 撤销 API Key | User |
| **Activities** |
| GET | /api/activities | 活动列表 | User, Agent |

### 5.2 MCP API

#### 端点
```
POST /api/mcp
```

#### Transport
Streamable HTTP Transport（支持 SSE）

#### 认证
```
Header: Authorization: Bearer {api_key}
```

根据 API Key 关联的 Agent role，返回不同的工具集。

#### Personal Agent 工具

| 工具 | 描述 |
|-----|------|
| `chorus_get_project` | 获取项目详情和上下文 |
| `chorus_get_task` | 获取任务详情 |
| `chorus_list_tasks` | 列出任务 |
| `chorus_update_task` | 更新任务状态 |
| `chorus_add_comment` | 添加任务评论 |
| `chorus_report_work` | 报告工作完成 |
| `chorus_query_knowledge` | 查询知识库 |
| `chorus_get_activity` | 获取最近活动 |
| `chorus_checkin` | 心跳签到 |

#### PM Agent 工具

| 工具 | 描述 |
|-----|------|
| `chorus_pm_create_proposal` | 创建任务提议 |
| `chorus_pm_get_proposals` | 获取提议状态 |
| `chorus_pm_analyze_progress` | 分析项目进度 |
| `chorus_pm_identify_risks` | 识别风险和阻塞 |

PM Agent 同时拥有 Personal Agent 的所有工具。

---

## 6. 认证与授权

### 6.1 人类认证（OIDC + PKCE）

```
┌──────────┐     ┌──────────┐     ┌──────────────┐
│  Browser │     │  Chorus  │     │    OIDC      │
│          │     │  Server  │     │   Provider   │
└────┬─────┘     └────┬─────┘     └──────┬───────┘
     │                │                   │
     │  1. Login      │                   │
     │ ──────────────>│                   │
     │                │                   │
     │  2. Redirect   │                   │
     │ <──────────────│                   │
     │                │                   │
     │  3. Auth Request (PKCE)            │
     │ ──────────────────────────────────>│
     │                │                   │
     │  4. User Login │                   │
     │ <──────────────────────────────────│
     │                │                   │
     │  5. Callback with code             │
     │ ──────────────>│                   │
     │                │                   │
     │                │  6. Exchange code │
     │                │ ─────────────────>│
     │                │                   │
     │                │  7. Tokens        │
     │                │ <─────────────────│
     │                │                   │
     │  8. Set Session Cookie             │
     │ <──────────────│                   │
```

### 6.2 Agent 认证（API Key）

```
┌──────────┐     ┌──────────┐     ┌──────────────┐
│  Claude  │     │  Chorus  │     │   Database   │
│   Code   │     │  Server  │     │              │
└────┬─────┘     └────┬─────┘     └──────┬───────┘
     │                │                   │
     │  MCP Request   │                   │
     │  + API Key     │                   │
     │ ──────────────>│                   │
     │                │                   │
     │                │  Validate Key     │
     │                │ ─────────────────>│
     │                │                   │
     │                │  Agent + Role     │
     │                │ <─────────────────│
     │                │                   │
     │                │  Check Role       │
     │                │  Return Tools     │
     │                │                   │
     │  MCP Response  │                   │
     │ <──────────────│                   │
```

### 6.3 权限模型

| 操作 | User | PM Agent | Personal Agent |
|-----|------|----------|----------------|
| 创建项目 | ✓ | ✗ | ✗ |
| 查看项目 | ✓ | ✓ | ✓ |
| 创建任务 | ✓ | ✓ | ✗ |
| 更新任务 | ✓ | ✓ | ✓（仅分配给自己的） |
| 创建提议 | ✗ | ✓ | ✗ |
| 审批提议 | ✓ | ✗ | ✗ |
| 管理 Agent | ✓ | ✗ | ✗ |

---

## 7. 核心流程

### 7.1 Reversed Conversation 工作流

```
┌─────────────────────────────────────────────────────────────────┐
│  1. 人类描述需求                                                 │
│     "我想实现用户认证功能，支持 OAuth 和邮箱密码登录"              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. PM Agent (Claude Code) 分析                                  │
│     - 读取项目知识库 (chorus_query_knowledge)                    │
│     - 分析需求                                                  │
│     - 生成任务拆解                                               │
│     - 创建提议 (chorus_pm_create_proposal)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Chorus 平台存储提议                                          │
│     - 状态: pending                                             │
│     - 通知人类审批                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. 人类审批 (Web UI)                                            │
│     - 查看提议详情                                               │
│     - 批准 / 调整 / 拒绝                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                     ┌────────┴────────┐
                     ▼                 ▼
              ┌──────────┐       ┌──────────┐
              │  批准    │       │  拒绝    │
              └────┬─────┘       └────┬─────┘
                   │                  │
                   ▼                  ▼
┌─────────────────────────┐   ┌─────────────────┐
│  5a. 自动创建任务        │   │  5b. 结束       │
│      状态: todo          │   │      可重新提议  │
└────────────┬────────────┘   └─────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. Personal Agent 执行                                          │
│     - 获取任务 (chorus_get_task)                                 │
│     - 执行开发工作                                               │
│     - 报告完成 (chorus_report_work)                              │
└─────────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. PM Agent 持续追踪                                            │
│     - 分析进度 (chorus_pm_analyze_progress)                      │
│     - 识别风险 (chorus_pm_identify_risks)                        │
│     - 必要时调整计划                                             │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 任务状态流转

```
                    ┌──────────────┐
                    │   created    │
                    │  (from UI    │
                    │  or proposal)│
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
         ┌─────────│     todo     │
         │         └──────┬───────┘
         │                │
         │                │ Agent/User 开始
         │                ▼
         │         ┌──────────────┐
         │         │ in_progress  │──────┐
         │         └──────┬───────┘      │
         │                │              │
         │                │ 完成         │ 阻塞/暂停
         │                ▼              │
         │         ┌──────────────┐      │
         │         │     done     │      │
         │         └──────────────┘      │
         │                               │
         └───────────────────────────────┘
                   重新打开
```

### 7.3 提议审批流程

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   pending    │────>│   approved   │────>│ Tasks Created│
└──────────────┘     └──────────────┘     └──────────────┘
       │
       │
       ▼
┌──────────────┐
│   rejected   │
└──────────────┘
```

---

## 8. 部署架构

### 8.1 本地开发

```yaml
# docker-compose.yml
version: '3.8'

services:
  chorus:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://chorus:chorus@db:5432/chorus
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - OIDC_ISSUER=${OIDC_ISSUER}
      - OIDC_CLIENT_ID=${OIDC_CLIENT_ID}
      - OIDC_CLIENT_SECRET=${OIDC_CLIENT_SECRET}
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./src:/app/src
      - ./prisma:/app/prisma

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=chorus
      - POSTGRES_PASSWORD=chorus
      - POSTGRES_DB=chorus
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U chorus"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### 8.2 生产部署（未来）

```
┌─────────────────────────────────────────────────────────────────┐
│                         Load Balancer                           │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
       ┌──────────┐    ┌──────────┐    ┌──────────┐
       │  Chorus  │    │  Chorus  │    │  Chorus  │
       │ Instance │    │ Instance │    │ Instance │
       └──────────┘    └──────────┘    └──────────┘
              │               │               │
              └───────────────┼───────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   PostgreSQL      │
                    │   (Primary)       │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │   PostgreSQL      │
                    │   (Replica)       │
                    └───────────────────┘
```

---

## 9. 安全考虑

### 9.1 API Key 安全

- API Key 使用 SHA-256 哈希存储
- 只在创建时返回明文，之后无法恢复
- 支持过期时间和手动撤销
- 记录最后使用时间

### 9.2 数据隔离

- 所有查询都包含 companyId 过滤
- Prisma 中间件强制多租户隔离

### 9.3 输入验证

- 使用 Zod 进行请求体验证
- 防止 SQL 注入（Prisma 参数化查询）
- 防止 XSS（React 自动转义）

### 9.4 速率限制

- API 请求限流
- 防止暴力破解 API Key

---

## 10. 扩展性考虑

### 10.1 未来功能

| 功能 | 描述 | 优先级 |
|-----|------|-------|
| Git 集成 | 关联 commit 和 PR | P1 |
| 实时通知 | WebSocket 推送 | P1 |
| 复杂依赖 | 任务 DAG | P2 |
| 语义搜索 | pgvector 知识库搜索 | P2 |
| 多 PM Agent | 协作规划 | P2 |
| 移动端 | PWA 或原生 App | P3 |

### 10.2 技术储备

- **pgvector**: PostgreSQL 已原生支持，后续可无缝添加
- **WebSocket**: Next.js 支持，可用于实时通知
- **Redis**: 如需缓存或消息队列，可后续引入

---

## 附录

### A. 环境变量

```bash
# Database
DATABASE_URL=postgres://chorus:chorus@localhost:5432/chorus

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# OIDC Provider
OIDC_ISSUER=https://your-oidc-provider.com
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
```

### B. 参考文档

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [shadcn/ui](https://ui.shadcn.com/)
