import crypto from "node:crypto";
import { prisma } from "@/lib/db";

export const CLI_AUTH_REQUEST_TTL_MS = 10 * 60 * 1000;
export const CLI_AUTH_POLL_INTERVAL_SECONDS = 2;
export const DEFAULT_CLI_TOKEN_NAME = "Centavo CLI";

export const CLI_AUTH_REQUEST_STATUSES = {
  pending: "pending",
  approved: "approved",
  consumed: "consumed",
  expired: "expired",
} as const;

type CliAuthRequestStatus =
  (typeof CLI_AUTH_REQUEST_STATUSES)[keyof typeof CLI_AUTH_REQUEST_STATUSES];

export interface CliAuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface CliTokenAuthContext {
  user: CliAuthUser;
  tokenId: string;
}

function generateRandomBase64Url(size: number) {
  return crypto.randomBytes(size).toString("base64url");
}

export function hashCliSecret(secret: string) {
  return crypto.createHash("sha256").update(secret).digest("hex");
}

export function generateCliAuthRequestCode() {
  return generateRandomBase64Url(24);
}

export function generateCliTokenValue() {
  return `ctv_${generateRandomBase64Url(32)}`;
}

export function generateCliUserCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const chars = Array.from({ length: 8 }, () => {
    const index = crypto.randomInt(0, alphabet.length);
    return alphabet[index];
  });

  return `${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
}

function getEffectiveRequestStatus(
  status: string,
  expiresAt: Date,
  now: Date = new Date(),
): CliAuthRequestStatus {
  if (
    status !== CLI_AUTH_REQUEST_STATUSES.consumed &&
    expiresAt.getTime() <= now.getTime()
  ) {
    return CLI_AUTH_REQUEST_STATUSES.expired;
  }

  return status as CliAuthRequestStatus;
}

export async function createCliAuthRequest() {
  const expiresAt = new Date(Date.now() + CLI_AUTH_REQUEST_TTL_MS);

  return prisma.cliAuthRequest.create({
    data: {
      code: generateCliAuthRequestCode(),
      userCode: generateCliUserCode(),
      status: CLI_AUTH_REQUEST_STATUSES.pending,
      expiresAt,
    },
  });
}

export async function getCliAuthRequest(id: string, code: string) {
  const request = await prisma.cliAuthRequest.findFirst({
    where: { id, code },
    select: {
      id: true,
      code: true,
      userCode: true,
      status: true,
      userId: true,
      expiresAt: true,
      approvedAt: true,
      consumedAt: true,
      createdAt: true,
    },
  });

  if (!request) return null;

  return {
    ...request,
    status: getEffectiveRequestStatus(request.status, request.expiresAt),
  };
}

export async function approveCliAuthRequest(
  id: string,
  code: string,
  userId: string,
) {
  const request = await getCliAuthRequest(id, code);
  if (!request) return null;

  if (request.status === CLI_AUTH_REQUEST_STATUSES.expired) {
    throw new Error("Auth request expired");
  }

  if (request.status === CLI_AUTH_REQUEST_STATUSES.consumed) {
    throw new Error("Auth request already consumed");
  }

  const now = new Date();

  return prisma.cliAuthRequest.update({
    where: { id: request.id },
    data: {
      status: CLI_AUTH_REQUEST_STATUSES.approved,
      userId,
      approvedAt: now,
    },
    select: {
      id: true,
      userCode: true,
      status: true,
      userId: true,
      expiresAt: true,
      approvedAt: true,
    },
  });
}

export async function consumeCliAuthRequest(
  id: string,
  code: string,
  name?: string,
) {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const request = await tx.cliAuthRequest.findFirst({
      where: { id, code },
      select: {
        id: true,
        status: true,
        userId: true,
        expiresAt: true,
      },
    });

    if (!request) {
      throw new Error("Auth request not found");
    }

    const effectiveStatus = getEffectiveRequestStatus(
      request.status,
      request.expiresAt,
      now,
    );

    if (effectiveStatus === CLI_AUTH_REQUEST_STATUSES.expired) {
      throw new Error("Auth request expired");
    }

    if (
      effectiveStatus !== CLI_AUTH_REQUEST_STATUSES.approved ||
      !request.userId
    ) {
      throw new Error("Auth request not approved");
    }

    const updated = await tx.cliAuthRequest.updateMany({
      where: {
        id,
        code,
        status: CLI_AUTH_REQUEST_STATUSES.approved,
        consumedAt: null,
        expiresAt: { gt: now },
      },
      data: {
        status: CLI_AUTH_REQUEST_STATUSES.consumed,
        consumedAt: now,
      },
    });

    if (updated.count !== 1) {
      throw new Error("Auth request already consumed");
    }

    const rawToken = generateCliTokenValue();
    const token = await tx.cliToken.create({
      data: {
        userId: request.userId,
        name: name?.trim() || DEFAULT_CLI_TOKEN_NAME,
        tokenHash: hashCliSecret(rawToken),
      },
    });

    return { rawToken, token };
  });
}

export async function getCliTokenAuthFromRequest(
  request: Request,
): Promise<CliTokenAuthContext | null> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const rawToken = authorization.slice("Bearer ".length).trim();
  if (!rawToken) return null;

  const token = await prisma.cliToken.findUnique({
    where: { tokenHash: hashCliSecret(rawToken) },
    select: {
      id: true,
      revokedAt: true,
      expiresAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  if (!token) return null;

  if (token.revokedAt) return null;
  if (token.expiresAt && token.expiresAt.getTime() <= Date.now()) return null;

  await prisma.cliToken.update({
    where: { id: token.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    tokenId: token.id,
    user: token.user,
  };
}

export async function revokeCliTokenById(id: string) {
  return prisma.cliToken.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
}
