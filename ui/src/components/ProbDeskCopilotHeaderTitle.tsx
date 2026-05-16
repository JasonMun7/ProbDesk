"use client";

import Image from "next/image";
import type { HTMLAttributes, PropsWithChildren } from "react";

/** CopilotSidebar `header.titleContent` — logo + title from labels. */
export function ProbDeskCopilotHeaderTitle({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      data-testid="copilot-header-title"
      className={`cpk:flex cpk:items-center cpk:justify-center cpk:gap-4 ${className ?? ""}`}
      {...props}
    >
      <Image
        src="/brand/logo-sm.png"
        alt=""
        width={27}
        height={40}
        className="h-8 w-auto shrink-0"
        priority
      />
      <span className="cpk:text-base cpk:font-semibold cpk:leading-none cpk:tracking-tight">
        {children}
      </span>
    </div>
  );
}
