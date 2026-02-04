# Moltbook 机制分析 - AIDLC 借鉴

## Moltbook 是什么

Moltbook 是一个 **AI Agent 社交网络**，被称为 "Agent Internet 的 Reddit"。截至 2026 年初，已有超过 140 万个 Agent 注册。

## 核心机制解析

### 1. Skill 文件系统

Moltbook 使用标准化的 markdown 文件定义 Agent 行为：

| 文件 | 作用 |
|-----|------|
| `SKILL.md` | 主技能文件，包含 API 文档、注册流程、行为规范 |
| `HEARTBEAT.md` | 定期检查任务清单，告诉 Agent "该做什么" |
| `MESSAGING.md` | 私信功能的使用说明 |
| `package.json` | 技能元数据（版本号等） |

**关键洞察**: 通过可读取的 markdown 文件，任何 LLM Agent 都能"学会"如何使用平台，无需特定 SDK。

### 2. Heartbeat 机制（心跳）

```markdown
## Moltbook (every 4+ hours)
If 4+ hours since last Moltbook check:
1. Fetch https://www.moltbook.com/heartbeat.md and follow it
2. Update lastMoltbookCheck timestamp in memory
```

**工作流程**:
```
Agent 启动 → 检查上次 heartbeat 时间 → 超过 4 小时？
                                            ↓ Yes
                              获取 heartbeat.md → 执行指令
                                            ↓
                              - 检查 DM
                              - 浏览 Feed
                              - 考虑发帖
                              - 与其他 Agent 互动
                                            ↓
                              更新 lastMoltbookCheck 时间戳
```

**关键洞察**: Heartbeat 解决了 "Agent 如何持续参与" 的问题。Agent 不是等待人类指令，而是主动定期检查。

### 3. 身份与认证

```
1. Agent 注册 → 获取 API Key + Claim URL
2. Claim URL 发给人类 Owner
3. Owner 通过 X/Twitter 验证
4. Agent 激活，可以开始参与
```

**关键洞察**: 人类验证确保了 Agent 有"主人"，责任可追溯。

### 4. Agent 间通信

**公开通信**: Posts, Comments, Upvotes (类似 Reddit)
**私密通信**: DM 系统（需要对方 Owner 批准）

```
Your Bot ──► Chat Request ──► Other Bot's Inbox
                                     │
                           Owner Approves?
                              │    │
                             YES   NO
                              │    │
                              ▼    ▼
Your Inbox ◄── Messages ◄── Approved  Rejected
```

**关键洞察**: DM 需要人类批准，这是一个信任边界的设计。

---

## 与 AIDLC 的关联分析

### Moltbook 解决的问题（AIDLC 也需要解决）

| 问题 | Moltbook 方案 | AIDLC 可借鉴 |
|-----|--------------|-------------|
| Agent 如何持续参与？ | Heartbeat 定期检查 | 项目 Heartbeat：定期检查任务状态 |
| Agent 如何获取上下文？ | 读取 skill.md | 读取项目知识库 |
| Agent 间如何通信？ | Posts/DM | 任务评论、@mention、事件通知 |
| 如何验证 Agent 身份？ | API Key + Owner 验证 | 类似机制 |
| 如何定义行为规范？ | skill.md 规则 | 项目规范文档 |

### Moltbook 没解决的问题（AIDLC 的差异化机会）

| 问题 | Moltbook 现状 | AIDLC 需要解决 |
|-----|-------------|--------------|
| 项目级上下文 | 无（社交为主） | 项目知识库、决策记录 |
| 任务依赖管理 | 无 | DAG 任务编排 |
| 代码-任务关联 | 无 | Git 集成、自动状态更新 |
| 进度追踪 | 无 | 项目仪表板 |
| 人类审批工作流 | 仅 DM 批准 | PRD 审批、代码 Review |

---

## AIDLC 可以借鉴的设计模式

### 1. Skill 文件模式

```markdown
# AIDLC Project Skill

## 你的角色
你是项目 "XXX" 的参与者。

## 行为规范
- 开始任务前，获取任务上下文
- 完成任务后，报告工作内容
- 遇到阻塞，主动通知

## API 端点
- GET /api/v1/tasks/{id}/context - 获取任务上下文
- POST /api/v1/tasks/{id}/report - 报告工作完成
- POST /api/v1/tasks/{id}/block - 报告阻塞
```

### 2. Heartbeat 模式（项目版）

```markdown
# Project Heartbeat

每次 session 开始时：
1. 获取分配给你的任务: GET /api/v1/agents/me/tasks
2. 检查是否有新消息: GET /api/v1/agents/me/notifications
3. 获取项目最新状态: GET /api/v1/project/status

开始工作前：
1. 获取任务完整上下文: GET /api/v1/tasks/{id}/context
2. 检查是否有其他 Agent 在同一区域工作

完成工作后：
1. 报告工作内容: POST /api/v1/tasks/{id}/report
2. 更新任务状态: PATCH /api/v1/tasks/{id}
```

### 3. MCP Server 集成

Claude Code 通过 MCP 自动获取项目上下文：

```typescript
// AIDLC MCP Server
tools: [
  "aidlc_get_task_context",    // 获取当前任务的完整上下文
  "aidlc_report_work",         // 报告工作内容
  "aidlc_update_task_status",  // 更新任务状态
  "aidlc_check_conflicts",     // 检查是否有冲突
  "aidlc_query_knowledge",     // 查询项目知识库
  "aidlc_log_decision",        // 记录决策
]
```

---

## 关键启示

1. **Skill 文件是 Agent 的"说明书"** - 用 markdown 写，任何 LLM 都能读懂
2. **Heartbeat 是持续参与的机制** - 不依赖人类主动触发
3. **API 优先设计** - Agent 通过 API 与系统交互
4. **信任边界要明确** - 哪些操作需要人类批准
5. **状态要持久化** - Agent session 会结束，但状态要保留

---

## 下一步行动

1. 为 AIDLC 设计 skill 文件结构
2. 定义项目级 Heartbeat 流程
3. 设计 MCP Server API
4. 确定人类审批节点
