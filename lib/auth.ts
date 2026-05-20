import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    return { userId: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { userId, response: null };
}

export async function getCurrentUser() {
  const user = await currentUser();
  return user;
}
