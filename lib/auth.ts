import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    return { userId: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { userId, response: null };
}

// Phase 8: Org-aware auth helper
export async function requireOrgAuth() {
  const { userId, orgId, orgRole } = await auth();
  if (!userId) {
    return {
      userId: null,
      orgId: null,
      orgRole: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { userId, orgId: orgId ?? "", orgRole: orgRole ?? null, response: null };
}

export async function getCurrentUser() {
  const user = await currentUser();
  return user;
}
