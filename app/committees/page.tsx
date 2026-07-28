// app/committees/page.tsx

export const revalidate = 12000;

import CommitteeCard from "@/components/CommitteeCard";
import { getPublishedCommittees } from "@/lib/content";
import { CONFERENCE, COPY, formatConferenceText } from "@/lib/conference";
import type { Metadata } from 'next';

export const generateMetadata = async (): Promise<Metadata> => {
  const allCommittees = await getPublishedCommittees();
  const committeeNames = allCommittees.map(committee => committee.name).join(', ');
  const description = formatConferenceText(COPY.metadata.committeesDescription, {
    shortName: CONFERENCE.shortName,
    committeeNames,
  });

  return {
    title: `Committees`,
    description: description,
    keywords: [CONFERENCE.shortName, "Committees", committeeNames, "MUN"],
    openGraph: {
      title: `Committees`,
      description: description,
      url: `${CONFERENCE.siteUrl}/committees`,
    },
    twitter: {
      title: `Committees`,
      description: description,
      card: "summary_large_image",
    },
  };
};

const Committees = async () => {
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
                description={committee.description}
                align={index % 2 !== 0 ? 'right' : 'left'}
              />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Committees;
