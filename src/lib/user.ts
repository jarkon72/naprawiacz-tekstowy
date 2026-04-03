import { Redis } from "@upstash/redis";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

const redis = Redis.fromEnv();

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
  const data = await redis.get(`user:${userId}`);
  if (!data) return null;
  // Upstash zwraca już sparsowany obiekt, ale obsługujemy też string na wszelki wypadek
  return typeof data === "string" ? JSON.parse(data) : data;
}

export async function saveUserData(userId: string, data: any) {
  await redis.set(
    `user:${userId}`,
    data, // Upstash serializuje automatycznie
    { ex: 60 * 60 * 24 * 400 } // 400 dni — pokrywa plany roczne + bufor
  );
}
