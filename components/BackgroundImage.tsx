// components/BackgroundImage.tsx

"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { ASSETS, THEME } from "@/lib/conference";

export default function BackgroundImage() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 w-full z-[-1] overflow-hidden"
      style={{ height: "900px" }}
    >
      <Image
        src={ASSETS.background}
        alt={ASSETS.backgroundAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-90"
        quality={90}
      />

      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${THEME.background}F2 0%, ${THEME.middle}EB 52%, ${THEME.warm}CC 100%)`,
        }}
      />
    </div>
  );
}
