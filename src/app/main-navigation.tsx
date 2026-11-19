"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [["/catalogue", "Catalogue"], ["/studies", "Research brief"], ["/how-it-works", "How it works"]] as const;

export function MainNavigation() {
  const pathname = usePathname();
  return <nav aria-label="Main navigation">{links.map(([href, label]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>)}</nav>;
}
