"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClockIcon, HomeIcon, UserIcon } from "./icons";

const items = [
  { href: "/", label: "Accueil", Icon: HomeIcon },
  { href: "/history", label: "Historique", Icon: ClockIcon },
  { href: "/profile", label: "Profil", Icon: UserIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky inset-x-0 bottom-0 z-10 flex items-center justify-around border-t border-border bg-surface pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {items.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 px-4 py-1 ${active ? "text-ink" : "text-ink-faint"}`}
          >
            <Icon className="h-5 w-5" />
            <span className={`text-[11px] ${active ? "font-bold" : "font-semibold"}`}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
