// app/apply/page.tsx

import type { Metadata } from 'next';
import Link from 'next/link';
import { Camera, ClipboardCheck, Globe2, Landmark, Star, type LucideIcon } from 'lucide-react';
import { COPY, formatConferenceText } from '@/lib/conference';
import { getSiteSettings, normalizeSiteUrl } from '@/lib/siteSettings';

export async function generateMetadata(): Promise<Metadata> {
  const { conference } = await getSiteSettings();
  return {
    title: 'Apply',
    description: formatConferenceText(COPY.metadata.applyDescription, { shortName: conference.shortName }),
    alternates: { canonical: '/apply' },
    openGraph: { url: `${normalizeSiteUrl(conference.siteUrl)}/apply` },
  };
}

const APPLICATION_ORDER = ['delegation', 'delegate', 'admin', 'chair', 'press'];

const CARD_TONES: Record<string, 'gold' | 'copper' | 'cream' | 'rose'> = {
  delegation: 'gold',
  delegate: 'copper',
  admin: 'cream',
  chair: 'rose',
  press: 'gold',
};

const MOBILE_CARD_ORDER: Record<string, string> = {
  delegate: 'order-1 md:order-none',
  delegation: 'order-2 md:order-none',
  admin: 'order-3 md:order-none',
  chair: 'order-4 md:order-none',
  press: 'order-5 md:order-none',
};

const APPLICATION_ICONS: Record<string, LucideIcon> = {
  delegation: Landmark,
  delegate: Globe2,
  admin: ClipboardCheck,
  chair: Star,
  press: Camera,
};

function ApplicationIcon({ type }: { type: string }) {
  const Icon = APPLICATION_ICONS[type] ?? Camera;
  return <Icon size={28} strokeWidth={1.8} aria-hidden="true" />;
}

const Apply = async () => {
  const settings = await getSiteSettings();
  const applications = APPLICATION_ORDER
    .map((id) => settings.applications.find((application) => application.id === id))
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
              className={`sonmun-apply-card sonmun-apply-card--${CARD_TONES[app.id] ?? 'gold'} group ${MOBILE_CARD_ORDER[app.id] ?? 'order-10 md:order-none'}`}
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
