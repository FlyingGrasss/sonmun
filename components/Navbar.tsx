// components/Navbar.tsx

"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ASSETS, COPY, CONFERENCE } from "@/lib/conference";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  const handleResize = () => {
    setIsMobile(window.innerWidth < 768);
  };

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    handleResize();
  }, []);

  const isActive = (path: string) => pathname === path;

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <div className="flex px-8 max-sm:px-0 max-sm:w-full bg-transparent py-4 max-sm:py-2 justify-between items-center border-b border-gray-300">
      <div className="flex items-center gap-4 max-sm:ml-4 max-sm:w-full max-sm:justify-between max-sm:pr-4">
        <Link href="/" className="flex items-center gap-4">
          <Image
            src={ASSETS.logoNoBackground}
            width={75}
            height={75}
            priority
            loading="eager"
            alt={`${CONFERENCE.brandName} Logo`}
            className="max-sm:w-[50px] max-sm:h-[50px]"
          />
          {/* Desktop title - visible only on desktop */}
          <h1 className="conference-brand text-3xl font-bold max-sm:hidden">
            {CONFERENCE.brandName}
          </h1>
        </Link>
        {/* Mobile title - centered only on mobile */}
        <Link
          href="/"
          className="max-sm:absolute max-sm:left-1/2 max-sm:transform max-sm:-translate-x-1/2 sm:hidden"
        >
          <h1 className="conference-brand max-sm:text-2xl font-bold">
            {CONFERENCE.brandName}
          </h1>
        </Link>
      </div>

      {!isMobile && (
        <div className="ml-12 flex w-full items-center justify-end gap-8 max-lg:ml-8 max-lg:gap-5">
          <Link
            href={"/"}
            className="group w-fit text-xl flex items-center gap-1.5 transition-all duration-300 hover:text-gray-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="transition-all duration-300 stroke-white group-hover:stroke-gray-400"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
              <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
            {COPY.navigation.home}
          </Link>
          <Link
            href={"/letters"}
            className="group w-fit text-xl flex items-center gap-1.5 transition-all duration-300 hover:text-gray-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="transition-all duration-300 stroke-white group-hover:stroke-gray-400"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
              <rect x="2" y="4" width="20" height="16" rx="2" />
            </svg>
            {COPY.navigation.letters}
          </Link>
          <Link
            href={"/secretariat"}
            className="group w-fit text-xl flex items-center gap-1.5 transition-all duration-300 hover:text-gray-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="transition-all duration-300 stroke-white group-hover:stroke-gray-400"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 21a8 8 0 0 0-16 0" />
              <circle cx="10" cy="8" r="5" />
              <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />
            </svg>
            {COPY.navigation.secretariat}
          </Link>
          <Link
            href={"/committees"}
            className="group w-fit text-xl flex items-center gap-1.5 transition-all duration-300 hover:text-gray-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="transition-all duration-300 stroke-white group-hover:stroke-gray-400"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.1 2.182a10 10 0 0 1 3.8 0" />
              <path d="M13.9 21.818a10 10 0 0 1-3.8 0" />
              <path d="M17.609 3.72a10 10 0 0 1 2.69 2.7" />
              <path d="M2.182 13.9a10 10 0 0 1 0-3.8" />
              <path d="M20.28 17.61a10 10 0 0 1-2.7 2.69" />
              <path d="M21.818 10.1a10 10 0 0 1 0 3.8" />
              <path d="M3.721 6.391a10 10 0 0 1 2.7-2.69" />
              <path d="m6.163 21.117-2.906.85a1 1 0 0 1-1.236-1.169l.965-2.98" />
            </svg>
            {COPY.navigation.committees}
          </Link>
          {/* Desktop Apply - button with glass effect */}
          <Link
            href={"/apply"}
            className="group w-fit glassmorphism text-xl max-sm:text-base cursor-pointer items-center transition-all duration-300 justify-center gap-1.5 inline-flex backdrop-blur-md rounded-full px-5 py-3  shadow-lg"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="transition-all duration-300 stroke-white group-hover:stroke-[var(--color-accent)]"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {COPY.navigation.apply}
          </Link>
        </div>
      )}

      {isMobile && (
        <>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="z-50 cursor-pointer focus:outline-none mr-4"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4.5 18H31.5"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4.5 27H31.5"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4.5 9H31.5"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {isOpen && (
            <div
              className="fixed inset-0 bg-black opacity-40 z-40"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
          )}

          <div
            className={`fixed top-0 right-0 h-full w-64 bg-[var(--background)] z-50 transform transition-transform duration-300 ease-in-out ${
              isOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex flex-col h-full pt-20 px-6 gap-2">
              <Link
                href="/"
                className={`text-2xl py-4 flex gap-1.5 items-center border-b border-gray-600 ${
                  isActive("/") ? "text-[var(--color-accent)]" : "text-white"
                }`}
                onClick={() => setIsOpen(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className={
                    isActive("/")
                      ? "stroke-[var(--color-accent)]"
                      : "stroke-white"
                  }
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
                  <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </svg>
                {COPY.navigation.home}
              </Link>
              <Link
                href="/letters"
                className={`text-2xl flex gap-1.5 items-center py-4 border-b border-gray-600 ${
                  isActive("/letters")
                    ? "text-[var(--color-accent)]"
                    : "text-white"
                }`}
                onClick={() => setIsOpen(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className={
                    isActive("/letters")
                      ? "stroke-[var(--color-accent)]"
                      : "stroke-white"
                  }
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                </svg>
                {COPY.navigation.letters}
              </Link>
              <Link
                href="/secretariat"
                className={`text-2xl flex gap-1.5 items-center py-4 border-b border-gray-600 ${
                  isActive("/secretariat")
                    ? "text-[var(--color-accent)]"
                    : "text-white"
                }`}
                onClick={() => setIsOpen(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className={
                    isActive("/secretariat")
                      ? "stroke-[var(--color-accent)]"
                      : "stroke-white"
                  }
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 21a8 8 0 0 0-16 0" />
                  <circle cx="10" cy="8" r="5" />
                  <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />
                </svg>
                {COPY.navigation.secretariat}
              </Link>
              <Link
                href="/committees"
                className={`text-2xl flex gap-1.5 items-center py-4 border-b border-gray-600 ${
                  isActive("/committees")
                    ? "text-[var(--color-accent)]"
                    : "text-white"
                }`}
                onClick={() => setIsOpen(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className={
                    isActive("/committees")
                      ? "stroke-[var(--color-accent)]"
                      : "stroke-white"
                  }
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.1 2.182a10 10 0 0 1 3.8 0" />
                  <path d="M13.9 21.818a10 10 0 0 1-3.8 0" />
                  <path d="M17.609 3.72a10 10 0 0 1 2.69 2.7" />
                  <path d="M2.182 13.9a10 10 0 0 1 0-3.8" />
                  <path d="M20.28 17.61a10 10 0 0 1-2.7 2.69" />
                  <path d="M21.818 10.1a10 10 0 0 1 0 3.8" />
                  <path d="M3.721 6.391a10 10 0 0 1 2.7-2.69" />
                  <path d="m6.163 21.117-2.906.85a1 1 0 0 1-1.236-1.169l.965-2.98" />
                </svg>
                {COPY.navigation.committees}
              </Link>
              {/* Mobile Apply - normal text with glow effect */}
              <Link
                href="/apply"
                className="text-2xl flex gap-1.5 items-center py-4 text-[var(--color-accent)] border-b border-gray-600 hover:text-white transition-colors duration-300 hover:drop-shadow-[0_0_8px_rgba(255,207,64,0.5)]"
                onClick={() => setIsOpen(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className={"stroke-[var(--color-accent)]"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {COPY.navigation.apply}
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Navbar;
