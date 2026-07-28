// app/apply/page.tsx

import type { Metadata } from 'next';
import Link from 'next/link';
import { APPLICATIONS, CONFERENCE, COPY, formatConferenceText } from '@/lib/conference';

export const metadata: Metadata = {
  title: 'Apply',
  description: formatConferenceText(COPY.metadata.applyDescription, {
    shortName: CONFERENCE.shortName,
  }),
};

const APPLICATION_ORDER = ['delegation', 'delegate', 'admin', 'chair', 'press'];

const CARD_TONES: Record<string, 'warm' | 'green'> = {
  delegation: 'warm',
  delegate: 'warm',
  admin: 'green',
  chair: 'warm',
  press: 'green',
};

function ApplicationIcon({ type }: { type: string }) {
  const commonProps = {
    fill: 'none',
    viewBox: '0 0 24 24',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    'aria-hidden': true,
  } as const;

  if (type === 'delegation') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10h1v11H4zm15 0h1v11h-1zM9 10h1v11H9zm5 0h1v11h-1z" />
      </svg>
    );
  }

  if (type === 'delegate') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
  }

  if (type === 'admin') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }

  if (type === 'chair') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  );
}

const Apply = () => {
  const applications = APPLICATION_ORDER
    .map((id) => APPLICATIONS.find((application) => application.id === id))
    .filter((application) => application?.enabled);

  return (
    <div className="min-h-screen px-4 py-20 max-sm:py-12">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-14 text-center text-6xl font-bold text-[var(--color-accent)] max-sm:mb-10 max-sm:text-4xl">
          {COPY.pages.applyTitle}
        </h1>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {applications.map((app) => app && (
            <Link
              key={app.id}
              href={`/apply/${app.id}`}
              className={`sonmun-apply-card sonmun-apply-card--${CARD_TONES[app.id] ?? 'warm'} group`}
            >
              <div className="sonmun-apply-card__icon">
                <ApplicationIcon type={app.id} />
              </div>
              <h2 className="sonmun-apply-card__title">{app.title}</h2>
              <p className="sonmun-apply-card__description">{app.description}</p>
              <span className="sonmun-apply-card__cta">
                {COPY.home.applyButton}
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Apply;
