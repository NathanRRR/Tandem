import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { getSession } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-bg">
      {children}
      <BottomNav />
    </div>
  );
}
