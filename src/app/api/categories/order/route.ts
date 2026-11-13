import { NextRequest, NextResponse } from "next/server";
import { badRequest, getAuthUser, unauthorized } from "@/lib/api-utils";
import { reorderCategoriesSchema } from "@/lib/validations/category-reorder";
import {
  CATEGORY_ORDER_CHANGED,
  reorderCategoriesForUser,
} from "@/lib/services/categories";

export async function PUT(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const parsed = reorderCategoriesSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  try {
    const result = await reorderCategoriesForUser(user.id, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === CATEGORY_ORDER_CHANGED) {
      return NextResponse.json(
        { error: error.message, code: "CONFLICT" },
        { status: 409 },
      );
    }
    throw error;
  }
}
