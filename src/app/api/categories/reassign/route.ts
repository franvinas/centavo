import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  getAuthUser,
  notFound,
  unauthorized,
} from "@/lib/api-utils";
import { reassignCategorySchema } from "@/lib/validations/category-reassign";
import { reassignCategoryForUser } from "@/lib/services/categories";

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const parsed = reassignCategorySchema.safeParse(body);

  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  try {
    const result = await reassignCategoryForUser(user.id, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to reassign category";

    if (message === "Category not found") {
      return notFound(message);
    }

    return badRequest(message);
  }
}
