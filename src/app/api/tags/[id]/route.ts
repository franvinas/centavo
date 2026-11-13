import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  getAuthUser,
  notFound,
  unauthorized,
} from "@/lib/api-utils";
import { renameTagSchema } from "@/lib/validations/tag";
import { deleteTagForUser, renameTagForUser } from "@/lib/services/tags";

type RouteParams = { params: Promise<{ id: string }> };

function errorResponse(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  return message === "Tag not found" ? notFound(message) : badRequest(message);
}

/** Rename a tag; renaming onto an existing tag merges the two. */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = renameTagSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  try {
    const result = await renameTagForUser(user.id, id, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error, "Unable to rename tag");
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { id } = await params;
  try {
    return NextResponse.json(await deleteTagForUser(user.id, id));
  } catch (error) {
    return errorResponse(error, "Unable to delete tag");
  }
}
