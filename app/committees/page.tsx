// app/committees/page.tsx

export const revalidate = 12000;

import CommitteeCard from "@/components/CommitteeCard";
import { getPublishedCommittees } from "@/lib/content";
import { COPY, formatConferenceText } from "@/lib/conference";
import { getSiteSettings, normalizeSiteUrl } from "@/lib/siteSettings";
import { notFound } from "next/navigation";
import type { Metadata } from 'next';

export const generateMetadata = async (): Promise<Metadata> => {
  const allCommittees = await getPublishedCommittees();
  const { conference } = await getSiteSettings();
  const committeeNames = allCommittees.map(committee => committee.name).join(', ');
  const description = formatConferenceText(COPY.metadata.committeesDescription, {
    shortName: conference.shortName,
    committeeNames,
  });

  return {
    title: `Committees`,
    description: description,
    alternates: { canonical: "/committees" },
    keywords: [conference.shortName, "Committees", committeeNames, "MUN"],
    openGraph: {
      title: `Committees`,
      description: description,
      url: `${normalizeSiteUrl(conference.siteUrl)}/committees`,
    },
    twitter: {
      title: `Committees`,
      description: description,
      card: "summary_large_image",
    },
  };
};

const Committees = async () => {
  const settings = await getSiteSettings();
  if (!settings.pages.committeesEnabled) notFound();
  const allCommittees = await getPublishedCommittees();

  return (
    <div className="min-h-screen pb-20 overflow-hidden">
      <div className="mx-auto container px-4">
        <h1 className="text-6xl max-sm:text-4xl mt-20 mb-20 text-center text-white font-bold tracking-tight">
          {COPY.pages.committeesTitle}
        </h1>

        <div className="flex flex-col items-center gap-24 md:gap-32">
          {allCommittees.map((committee, index) => (
             <CommitteeCard
                key={index}
                imageUrl={committee.imageUrl}
                committeeName={committee.name}
                slug={committee.slug}
                align={index % 2 !== 0 ? 'right' : 'left'}
              />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Committees;
