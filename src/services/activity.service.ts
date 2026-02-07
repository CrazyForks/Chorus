// src/services/activity.service.ts
// Activity 服务层 (ARCHITECTURE.md §3.1 Service Layer)
// UUID-Based Architecture: All operations use UUIDs

import { prisma } from "@/lib/prisma";
import { getActorName } from "@/lib/uuid-resolver";

export type TargetType = "idea" | "task" | "proposal" | "document";

export interface ActivityListParams {
  companyUuid: string;
  projectUuid: string;
  skip: number;
  take: number;
  targetType?: TargetType;
  targetUuid?: string;
}

export interface ActivityCreateParams {
  companyUuid: string;
  projectUuid: string;
  targetType: TargetType;
  targetUuid: string;
  actorType: string;
  actorUuid: string;
  action: string;
  value?: unknown;
}

// 带有 actor 名称的 Activity 响应格式
export interface ActivityResponse {
  uuid: string;
  targetType: string;
  targetUuid: string;
  action: string;
  actorType: string;
  actorName: string;
  value: unknown;
  createdAt: string;
}

// Activities 列表查询
export async function listActivities({
  companyUuid,
  projectUuid,
  skip,
  take,
  targetType,
  targetUuid,
}: ActivityListParams) {
  const where = {
    projectUuid,
    companyUuid,
    ...(targetType && { targetType }),
    ...(targetUuid && { targetUuid }),
  };

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        uuid: true,
        targetType: true,
        targetUuid: true,
        actorType: true,
        actorUuid: true,
        action: true,
        value: true,
        createdAt: true,
      },
    }),
    prisma.activity.count({ where }),
  ]);

  return { activities, total };
}

// Activities 列表查询（带 actor 名称解析）
export async function listActivitiesWithActorNames(
  params: ActivityListParams
): Promise<{ activities: ActivityResponse[]; total: number }> {
  const { activities: rawActivities, total } = await listActivities(params);

  // 批量解析 actor 名称
  const activities: ActivityResponse[] = await Promise.all(
    rawActivities.map(async (activity) => {
      const actorName = await getActorName(activity.actorType, activity.actorUuid);
      return {
        uuid: activity.uuid,
        targetType: activity.targetType,
        targetUuid: activity.targetUuid,
        action: activity.action,
        actorType: activity.actorType,
        actorName: actorName || "Unknown",
        value: activity.value,
        createdAt: activity.createdAt.toISOString(),
      };
    })
  );

  return { activities, total };
}

// 创建 Activity
export async function createActivity({
  companyUuid,
  projectUuid,
  targetType,
  targetUuid,
  actorType,
  actorUuid,
  action,
  value,
}: ActivityCreateParams) {
  return prisma.activity.create({
    data: {
      companyUuid,
      projectUuid,
      targetType,
      targetUuid,
      actorType,
      actorUuid,
      action,
      value: value || undefined,
    },
  });
}
