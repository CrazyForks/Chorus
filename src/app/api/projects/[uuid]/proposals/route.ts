// src/app/api/projects/[uuid]/proposals/route.ts
// Proposals API - 列表和创建 (ARCHITECTURE.md §5.1, PRD §4.1 F5)
// UUID-Based Architecture: All operations use UUIDs
// Container Model: Proposal 包含 documentDrafts 和 taskDrafts

import { NextRequest } from "next/server";
import { withErrorHandler, parseBody, parsePagination } from "@/lib/api-handler";
import { success, paginated, errors } from "@/lib/api-response";
import { getAuthContext, isAgent, isPmAgent, isUser } from "@/lib/auth";
import { projectExists } from "@/services/project.service";
import { listProposals, createProposal, type DocumentDraft, type TaskDraft } from "@/services/proposal.service";

type RouteContext = { params: Promise<{ uuid: string }> };

// GET /api/projects/[uuid]/proposals - Proposals 列表
export const GET = withErrorHandler<{ uuid: string }>(
  async (request: NextRequest, context: RouteContext) => {
    const auth = await getAuthContext(request);
    if (!auth) {
      return errors.unauthorized();
    }

    const { uuid: projectUuid } = await context.params;
    const { page, pageSize, skip, take } = parsePagination(request);

    // 解析筛选参数
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get("status") || undefined;

    // 验证项目存在
    if (!(await projectExists(auth.companyUuid, projectUuid))) {
      return errors.notFound("Project");
    }

    const { proposals, total } = await listProposals({
      companyUuid: auth.companyUuid,
      projectUuid,
      skip,
      take,
      status: statusFilter,
    });

    return paginated(proposals, page, pageSize, total);
  }
);

// POST /api/projects/[uuid]/proposals - 创建 Proposal（容器模型）
export const POST = withErrorHandler<{ uuid: string }>(
  async (request: NextRequest, context: RouteContext) => {
    const auth = await getAuthContext(request);
    if (!auth) {
      return errors.unauthorized();
    }

    // PM Agent 或 User 可以创建 Proposal
    const canCreate = isUser(auth) || (isAgent(auth) && isPmAgent(auth));
    if (!canCreate) {
      return errors.forbidden("Only PM agents or users can create proposals");
    }

    const { uuid: projectUuid } = await context.params;

    // 验证项目存在
    if (!(await projectExists(auth.companyUuid, projectUuid))) {
      return errors.notFound("Project");
    }

    const body = await parseBody<{
      title: string;
      description?: string;
      inputType: "idea" | "document";
      inputUuids: string[];
      documentDrafts?: DocumentDraft[];
      taskDrafts?: TaskDraft[];
    }>(request);

    // 验证必填字段
    if (!body.title || body.title.trim() === "") {
      return errors.validationError({ title: "Title is required" });
    }
    if (!body.inputType || !["idea", "document"].includes(body.inputType)) {
      return errors.validationError({ inputType: "Invalid input type" });
    }
    if (!body.inputUuids || !Array.isArray(body.inputUuids) || body.inputUuids.length === 0) {
      return errors.validationError({ inputUuids: "Input UUIDs are required" });
    }

    // 确定创建者类型
    const createdByType = isUser(auth) ? "user" : "agent";

    const proposal = await createProposal({
      companyUuid: auth.companyUuid,
      projectUuid,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      inputType: body.inputType,
      inputUuids: body.inputUuids,
      documentDrafts: body.documentDrafts,
      taskDrafts: body.taskDrafts,
      createdByUuid: auth.actorUuid,
      createdByType,
    });

    return success(proposal);
  }
);
