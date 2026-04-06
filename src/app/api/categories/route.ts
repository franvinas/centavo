import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorized, badRequest } from "@/lib/api-utils";
import { createCategorySchema } from "@/lib/validations/category";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    include: {
      _count: {
        select: { expenses: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ categories });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const body = await request.json();
  const parsed = createCategorySchema.safeParse(body);

  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const { name, color, icon } = parsed.data;

  const existing = await prisma.category.findUnique({
    where: { userId_name: { userId: user.id, name } },
  });

  if (existing) {
    return badRequest("A category with this name already exists");
  }

  const category = await prisma.category.create({
    data: { userId: user.id, name, color, icon },
  });

  return NextResponse.json({ category }, { status: 201 });
}
