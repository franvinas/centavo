import { NextRequest, NextResponse } from "next/server";
import { badRequest, getAuthUser, unauthorized } from "@/lib/api-utils";
import { completeOnboardingSchema } from "@/lib/validations/onboarding";
import { completeSetupForUser } from "@/lib/services/setup";

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const parsed = completeOnboardingSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const updatedUser = await completeSetupForUser(user.id, parsed.data);

  return NextResponse.json({ user: updatedUser }, { status: 201 });
}
