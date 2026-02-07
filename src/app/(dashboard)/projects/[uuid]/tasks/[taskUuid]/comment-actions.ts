"use server";

import { revalidatePath } from "next/cache";
import { getServerAuthContext } from "@/lib/auth-server";
import { listComments, createComment, type CommentResponse } from "@/services/comment.service";
import { getTaskByUuid } from "@/services/task.service";

export async function getTaskCommentsAction(
  taskUuid: string
): Promise<{ comments: CommentResponse[]; total: number }> {
  const auth = await getServerAuthContext();
  if (!auth) {
    return { comments: [], total: 0 };
  }

  try {
    const result = await listComments({
      companyUuid: auth.companyUuid,
      targetType: "task",
      targetUuid: taskUuid,
      skip: 0,
      take: 100,
    });
    return result;
  } catch (error) {
    console.error("Failed to get task comments:", error);
    return { comments: [], total: 0 };
  }
}

export async function createTaskCommentAction(
  taskUuid: string,
  content: string
): Promise<{ success: boolean; comment?: CommentResponse; error?: string }> {
  const auth = await getServerAuthContext();
  if (!auth) {
    return { success: false, error: "Unauthorized" };
  }

  if (!content.trim()) {
    return { success: false, error: "Comment content is required" };
  }

  try {
    // 验证 task 存在
    const task = await getTaskByUuid(auth.companyUuid, taskUuid);
    if (!task) {
      return { success: false, error: "Task not found" };
    }

    const comment = await createComment({
      companyUuid: auth.companyUuid,
      targetType: "task",
      targetUuid: taskUuid,
      content: content.trim(),
      authorType: auth.type,
      authorUuid: auth.actorUuid,
    });

    revalidatePath(`/projects/${task.projectUuid}/tasks`);

    return { success: true, comment };
  } catch (error) {
    console.error("Failed to create task comment:", error);
    return { success: false, error: "Failed to create comment" };
  }
}
