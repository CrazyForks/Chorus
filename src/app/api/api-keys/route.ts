// src/app/api/api-keys/route.ts
// API Keys API - List and Create (ARCHITECTURE.md §5.1, §9.1)
// UUID-Based Architecture: All operations use UUIDs

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, parseBody, parsePagination } from "@/lib/api-handler";
import { success, paginated, errors } from "@/lib/api-response";
import { getAuthContext, isUser } from "@/lib/auth";
import { generateApiKey } from "@/lib/api-key";

// GET /api/api-keys - List API Keys
export const GET = withErrorHandler(async (request: NextRequest) => {
  const auth = await getAuthContext(request);
  if (!auth) {
    return errors.unauthorized();
  }

  // Only users can view the API Key list
  if (!isUser(auth)) {
    return errors.forbidden("Only users can view API keys");
  }

  const { page, pageSize, skip, take } = parsePagination(request);

  const where = {
    companyUuid: auth.companyUuid,
    revokedAt: null,
  };

  const [apiKeys, total] = await Promise.all([
    prisma.apiKey.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        agent: {
          select: {
            uuid: true,
            name: true,
            roles: true,
          },
        },
      },
    }),
    prisma.apiKey.count({ where }),
  ]);

  const data = apiKeys.map((k) => ({
    uuid: k.uuid,
    prefix: k.keyPrefix,
    name: k.name,
    agent: {
      uuid: k.agent.uuid,
      name: k.agent.name,
      roles: k.agent.roles,
    },
    lastUsed: k.lastUsed?.toISOString() || null,
    expiresAt: k.expiresAt?.toISOString() || null,
    createdAt: k.createdAt.toISOString(),
  }));

  return paginated(data, page, pageSize, total);
});

// POST /api/api-keys - Create API Key
export const POST = withErrorHandler(async (request: NextRequest) => {
  const auth = await getAuthContext(request);
  if (!auth) {
    return errors.unauthorized();
  }

  // Only users can create API Keys
  if (!isUser(auth)) {
    return errors.forbidden("Only users can create API keys");
  }

  const body = await parseBody<{
    agentUuid: string;
    name?: string;
    expiresAt?: string;
  }>(request);

  // Validate required fields
  if (!body.agentUuid) {
    return errors.validationError({ agentUuid: "Agent UUID is required" });
  }

  // Validate Agent exists (query by UUID)
  const agent = await prisma.agent.findFirst({
    where: { uuid: body.agentUuid, companyUuid: auth.companyUuid },
    select: { uuid: true, name: true, roles: true },
  });

  if (!agent) {
    return errors.notFound("Agent");
  }

  // Generate API Key
  const { key, hash, prefix } = generateApiKey();

  // Parse expiration time
  let expiresAt: Date | null = null;
  if (body.expiresAt) {
    expiresAt = new Date(body.expiresAt);
    if (isNaN(expiresAt.getTime())) {
      return errors.validationError({ expiresAt: "Invalid expiration date" });
    }
  }

  const apiKey = await prisma.apiKey.create({
    data: {
      companyUuid: auth.companyUuid,
      agentUuid: agent.uuid,
      keyHash: hash,
      keyPrefix: prefix,
      name: body.name?.trim() || null,
      expiresAt,
    },
    select: {
      uuid: true,
      keyPrefix: true,
      name: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  // Only return the plaintext key at creation time (cannot be recovered later)
  return success({
    uuid: apiKey.uuid,
    key, // This is the only time the full key is visible
    prefix: apiKey.keyPrefix,
    name: apiKey.name,
    agent: {
      uuid: agent.uuid,
      name: agent.name,
      roles: agent.roles,
    },
    lastUsed: null,
    expiresAt: apiKey.expiresAt?.toISOString() || null,
    createdAt: apiKey.createdAt.toISOString(),
  });
});
