// app/page.tsx

import Link from "next/link";
import Countdown from "@/components/Countdown";
import { COPY } from "@/lib/conference";
import { getSiteSettings } from "@/lib/siteSettings";

export default async function Home() {
  const settings = await getSiteSettings();
  const conference = settings.conference;

  return (
    <div className="relative min-h-screen">
      <main className="relative z-10 flex min-h-[calc(100vh-108px)] flex-col items-center justify-center gap-10 px-4 py-12 max-sm:gap-8 max-sm:py-8">
        <div className="text-center">
          <h1 className="conference-title sonmun-reveal sonmun-reveal-1 text-7xl max-sm:text-[40px] font-bold mb-4">
            {conference.displayName}
          </h1>
          <p className="sonmun-reveal sonmun-reveal-2 text-white text-2xl max-sm:text-lg mb-2">
            {conference.dates}
          </p>
          <p className="sonmun-reveal sonmun-reveal-3 mx-auto max-w-2xl text-white/85 text-lg max-sm:text-sm">
            {conference.sessionName}
          </p>
          <p className="sonmun-reveal sonmun-reveal-4 mt-3 text-[var(--color-highlight)] text-lg font-semibold">
            {conference.hashtag}
          </p>
        </div>

        <div className="sonmun-reveal sonmun-reveal-5 max-sm:scale-90 max-sm:origin-center">
          <Countdown startDateIso={conference.startDateIso} />
        </div>

        <Link href="/apply" className="sonmun-reveal sonmun-reveal-6 w-fit">
          <button className="group glassmorphism text-xl max-sm:text-base cursor-pointer items-center transition-all duration-300 justify-center gap-4 max-sm:gap-2 inline-flex backdrop-blur-md rounded-full px-8 py-4 max-sm:px-6 max-sm:py-3 shadow-lg">
            {COPY.home.applyButton}
            <svg
              width="24"
              height="19"
              viewBox="0 0 24 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="transition-transform duration-300 group-hover:translate-x-2 max-sm:w-[15px]"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M14.7105 0.439344C14.1953 1.02511 14.1953 1.97487 14.7105 2.56064L19.4951 7.99997H1.56946C0.840735 7.99997 0.25 8.67155 0.25 9.49997C0.25 10.3284 0.840735 11 1.56946 11H19.4951L14.7105 16.4392C14.1953 17.0251 14.1953 17.9749 14.7105 18.5606C15.2258 19.1465 16.0614 19.1465 16.5765 18.5606L23.6136 10.5606C24.1288 9.97473 24.1288 9.02509 23.6136 8.43932L16.5765 0.439344C16.0614 -0.146448 15.2258 -0.146448 14.7105 0.439344Z"
                className="fill-white group-hover:fill-[var(--color-accent)] transition-colors duration-300"
              />
            </svg>
          </button>
        </Link>
      </main>
    </div>
  );
}
