"use server";

import { getServerAuthContext } from "@/lib/auth-server";
import { listActivitiesWithActorNames, type ActivityResponse } from "@/services/activity.service";
import { getTaskByUuid } from "@/services/task.service";

export async function getTaskActivitiesAction(
  taskUuid: string
): Promise<{ activities: ActivityResponse[]; total: number }> {
  const auth = await getServerAuthContext();
  if (!auth) {
    return { activities: [], total: 0 };
  }

  try {
    // 验证 task 存在
    const task = await getTaskByUuid(auth.companyUuid, taskUuid);
    if (!task) {
      return { activities: [], total: 0 };
    }

    return await listActivitiesWithActorNames({
      companyUuid: auth.companyUuid,
      projectUuid: task.projectUuid,
      targetType: "task",
      targetUuid: taskUuid,
      skip: 0,
      take: 50,
    });
  } catch (error) {
    console.error("Failed to get task activities:", error);
    return { activities: [], total: 0 };
  }
}
