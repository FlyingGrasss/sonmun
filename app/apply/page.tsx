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

const CARD_TONES: Record<string, 'gold' | 'copper' | 'cream' | 'rose'> = {
  delegation: 'gold',
  delegate: 'copper',
  admin: 'cream',
  chair: 'rose',
  press: 'gold',
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
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M12 3c2.4 2.5 3.6 5.5 3.6 9S14.4 18.5 12 21c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3z" />
      </svg>
    );
  }

  if (type === 'delegate') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m15 9-2.5 5.5L7 17l2.5-5.5L15 9zM12 3a9 9 0 1 0 9 9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 0 1 9 9" />
      </svg>
    );
  }

  if (type === 'admin') {
    return (
      <svg {...commonProps}>
        <rect x="5" y="4" width="14" height="16" rx="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m8 12 2 2 5-5M8 17h8" />
      </svg>
    );
  }

  if (type === 'chair') {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="8.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14v10a2 2 0 01-2 2H7a2 2 0 01-2-2V8zM8 8l1.5-3h5L16 8M9 12h6M9 16h3" />
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
              className={`sonmun-apply-card sonmun-apply-card--${CARD_TONES[app.id] ?? 'gold'} group`}
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
