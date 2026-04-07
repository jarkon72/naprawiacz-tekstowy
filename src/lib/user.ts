import { Redis } from "@upstash/redis";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error("Upstash Redis env variables are not set");
  }
  return Redis.fromEnv();
}

export async function getUserId() {
  const cookieStore = await cookies();
  let userId = cookieStore.get("userId")?.value;

  if (!userId) {
    userId = uuidv4();
    cookieStore.set("userId", userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 365, // 1 rok
    });
  }

  return userId;
}

export async function getUserData(userId: string) {
  const redis = getRedis();
  const data = await redis.get(`user:${userId}`);
  if (!data) return null;
  return typeof data === "string" ? JSON.parse(data) : data;
}

export async function saveUserData(userId: string, data: any) {
  const redis = getRedis();
  await redis.set(
    `user:${userId}`,
    data,
    { ex: 60 * 60 * 24 * 400 } // 400 dni
  );
}
