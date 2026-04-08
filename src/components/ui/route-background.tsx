"use client";

import { usePathname } from "next/navigation";
import { getPageBackground } from "@/config/page-backgrounds";
import { PageBackground } from "@/components/ui/page-background";

export function RouteBackground() {
  const pathname = usePathname();
  const background = getPageBackground(pathname);

  if (!background) {
    return null;
  }

  return <PageBackground {...background} />;
}
