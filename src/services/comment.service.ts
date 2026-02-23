// src/services/comment.service.ts
// Comment Service Layer (ARCHITECTURE.md §3.1 Service Layer)
// UUID-Based Architecture: All operations use UUIDs

import { prisma } from "@/lib/prisma";
import {
  getActorName,
  validateTargetExists,
  type TargetType,
} from "@/lib/uuid-resolver";

export interface CommentListParams {
  companyUuid: string;
  targetType: TargetType;
  targetUuid: string;
  skip: number;
  take: number;
}

export interface CommentCreateParams {
  companyUuid: string;
  targetType: TargetType;
  targetUuid: string;
  content: string;
  authorType: "user" | "agent";
  authorUuid: string;
}

// Comment response format (using UUIDs)
export interface CommentResponse {
  uuid: string;
  targetType: string;
  targetUuid: string;
  content: string;
  author: {
    type: string;
    uuid: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

// List comments
export async function listComments({
  companyUuid,
  targetType,
  targetUuid,
  skip,
  take,
}: CommentListParams): Promise<{ comments: CommentResponse[]; total: number }> {
  // Validate target exists
  const exists = await validateTargetExists(targetType, targetUuid, companyUuid);
  if (!exists) {
    return { comments: [], total: 0 };
  }

  const where = { companyUuid, targetType, targetUuid };

  const [rawComments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "asc" },
      select: {
        uuid: true,
        targetType: true,
        targetUuid: true,
        content: true,
        authorType: true,
        authorUuid: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.comment.count({ where }),
  ]);

  // Convert to response format
  const comments: CommentResponse[] = await Promise.all(
    rawComments.map(async (c) => {
      const authorName = await getActorName(c.authorType, c.authorUuid);
      return {
        uuid: c.uuid,
        targetType: c.targetType,
        targetUuid: c.targetUuid,
        content: c.content,
        author: {
          type: c.authorType,
          uuid: c.authorUuid,
          name: authorName ?? "Unknown",
        },
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      };
    })
  );

  return { comments, total };
}

// Create comment
export async function createComment({
  companyUuid,
  targetType,
  targetUuid,
  content,
  authorType,
  authorUuid,
}: CommentCreateParams): Promise<CommentResponse> {
  // Validate target exists
  const exists = await validateTargetExists(targetType, targetUuid, companyUuid);
  if (!exists) {
    throw new Error(`Target ${targetType} with UUID ${targetUuid} not found`);
  }

  const comment = await prisma.comment.create({
    data: {
      companyUuid,
      targetType,
      targetUuid,
      content,
      authorType,
      authorUuid,
    },
    select: {
      uuid: true,
      targetType: true,
      targetUuid: true,
      content: true,
      authorType: true,
      authorUuid: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Get author name
  const authorName = await getActorName(comment.authorType, comment.authorUuid);

  return {
    uuid: comment.uuid,
    targetType: comment.targetType,
    targetUuid: comment.targetUuid,
    content: comment.content,
    author: {
      type: comment.authorType,
      uuid: comment.authorUuid,
      name: authorName ?? "Unknown",
    },
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  };
}

// Resolve projectUuid from a comment target entity
export async function resolveProjectUuid(
  targetType: string,
  targetUuid: string
): Promise<string | null> {
  switch (targetType) {
    case "task": {
      const task = await prisma.task.findUnique({ where: { uuid: targetUuid }, select: { projectUuid: true } });
      return task?.projectUuid ?? null;
    }
    case "idea": {
      const idea = await prisma.idea.findUnique({ where: { uuid: targetUuid }, select: { projectUuid: true } });
      return idea?.projectUuid ?? null;
    }
    case "proposal": {
      const proposal = await prisma.proposal.findUnique({ where: { uuid: targetUuid }, select: { projectUuid: true } });
      return proposal?.projectUuid ?? null;
    }
    case "document": {
      const doc = await prisma.document.findUnique({ where: { uuid: targetUuid }, select: { projectUuid: true } });
      return doc?.projectUuid ?? null;
    }
    default:
      return null;
  }
}

// Batch get comment counts
export async function batchCommentCounts(
  companyUuid: string,
  targetType: TargetType,
  targetUuids: string[]
): Promise<Record<string, number>> {
  if (targetUuids.length === 0) return {};

  const counts = await prisma.comment.groupBy({
    by: ["targetUuid"],
    where: {
      companyUuid,
      targetType,
      targetUuid: { in: targetUuids },
    },
    _count: { targetUuid: true },
  });

  const result: Record<string, number> = {};
  for (const uuid of targetUuids) {
    result[uuid] = 0;
  }
  for (const item of counts) {
    result[item.targetUuid] = item._count.targetUuid;
  }
  return result;
}
