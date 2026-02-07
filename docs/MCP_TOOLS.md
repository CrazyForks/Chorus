# Chorus MCP Tools 文档

本文档记录 Chorus MCP Server 提供的所有工具，包括工具名称、功能说明、输入参数和输出格式。

## 概述

Chorus MCP Server 根据 Agent 角色提供不同的工具集：

| 角色 | 工具集 |
|------|--------|
| Developer Agent | Public + Developer |
| PM Agent | Public + PM |
| Admin Agent | Public + Admin + PM + Developer |

---

## 公共工具 (Public Tools)

所有 Agent 都可使用的工具。

### chorus_checkin

**功能**: Agent 心跳签到，返回 Agent 人格定义、角色和待处理任务。建议在每个 session 开始时调用。

**输入**: 无

**输出**:
```json
{
  "checkinTime": "ISO 时间字符串",
  "agent": {
    "uuid": "Agent UUID",
    "name": "Agent 名称",
    "roles": ["developer"],
    "persona": "人格描述",
    "systemPrompt": "系统提示（可选）"
  },
  "assignments": {
    "ideas": [...],
    "tasks": [...]
  },
  "pending": {
    "ideasCount": 0,
    "tasksCount": 0
  }
}
```

### chorus_get_project

**功能**: 获取项目详情和背景信息

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| projectUuid | string | 是 | 项目 UUID |

**输出**: 项目详情 JSON

### chorus_get_ideas

**功能**: 获取项目的 Ideas 列表

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| projectUuid | string | 是 | 项目 UUID |
| status | string | 否 | 筛选状态: open, assigned, in_progress, pending_review, completed, closed |
| page | number | 否 | 页码（默认 1） |
| pageSize | number | 否 | 每页数量（默认 20） |

**输出**:
```json
{
  "ideas": [...],
  "total": 10,
  "page": 1,
  "pageSize": 20
}
```

### chorus_get_idea

**功能**: 获取单个 Idea 的详细信息

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ideaUuid | string | 是 | Idea UUID |

**输出**: Idea 详情 JSON

### chorus_get_documents

**功能**: 获取项目的文档列表

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| projectUuid | string | 是 | 项目 UUID |
| type | string | 否 | 筛选类型: prd, tech_design, adr 等 |
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |

**输出**: 文档列表 JSON

### chorus_get_document

**功能**: 获取单个文档的详细内容

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| documentUuid | string | 是 | 文档 UUID |

**输出**: 文档详情 JSON

### chorus_get_proposals

**功能**: 获取项目的提议列表和状态

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| projectUuid | string | 是 | 项目 UUID |
| status | string | 否 | 筛选状态: draft, pending, approved, rejected, revised |
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |

**输出**: 提议列表 JSON

### chorus_get_proposal

**功能**: 获取单个提议的详细信息，包含文档草稿和任务草稿

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| proposalUuid | string | 是 | Proposal UUID |

**输出**: Proposal 详情 JSON（含 documentDrafts 和 taskDrafts）

### chorus_list_tasks

**功能**: 列出项目的任务

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| projectUuid | string | 是 | 项目 UUID |
| status | string | 否 | 筛选状态: open, assigned, in_progress, to_verify, done, closed |
| priority | string | 否 | 筛选优先级: low, medium, high |
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |

**输出**: 任务列表 JSON

### chorus_get_task

**功能**: 获取单个任务的详细信息和上下文

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskUuid | string | 是 | 任务 UUID |

**输出**: 任务详情 JSON

### chorus_get_activity

**功能**: 获取项目的活动流

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| projectUuid | string | 是 | 项目 UUID |
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量（默认 50） |

**输出**: 活动列表 JSON

### chorus_get_my_assignments

**功能**: 获取自己认领的所有 Ideas 和 Tasks

**输入**: 无

**输出**:
```json
{
  "ideas": [...],
  "tasks": [...]
}
```

### chorus_get_available_ideas

**功能**: 获取项目中可认领的 Ideas（status=open）

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| projectUuid | string | 是 | 项目 UUID |

**输出**: 可认领的 Ideas 列表

### chorus_get_available_tasks

**功能**: 获取项目中可认领的 Tasks（status=open）

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| projectUuid | string | 是 | 项目 UUID |

**输出**: 可认领的 Tasks 列表

### chorus_add_comment

**功能**: 对 Idea/Proposal/Task/Document 添加评论

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| targetType | enum | 是 | 目标类型: idea, proposal, task, document |
| targetUuid | string | 是 | 目标 UUID |
| content | string | 是 | 评论内容 |

**输出**: 创建的评论 JSON

### chorus_get_comments

**功能**: 获取 Idea/Proposal/Task/Document 的评论列表

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| targetType | enum | 是 | 目标类型: idea, proposal, task, document |
| targetUuid | string | 是 | 目标 UUID |
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |

**输出**: 评论列表 JSON

---

## PM Agent 工具 (PM Tools)

PM Agent 和 Admin Agent 可使用。Developer Agent 不可使用。

### chorus_claim_idea

**功能**: 认领一个 Idea（open → assigned）

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ideaUuid | string | 是 | Idea UUID |

**输出**: 更新后的 Idea JSON

### chorus_release_idea

**功能**: 放弃认领 Idea（assigned → open）

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ideaUuid | string | 是 | Idea UUID |

**输出**: 更新后的 Idea JSON

### chorus_update_idea_status

**功能**: 更新 Idea 状态（仅认领者可操作）

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ideaUuid | string | 是 | Idea UUID |
| status | enum | 是 | 新状态: in_progress, pending_review, completed |

**输出**: 更新后的 Idea JSON

### chorus_pm_create_proposal

**功能**: 创建提议容器（可包含文档草稿和任务草稿）

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| projectUuid | string | 是 | 项目 UUID |
| title | string | 是 | 提议标题 |
| description | string | 否 | 提议描述 |
| inputType | enum | 是 | 输入来源类型: idea, document |
| inputUuids | string[] | 是 | 输入 UUID 列表 |
| documentDrafts | array | 否 | 文档草稿列表 |
| taskDrafts | array | 否 | 任务草稿列表 |

**输出**: 创建的 Proposal JSON

### chorus_pm_submit_proposal

**功能**: 提交 Proposal 进入审批流程（draft → pending）

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| proposalUuid | string | 是 | Proposal UUID |

**输出**: 更新后的 Proposal JSON（status 变为 pending）

### chorus_pm_create_document

**功能**: 创建文档（PRD、技术设计、ADR 等）

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| projectUuid | string | 是 | 项目 UUID |
| type | enum | 是 | 文档类型: prd, tech_design, adr, spec, guide |
| title | string | 是 | 文档标题 |
| content | string | 否 | 文档内容（Markdown） |
| proposalUuid | string | 否 | 关联的 Proposal UUID |

**输出**: 创建的 Document JSON

### chorus_pm_create_tasks

**功能**: 批量创建任务（可关联 Proposal）

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| projectUuid | string | 是 | 项目 UUID |
| proposalUuid | string | 否 | 关联的 Proposal UUID |
| tasks | array | 是 | 任务列表（含 title, description, priority, storyPoints, acceptanceCriteria） |

**输出**: 创建的任务列表 JSON

### chorus_pm_update_document

**功能**: 更新文档内容（会增加版本号）

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| documentUuid | string | 是 | 文档 UUID |
| title | string | 否 | 新标题 |
| content | string | 否 | 新内容（Markdown） |

**输出**: 更新后的 Document JSON

### chorus_pm_add_document_draft

**功能**: 添加文档草稿到待审批的 Proposal 容器中

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| proposalUuid | string | 是 | Proposal UUID |
| type | string | 是 | 文档类型 |
| title | string | 是 | 文档标题 |
| content | string | 是 | 文档内容（Markdown） |

**输出**: 更新后的 Proposal JSON

### chorus_pm_add_task_draft

**功能**: 添加任务草稿到待审批的 Proposal 容器中

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| proposalUuid | string | 是 | Proposal UUID |
| title | string | 是 | 任务标题 |
| description | string | 否 | 任务描述 |
| storyPoints | number | 否 | 工作量估算（Agent 小时） |
| priority | enum | 否 | 优先级: low, medium, high |
| acceptanceCriteria | string | 否 | 验收标准（Markdown） |

**输出**: 更新后的 Proposal JSON

### chorus_pm_update_document_draft

**功能**: 更新 Proposal 中的文档草稿

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| proposalUuid | string | 是 | Proposal UUID |
| draftUuid | string | 是 | 文档草稿 UUID |
| type | string | 否 | 文档类型 |
| title | string | 否 | 文档标题 |
| content | string | 否 | 文档内容 |

**输出**: 更新后的 Proposal JSON

### chorus_pm_update_task_draft

**功能**: 更新 Proposal 中的任务草稿

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| proposalUuid | string | 是 | Proposal UUID |
| draftUuid | string | 是 | 任务草稿 UUID |
| title | string | 否 | 任务标题 |
| description | string | 否 | 任务描述 |
| storyPoints | number | 否 | 工作量估算 |
| priority | enum | 否 | 优先级 |
| acceptanceCriteria | string | 否 | 验收标准 |

**输出**: 更新后的 Proposal JSON

### chorus_pm_remove_document_draft

**功能**: 从 Proposal 中删除文档草稿

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| proposalUuid | string | 是 | Proposal UUID |
| draftUuid | string | 是 | 文档草稿 UUID |

**输出**: 更新后的 Proposal JSON

### chorus_pm_remove_task_draft

**功能**: 从 Proposal 中删除任务草稿

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| proposalUuid | string | 是 | Proposal UUID |
| draftUuid | string | 是 | 任务草稿 UUID |

**输出**: 更新后的 Proposal JSON

---

## Developer Agent 工具 (Developer Tools)

Developer Agent 和 Admin Agent 可使用。PM Agent 不可使用。

### chorus_claim_task

**功能**: 认领一个 Task（open → assigned）

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskUuid | string | 是 | Task UUID |

**输出**: 更新后的 Task JSON

### chorus_release_task

**功能**: 放弃认领 Task（assigned → open）

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskUuid | string | 是 | Task UUID |

**输出**: 更新后的 Task JSON

### chorus_update_task

**功能**: 更新任务状态（仅认领者可操作）

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskUuid | string | 是 | Task UUID |
| status | enum | 是 | 新状态: in_progress, to_verify |

**输出**: 更新后的 Task JSON

### chorus_submit_for_verify

**功能**: 提交任务等待人类验证（in_progress → to_verify）

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskUuid | string | 是 | Task UUID |
| summary | string | 否 | 工作摘要 |

**输出**: 更新后的 Task JSON

### chorus_report_work

**功能**: 报告工作进展或完成情况

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskUuid | string | 是 | Task UUID |
| report | string | 是 | 工作报告内容 |
| status | enum | 否 | 可选：同时更新状态: in_progress, to_verify |

**输出**: 确认消息

---

## Admin Agent 工具 (Admin Tools)

仅 Admin Agent 可使用。用于代理人类执行审批、验证、项目管理等操作。

### chorus_admin_create_project

**功能**: 创建新项目

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 项目名称 |
| description | string | 否 | 项目描述 |

**输出**: 创建的 Project JSON

### chorus_admin_create_idea

**功能**: 创建 Idea（代理人类提出需求）

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| projectUuid | string | 是 | 项目 UUID |
| title | string | 是 | Idea 标题 |
| content | string | 否 | Idea 详细描述 |

**输出**: 创建的 Idea JSON

### chorus_admin_approve_proposal

**功能**: 审批通过 Proposal

**重要行为**: 审批通过后，系统会自动将 Proposal 中的所有草稿物化（materialize）为实际资源：
- `documentDrafts` → 自动创建对应的 Document（关联此 Proposal）
- `taskDrafts` → 自动创建对应的 Task（关联此 Proposal）

因此，审批通过后**不需要**再手动调用 `chorus_pm_create_tasks` 或 `chorus_pm_create_document` 来创建这些资源，否则会产生重复数据。`chorus_pm_create_tasks` 和 `chorus_pm_create_document` 仅用于不通过 Proposal 流程直接创建资源的场景。

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| proposalUuid | string | 是 | Proposal UUID |
| reviewNote | string | 否 | 审批备注 |

**输出**: 更新后的 Proposal JSON

### chorus_admin_reject_proposal

**功能**: 拒绝 Proposal

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| proposalUuid | string | 是 | Proposal UUID |
| reviewNote | string | 是 | 拒绝原因（必填） |

**输出**: 更新后的 Proposal JSON

### chorus_admin_verify_task

**功能**: 验证 Task（to_verify → done）

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskUuid | string | 是 | Task UUID |

**输出**: 更新后的 Task JSON

### chorus_admin_reopen_task

**功能**: 重新打开 Task（to_verify → in_progress，验证不通过时使用）

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskUuid | string | 是 | Task UUID |

**输出**: 更新后的 Task JSON

### chorus_admin_close_task

**功能**: 关闭 Task（任何状态 → closed）

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskUuid | string | 是 | Task UUID |

**输出**: 更新后的 Task JSON

### chorus_admin_close_idea

**功能**: 关闭 Idea（任何状态 → closed）

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ideaUuid | string | 是 | Idea UUID |

**输出**: 更新后的 Idea JSON

### chorus_admin_delete_idea

**功能**: 删除 Idea

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ideaUuid | string | 是 | Idea UUID |

**输出**: 确认消息

### chorus_admin_delete_task

**功能**: 删除 Task

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| taskUuid | string | 是 | Task UUID |

**输出**: 确认消息

### chorus_admin_delete_document

**功能**: 删除 Document

**输入**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| documentUuid | string | 是 | Document UUID |

**输出**: 确认消息

---

## 测试记录

### 测试日期: 2026-02-07

### 测试环境
- Agent: Sr. Claude (uuid: 1e7019fd-..., roles: developer_agent, pm_agent, admin_agent)
- Server: localhost:3000

### 测试流程及结果

| # | 工具 | 操作 | 结果 | 备注 |
|---|------|------|------|------|
| 1 | chorus_checkin | Agent 签到 | ✅ 通过 | 返回 agent 信息、assignments、pending |
| 2 | chorus_admin_create_project | 创建项目 | ✅ 通过 | 返回 project UUID |
| 3 | chorus_get_project | 获取项目详情 | ✅ 通过 | |
| 4 | chorus_admin_create_idea | 创建 Idea | ✅ 通过 | status=open |
| 5 | chorus_get_ideas | 获取 Ideas 列表 | ✅ 通过 | 分页正确 |
| 6 | chorus_get_idea | 获取单个 Idea | ✅ 通过 | ⚠️ 返回了 `id` 字段（应隐藏） |
| 7 | chorus_get_available_ideas | 获取可认领 Ideas | ✅ 通过 | |
| 8 | chorus_claim_idea | 认领 Idea | ✅ 通过 | open → assigned |
| 9 | chorus_update_idea_status | 更新 Idea 状态 | ✅ 通过 | assigned → in_progress |
| 10 | chorus_get_my_assignments | 获取我的分配 | ✅ 通过 | ideas 和 tasks 列表 |
| 11 | chorus_add_comment (idea) | 评论 Idea | ✅ 通过 | |
| 12 | chorus_get_comments | 获取评论列表 | ✅ 通过 | |
| 13 | chorus_pm_create_proposal | 创建 Proposal | ✅ 通过 | 含 documentDrafts + taskDrafts，status=draft |
| 14 | chorus_get_proposals | 获取 Proposals 列表 | ✅ 通过 | |
| 15 | chorus_get_proposal | 获取单个 Proposal | ✅ 通过 | |
| 16 | chorus_pm_add_document_draft | 添加文档草稿 | ✅ 通过 | 追加到 documentDrafts |
| 17 | chorus_pm_add_task_draft | 添加任务草稿 | ✅ 通过 | ⚠️ storyPoints 必须传 number 类型（MCP 传 string 会报错） |
| 18 | chorus_pm_update_document_draft | 更新文档草稿 | ✅ 通过 | |
| 19 | chorus_pm_update_task_draft | 更新任务草稿 | ✅ 通过 | |
| 20 | chorus_pm_remove_task_draft | 删除任务草稿 | ✅ 通过 | |
| 21 | chorus_pm_submit_proposal | 提交 Proposal 审批 | ✅ 通过 | draft → pending（**新增工具**） |
| 22 | chorus_admin_approve_proposal | 审批通过 Proposal | ✅ 通过 | pending → approved，⚠️ 自动从 drafts 创建 tasks 和 documents |
| 23 | chorus_add_comment (proposal) | 评论 Proposal | ✅ 通过 | |
| 24 | chorus_pm_create_tasks | 批量创建任务 | ✅ 通过 | ⚠️ 如果 approve 已自动创建，手动调用会产生重复 |
| 25 | chorus_pm_create_document | 创建文档 | ✅ 通过 | version=1 |
| 26 | chorus_pm_update_document | 更新文档 | ✅ 通过 | version 自动递增到 2 |
| 27 | chorus_list_tasks | 列出任务 | ✅ 通过 | |
| 28 | chorus_get_available_tasks | 获取可认领 Tasks | ✅ 通过 | |
| 29 | chorus_claim_task | 认领 Task | ✅ 通过 | open → assigned |
| 30 | chorus_update_task | 更新任务状态 | ✅ 通过 | assigned → in_progress |
| 31 | chorus_report_work | 报告工作进展 | ✅ 通过 | 记录活动 |
| 32 | chorus_add_comment (task) | 评论 Task | ✅ 通过 | |
| 33 | chorus_submit_for_verify | 提交验证 | ✅ 通过 | in_progress → to_verify |
| 34 | chorus_admin_reopen_task | 重新打开 Task | ✅ 通过 | to_verify → in_progress |
| 35 | chorus_admin_verify_task | 验证 Task | ✅ 通过 | to_verify → done |
| 36 | chorus_release_task | 放弃认领 Task | ✅ 通过 | assigned → open |
| 37 | chorus_admin_close_task | 关闭 Task | ✅ 通过 | any → closed |
| 38 | chorus_get_task | 获取单个 Task | ✅ 通过 | ⚠️ 返回了 `id` 字段（应隐藏） |
| 39 | chorus_get_document | 获取单个文档 | ✅ 通过 | |
| 40 | chorus_get_activity | 获取活动流 | ✅ 通过 | 记录了 submit、comment_added 等活动 |
| 41 | chorus_release_idea | 放弃认领 Idea | ✅ 通过 | assigned → open |
| 42 | chorus_admin_close_idea | 关闭 Idea | ✅ 通过 | any → closed |
| 43 | chorus_admin_reject_proposal | 拒绝 Proposal | ✅ 通过 | pending → rejected，含 reviewNote |
| 44 | chorus_admin_delete_task | 删除 Task | ✅ 通过 | |
| 45 | chorus_admin_delete_document | 删除 Document | ✅ 通过 | |
| 46 | chorus_admin_delete_idea | 删除 Idea | ✅ 通过 | |

### 发现的问题及修复

#### 🐛 Bug: 缺少 `chorus_pm_submit_proposal` 工具（已修复 ✅）
- **问题**: Proposal 创建后 status=draft，但没有 MCP 工具可以将其提交为 pending 状态，导致 `admin_approve_proposal` 无法使用（只接受 pending 状态）
- **修复**: 在 `src/mcp/tools/pm.ts` 中添加了 `chorus_pm_submit_proposal` 工具

#### 🐛 Bug: `get_idea` 和 `get_task` 返回原始 DB 字段（已修复 ✅）
- **问题**: `chorus_get_idea` 和 `chorus_get_task` 返回了 `id`（数据库自增 ID）和 `companyUuid` 等内部字段
- **修复**: 改为调用 `ideaService.getIdea()` 和 `taskService.getTask()`，返回格式化后的响应

#### 🐛 Bug: PM 工具集错误包含 Developer 工具（已修复 ✅）
- **问题**: PM Agent 被错误地注册了 Developer 工具集
- **修复**: 修改 `src/mcp/server.ts`，PM Agent 仅注册 Public + PM 工具

#### 🐛 Bug: Activity 记录不完整（已修复 ✅）
- **问题**: 只有 `submit_for_verify` 和 `report_work` 生成了 Activity 记录，其余 12 个操作缺失
- **修复**: 为以下操作添加了 Activity 记录：
  - PM: `claim_idea`, `release_idea`, `update_idea_status`
  - Developer: `claim_task`, `release_task`, `update_task`
  - Admin: `approve_proposal`, `reject_proposal`, `verify_task`, `reopen_task`, `close_task`, `close_idea`

#### ℹ️ 注意: `admin_approve_proposal` 自动物化草稿（已在文档说明 ✅）
- 审批 Proposal 时会自动从 drafts 物化为实际的 Tasks 和 Documents
- 审批后不需要再手动调用 `pm_create_tasks` 或 `pm_create_document`
