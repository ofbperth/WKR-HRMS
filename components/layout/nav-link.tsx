"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, className, activeClassName, children }: { href: string; className: string; activeClassName?: string; children: ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  if (isActive) {
    return <span className={`${className} ${activeClassName ?? ""}`} aria-current="page">{children}</span>;
  }
  return <Link href={href} prefetch={false} className={className}>{children}</Link>;
}
