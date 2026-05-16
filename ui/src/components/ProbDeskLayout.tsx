"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { LayoutDashboard, Settings } from "lucide-react";
import type { ProbDeskViewId } from "@/lib/prob-desk-nav";

const NAV: {
  id: ProbDeskViewId;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { id: "desk", label: "Desk", icon: LayoutDashboard },
  { id: "settings", label: "Settings", icon: Settings },
];

type Props = {
  children: ReactNode;
  active?: ProbDeskViewId;
  onNavSelect?: (id: ProbDeskViewId) => void;
};

export function ProbDeskLayout({
  children,
  active = "desk",
  onNavSelect,
}: Props) {
  return (
    <div className="flex min-h-dvh">
      <aside className="pd-sidebar-bg relative hidden w-[72px] shrink-0 flex-col border-r border-pd-accent/20 text-pd-white shadow-lg md:flex lg:w-[280px]">
        <div
          className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--pd-accent),transparent)] opacity-50"
          aria-hidden
        />
        <div className="flex items-center gap-3 border-b border-pd-accent/30 px-4 py-5 lg:px-5">
          <Image
            src="/brand/logo.png"
            alt=""
            width={88}
            height={127}
            className="h-9 w-auto shrink-0"
            priority
          />
          <div className="hidden min-w-0 lg:block">
            <p className="truncate text-sm font-semibold">Prob Desk</p>
            <p className="truncate text-xs text-pd-border/80">Kalshi agents</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-2 lg:p-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                type="button"
                title={item.label}
                aria-current={isActive ? "page" : undefined}
                onClick={() => onNavSelect?.(item.id)}
                className={`flex w-full items-center justify-center gap-3 rounded-lg px-2 py-2.5 transition-colors lg:justify-start lg:px-3 ${
                  isActive
                    ? "bg-[linear-gradient(135deg,var(--pd-accent)_0%,#5dd4ef_100%)] text-pd-ink shadow-sm"
                    : "text-pd-border hover:bg-white/10"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                <span className="hidden text-sm font-medium lg:inline">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
