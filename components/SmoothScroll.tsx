"use client";

import { ReactLenis } from "lenis/react";

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis root options={{ autoRaf: true, anchors: true, stopInertiaOnNavigate: true }}>
      {children}
    </ReactLenis>
  );
}
