"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import NavigationIcon, { type NavigationIconName } from "@/components/NavigationIcon";
import { COPY } from "@/lib/conference";

const links: { href: string; label: string; icon: NavigationIconName }[] = [
  { href: "/", label: COPY.navigation.home, icon: "home" },
  { href: "/letters", label: COPY.navigation.letters, icon: "letters" },
  { href: "/exec", label: COPY.navigation.exec, icon: "secretariat" },
  { href: "/committees", label: COPY.navigation.committees, icon: "committees" },
];

export default function MobileMenu({ showCommittees, showSecretariat }: { showCommittees: boolean; showSecretariat: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const visibleLinks = links.filter((link) =>
    (link.href !== "/committees" || showCommittees) &&
    (link.href !== "/exec" || showSecretariat)
  );
  const isActive = (path: string) => pathname === path;

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen((open) => !open)}
        className="z-50 cursor-pointer focus:outline-none mr-4"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M4.5 18H31.5M4.5 27H31.5M4.5 9H31.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && <div className="fixed inset-0 bg-black opacity-40 z-40" onClick={() => setIsOpen(false)} aria-hidden="true" />}

      <div className={`fixed top-0 right-0 h-full w-64 bg-[var(--background)] z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex flex-col h-full pt-20 px-6 gap-2">
          {visibleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-2xl py-4 flex gap-1.5 items-center border-b border-[var(--foreground)] ${isActive(link.href) ? "text-[var(--color-accent)]" : "text-white"}`}
              onClick={() => setIsOpen(false)}
            >
              <NavigationIcon name={link.icon} className={isActive(link.href) ? "stroke-[var(--color-accent)]" : "stroke-white"} />
              {link.label}
            </Link>
          ))}
          <Link
            href="/apply"
            className="text-2xl flex gap-1.5 items-center py-4 text-[var(--color-accent)] border-b border-[var(--foreground)] hover:text-white transition-colors duration-300"
            onClick={() => setIsOpen(false)}
          >
            <NavigationIcon name="apply" className="stroke-[var(--color-accent)]" />
            {COPY.navigation.apply}
          </Link>
        </div>
      </div>
    </div>
  );
}
