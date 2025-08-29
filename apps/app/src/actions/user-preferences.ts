"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// These are now handled by Convex mutations
// This file is kept for compatibility during migration

export async function updateUserInterests(categories: string[]) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  
  // TODO: Call Convex mutation api.users.updateInterests
  console.log("Update interests:", categories);
  return { success: true };
}

export async function completeOnboarding() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  
  // TODO: Call Convex mutation api.users.completeOnboarding
  console.log("Complete onboarding");
  redirect("/");
}

export async function skipOnboarding() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  
  // TODO: Call Convex mutation
  console.log("Skip onboarding");
  redirect("/");
}

export async function getUserInterests() {
  const { userId } = await auth();
  if (!userId) {
    return { interests: [] };
  }
  
  // TODO: Call Convex query api.users.getInterests
  return { interests: [] };
}