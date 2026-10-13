import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorized, badRequest } from "@/lib/api-utils";
import { updateUserSchema } from "@/lib/validations/user";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  return NextResponse.json({ user: dbUser });
}

export async function PUT(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const body = await request.json();
  const parsed = updateUserSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: parsed.data,
  });

  for (const path of ["/settings", "/dashboard", "/expenses", "/analytics"]) {
    revalidatePath(path);
  }

  return NextResponse.json({ user: updatedUser });
}
