import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { badRequest, notFound } from "@/lib/api-utils";
import { consumeCliAuthRequest } from "@/lib/cli-auth";
import { consumeCliAuthRequestSchema } from "@/lib/validations/cli-auth";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = consumeCliAuthRequestSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  try {
    const { rawToken, token } = await consumeCliAuthRequest(
      id,
      parsed.data.code,
      parsed.data.name,
    );
    const user = await prisma.user.findUnique({
      where: { id: token.userId },
      select: {
        id: true,
        email: true,
        name: true,
        baseCurrency: true,
        locale: true,
      },
    });

    return NextResponse.json({
      token: rawToken,
      tokenType: "Bearer",
      name: token.name,
      createdAt: token.createdAt.toISOString(),
      user,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to consume auth request";

    if (message === "Auth request not found") {
      return notFound(message);
    }

    return badRequest(message);
  }
}
