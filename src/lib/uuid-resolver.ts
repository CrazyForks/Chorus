// src/lib/uuid-resolver.ts
// UUID Resolver - Simplified (UUID-Based Architecture)
// Most conversion functions are no longer needed; only formatting display utilities remain

import { prisma } from "@/lib/prisma";

export type TargetType = "idea" | "proposal" | "task" | "document";
export type ActorType = "user" | "agent";

// Get Actor name by UUID (for display)
export async function getActorName(
  actorType: string,
  actorUuid: string
): Promise<string | null> {
  if (actorType === "user") {
    const user = await prisma.user.findUnique({
      where: { uuid: actorUuid },
      select: { name: true, email: true },
    });
    if (!user) return "Unknown";
    // Prefer name, fall back to email
    return user.name || user.email || "Unknown";
  } else if (actorType === "agent") {
    const agent = await prisma.agent.findUnique({
      where: { uuid: actorUuid },
      select: { name: true },
    });
    return agent?.name ?? null;
  }
  return null;
}

// Format assignee info (using UUID directly)
export async function formatAssignee(
  assigneeType: string | null,
  assigneeUuid: string | null
): Promise<{ type: string; uuid: string; name: string } | null> {
  if (!assigneeType || !assigneeUuid) return null;

  const name = await getActorName(assigneeType, assigneeUuid);
  if (!name) return null;

  return {
    type: assigneeType,
    uuid: assigneeUuid,
    name,
  };
}

// Format createdBy info (using UUID directly)
// If type is not specified, tries user first, then agent
export async function formatCreatedBy(
  createdByUuid: string,
  creatorType?: "user" | "agent"
): Promise<{ type: string; uuid: string; name: string } | null> {
  if (creatorType) {
    const name = await getActorName(creatorType, createdByUuid);
    if (!name) return null;
    return { type: creatorType, uuid: createdByUuid, name };
  }

  // Type not specified, try user first
  const user = await prisma.user.findUnique({
    where: { uuid: createdByUuid },
    select: { name: true, email: true },
  });
  if (user) {
    return { type: "user", uuid: createdByUuid, name: user.name || user.email || "Unknown" };
  }

  // Then try agent
  const agent = await prisma.agent.findUnique({
    where: { uuid: createdByUuid },
    select: { name: true },
  });
  if (agent) {
    return { type: "agent", uuid: createdByUuid, name: agent.name };
  }

  return null;
}

// Complete assignee formatting (including assignedAt and assignedBy)
export interface AssigneeInfo {
  type: string;
  uuid: string;
  name: string;
  assignedAt: string | null;
  assignedBy: { type: string; uuid: string; name: string } | null;
}

export async function formatAssigneeComplete(
  assigneeType: string | null,
  assigneeUuid: string | null,
  assignedAt: Date | null,
  assignedByUuid: string | null // assignedBy is always user
): Promise<AssigneeInfo | null> {
  if (!assigneeType || !assigneeUuid) return null;

  const assigneeName = await getActorName(assigneeType, assigneeUuid);
  if (!assigneeName) return null;

  let assignedByInfo: { type: string; uuid: string; name: string } | null = null;
  if (assignedByUuid) {
    const userName = await getActorName("user", assignedByUuid);
    if (userName) {
      assignedByInfo = {
        type: "user",
        uuid: assignedByUuid,
        name: userName,
      };
    }
  }

  return {
    type: assigneeType,
    uuid: assigneeUuid,
    name: assigneeName,
    assignedAt: assignedAt?.toISOString() ?? null,
    assignedBy: assignedByInfo,
  };
}

// Format Proposal review info
export interface ReviewInfo {
  reviewedBy: { type: string; uuid: string; name: string };
  reviewNote: string | null;
  reviewedAt: string | null;
}

export async function formatReview(
  reviewedByUuid: string | null,
  reviewNote: string | null,
  reviewedAt: Date | null
): Promise<ReviewInfo | null> {
  if (!reviewedByUuid) return null;

  const userName = await getActorName("user", reviewedByUuid);
  if (!userName) return null;

  return {
    reviewedBy: {
      type: "user",
      uuid: reviewedByUuid,
      name: userName,
    },
    reviewNote,
    reviewedAt: reviewedAt?.toISOString() ?? null,
  };
}

// Get Session name by UUID
export async function getSessionName(sessionUuid: string): Promise<string | null> {
  const session = await prisma.agentSession.findUnique({
    where: { uuid: sessionUuid },
    select: { name: true },
  });
  return session?.name ?? null;
}

// Validate target entity exists (using UUID directly)
export async function validateTargetExists(
  targetType: TargetType,
  targetUuid: string,
  companyUuid: string
): Promise<boolean> {
  const where = { uuid: targetUuid, companyUuid };

  switch (targetType) {
    case "idea":
      return !!(await prisma.idea.findFirst({ where, select: { uuid: true } }));
    case "proposal":
      return !!(await prisma.proposal.findFirst({ where, select: { uuid: true } }));
    case "task":
      return !!(await prisma.task.findFirst({ where, select: { uuid: true } }));
    case "document":
      return !!(await prisma.document.findFirst({ where, select: { uuid: true } }));
    default:
      return false;
  }
}
