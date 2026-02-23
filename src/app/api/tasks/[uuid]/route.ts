// src/app/api/tasks/[uuid]/route.ts
// Tasks API - Detail, Update, Delete (ARCHITECTURE.md §5.1, §7.2)
// UUID-Based Architecture: All operations use UUIDs

import { NextRequest } from "next/server";
import { withErrorHandler, parseBody } from "@/lib/api-handler";
import { success, errors } from "@/lib/api-response";
import { getAuthContext, isUser, isAssignee } from "@/lib/auth";
import {
  getTask,
  getTaskByUuid,
  updateTask,
  deleteTask,
  isValidTaskStatusTransition,
} from "@/services/task.service";

type RouteContext = { params: Promise<{ uuid: string }> };

// GET /api/tasks/[uuid] - Task Detail
export const GET = withErrorHandler<{ uuid: string }>(
  async (request: NextRequest, context: RouteContext) => {
    const auth = await getAuthContext(request);
    if (!auth) {
      return errors.unauthorized();
    }

    const { uuid } = await context.params;
    const task = await getTask(auth.companyUuid, uuid);

    if (!task) {
      return errors.notFound("Task");
    }

    return success(task);
  }
);

// PATCH /api/tasks/[uuid] - Update Task
export const PATCH = withErrorHandler<{ uuid: string }>(
  async (request: NextRequest, context: RouteContext) => {
    const auth = await getAuthContext(request);
    if (!auth) {
      return errors.unauthorized();
    }

    const { uuid } = await context.params;

    // Get original Task data for permission check
    const task = await getTaskByUuid(auth.companyUuid, uuid);
    if (!task) {
      return errors.notFound("Task");
    }

    const body = await parseBody<{
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
      storyPoints?: number | null;
    }>(request);

    // Build update data
    const updateData: {
      title?: string;
      description?: string | null;
      status?: string;
      priority?: string;
      storyPoints?: number | null;
    } = {};

    // Title validation
    if (body.title !== undefined) {
      if (body.title.trim() === "") {
        return errors.validationError({ title: "Title cannot be empty" });
      }
      updateData.title = body.title.trim();
    }

    // Description update
    if (body.description !== undefined) {
      updateData.description = body.description.trim() || null;
    }

    // Priority validation
    if (body.priority !== undefined) {
      const validPriorities = ["low", "medium", "high"];
      if (!validPriorities.includes(body.priority)) {
        return errors.validationError({
          priority: "Priority must be low, medium, or high",
        });
      }
      updateData.priority = body.priority;
    }

    // Story Points validation (unit: agent hours)
    if (body.storyPoints !== undefined) {
      if (body.storyPoints !== null && (body.storyPoints < 0 || body.storyPoints > 1000)) {
        return errors.validationError({
          storyPoints: "Story points must be between 0 and 1000 agent hours",
        });
      }
      updateData.storyPoints = body.storyPoints;
    }

    // Status update
    if (body.status !== undefined) {
      // Check if state transition is valid
      if (!isValidTaskStatusTransition(task.status, body.status)) {
        return errors.invalidStatusTransition(task.status, body.status);
      }

      // Non-users can only update the status of Tasks they have claimed
      if (!isUser(auth)) {
        if (!isAssignee(auth, task.assigneeType, task.assigneeUuid)) {
          return errors.permissionDenied("Only assignee can update status");
        }
      }

      updateData.status = body.status;
    }

    const updated = await updateTask(task.uuid, updateData);
    return success(updated);
  }
);

// DELETE /api/tasks/[uuid] - Delete Task
export const DELETE = withErrorHandler<{ uuid: string }>(
  async (request: NextRequest, context: RouteContext) => {
    const auth = await getAuthContext(request);
    if (!auth) {
      return errors.unauthorized();
    }

    // Only users can delete Tasks
    if (!isUser(auth)) {
      return errors.forbidden("Only users can delete tasks");
    }

    const { uuid } = await context.params;

    const task = await getTaskByUuid(auth.companyUuid, uuid);
    if (!task) {
      return errors.notFound("Task");
    }

    await deleteTask(task.uuid);
    return success({ deleted: true });
  }
);
