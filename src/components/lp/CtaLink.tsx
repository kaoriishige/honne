"use client";

import React from "react";
import Link from "next/link";
import { trackCtaClick, type CtaLocation } from "@/lib/analytics";

interface CtaLinkProps {
  href: string;
  location: CtaLocation;
  className?: string;
  children: React.ReactNode;
}

export function CtaLink({
  href,
  location,
  className,
  children,
}: CtaLinkProps) {
  return (
    <Link
      href={href}
      onClick={() => trackCtaClick(location, href)}
      className={className}
    >
      {children}
    </Link>
  );
}
