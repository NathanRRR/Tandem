"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { clearLoginAttempts, isLoginLocked, recordFailedLogin } from "@/lib/auth/login-throttle";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

// nginx écrase toujours X-Real-IP avec $remote_addr (proxy_set_header, pas $proxy_add_x_forwarded_for
// qui s'additionne) — non falsifiable par le client tant que le conteneur app n'est joignable
// qu'en 127.0.0.1 derrière nginx. "unknown" en dev (pas de proxy devant `next dev`).
async function clientKey(): Promise<string> {
  const hdrs = await headers();
  return hdrs.get("x-real-ip") ?? "unknown";
}

export async function login(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const key = await clientKey();

  if (isLoginLocked(key)) {
    redirect("/login?error=1");
  }

  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    recordFailedLogin(key);
    redirect("/login?error=1");
  }

  clearLoginAttempts(key);

  const session = await getSession();
  session.userId = user.id;
  await session.save();

  redirect("/");
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}
