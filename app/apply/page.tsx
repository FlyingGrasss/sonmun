// app/apply/page.tsx

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { APPLICATIONS, CONFERENCE, COPY, formatConferenceText } from '@/lib/conference';

export const metadata: Metadata = {
  title: "Apply",
  description: formatConferenceText(COPY.metadata.applyDescription, {
    shortName: CONFERENCE.shortName,
  }),
};

const Apply = () => {
  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-6xl max-sm:text-4xl mb-16 text-center text-[var(--color-accent)] font-bold">
          {COPY.pages.applyTitle}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 place-items-center">
          {APPLICATIONS.filter((app) => app.enabled).map((app) => (
            <Link
              key={app.id}
              href={`/apply/${app.id}`}
              // Added max-w-[300px] for mobile to prevent full screen width images
              className="group relative w-full max-w-[300px] sm:max-w-sm rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_var(--color-accent)]"
            >
              {/* Background Image */}
              <div className="relative h-[400px] w-full">
                <Image
                  src={app.image}
                  alt={`Apply ${app.title}`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[var(--background)] via-[var(--background)]/40 to-transparent opacity-90 transition-opacity duration-300" />

                {/* Border effect */}
                <div className="absolute inset-0 border-4 border-transparent group-hover:border-[var(--color-accent)] transition-colors duration-300 rounded-3xl z-20 pointer-events-none" />
              </div>

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-8 z-10">
                <h2 className="text-3xl font-bold text-white mb-2 group-hover:text-[var(--color-accent)] transition-colors">
                  {app.title}
                </h2>
                <p className="text-gray-300 mb-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  {app.description}
                </p>

                <span className="flex items-center gap-2 text-white font-medium group-hover:gap-4 transition-all duration-300">
                  {COPY.pages.applicationFormLink}
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Apply;
