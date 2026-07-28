// app/success/page.tsx

import type { Metadata } from 'next';
import Link from 'next/link';
import { CONFERENCE, COPY } from '@/lib/conference';

export const metadata: Metadata = {
  title: `Application Successful | ${CONFERENCE.displayName}`,
  description: COPY.metadata.successDescription,
  robots: "noindex", // Don't index success page
};

const Success = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-[var(--background)] border border-[var(--color-accent)] rounded-3xl p-10 max-w-2xl w-full text-center shadow-2xl relative overflow-hidden">
        
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-[var(--color-accent)] opacity-20 blur-[100px]" />

        <div className="mb-8 relative z-10">
            <div className="w-24 h-24 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mx-auto mb-6">
                <svg
                className="h-12 w-12 text-[var(--color-accent)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                ></path>
                </svg>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {COPY.pages.successTitle}
            </h1>
            <p className="text-gray-300 text-xl">
                {COPY.pages.successMessage}
            </p>
        </div>

        <Link href="/" className="inline-block relative z-10">
            <button className="group glassmorphism text-lg cursor-pointer items-center transition-all duration-300 justify-center gap-3 inline-flex backdrop-blur-md rounded-full px-8 py-3 shadow-lg hover:border-[var(--color-accent)]">
                {COPY.pages.homeButton}
                <svg
                    width="24"
                    height="19"
                    viewBox="0 0 24 19"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="transition-transform duration-300 group-hover:translate-x-2"
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
      </div>
    </div>
  );
};

export default Success;
