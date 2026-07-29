// app/secretariat/page.tsx

export const revalidate = 60;

import SecretariatCard from "@/components/SecretariatCard";
import { COPY, formatConferenceText } from "@/lib/conference";
import { getPublishedSecretariat } from "@/lib/content";
import { getSiteSettings, normalizeSiteUrl } from "@/lib/siteSettings";
import { notFound } from "next/navigation";
import type { Metadata } from 'next';

export const generateMetadata = async (): Promise<Metadata> => {
  const allSecretariat = await getPublishedSecretariat();
  const { conference } = await getSiteSettings();
  const names = allSecretariat.map(member => member.name).join(', ');
  const description = formatConferenceText(COPY.metadata.secretariatDescription, {
    shortName: conference.shortName,
  });

  return {
    title: `Secretariat`,
    description: description,
    alternates: { canonical: "/secretariat" },
    keywords: [conference.shortName, "Secretariat", names],
    openGraph: {
      title: `Secretariat`,
      description: description,
      url: `${normalizeSiteUrl(conference.siteUrl)}/secretariat`,
    },
  };
};

const Secretariat = async () => {
  const settings = await getSiteSettings();
  if (!settings.pages.secretariatEnabled) notFound();
  const allSecretariat = await getPublishedSecretariat();

  return (
    <div className="min-h-screen pb-20 overflow-hidden">
      <div className="mx-auto container px-4">
        <h1 className="text-6xl max-sm:text-4xl mt-20 mb-20 text-center text-white font-bold tracking-tight">
          {COPY.pages.secretariatTitle}
        </h1>

        <div className="flex flex-col items-center gap-24 md:gap-32">
          {allSecretariat.map((secretariat, index) => (
              <SecretariatCard
                key={index}
                imageUrl={secretariat.imageUrl}
                secretariatName={secretariat.name}
                role={secretariat.role}
                slug={secretariat.slug}
                align={index % 2 !== 0 ? 'right' : 'left'}
              />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Secretariat;
