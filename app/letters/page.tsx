import Image from 'next/image';
import type { Metadata } from 'next';
import { ASSETS, COPY, formatConferenceText } from '@/lib/conference';
import { getSiteSettings, normalizeSiteUrl } from '@/lib/siteSettings';

export async function generateMetadata(): Promise<Metadata> {
  const { conference } = await getSiteSettings();
  const description = formatConferenceText(COPY.metadata.lettersDescription, { shortName: conference.shortName });
  return {
    title: "Letters",
    description,
    alternates: { canonical: "/letters" },
    keywords: [conference.shortName, "Letters", "Secretary General", "MUN conference", "Model United Nations", ...conference.keywords],
    openGraph: { title: "Letters", description, url: `${normalizeSiteUrl(conference.siteUrl)}/letters` },
    twitter: { title: "Letters", description, card: "summary_large_image" },
  };
}

const Letters = async () => {
  const settings = await getSiteSettings();
  const { conference, letters } = settings;

  return (
    <div>
      <h1 className="text-6xl max-sm:text-4xl mt-20 mb-20 text-center text-white font-bold tracking-tight">
        {letters.titlePrefix} <br className="sm:hidden" />{" "}
        <span className="text-[var(--color-accent)] font-black">
          {letters.titleHighlight}
        </span>
      </h1>

      <p className="text-white mx-auto w-[1000px] max-sm:w-[350px] max-sm:text-sm text-2xl bg-black/60 relative rounded-4xl max-sm:rounded-2xl max-sm:px-8 max-sm:py-4 max-sm:my-6 px-16 py-8 my-12">
        {letters.opening}
        <br />
        <br />
        {letters.paragraphs.map((paragraph, index) => (
          <span key={paragraph}>
            {formatConferenceText(paragraph, {
              sessionName: conference.sessionName,
              dates: conference.dates,
              shortName: conference.shortName,
            })}
            {index < letters.paragraphs.length - 1 && <><br /><br /></>}
          </span>
        ))}
        <br />
        <br />
        <span className="text-[var(--color-accent)] font-black">
          {conference.organizer.name}
        </span>
        <br />
        {conference.hashtag}

        <Image
          src={ASSETS.mail}
          alt=""
          width={48}
          height={48}
          className="absolute top-8 right-10 max-sm:w-6 max-sm:h-6 max-sm:top-4 max-sm:right-5"
          unoptimized
          draggable={false}
        />
      </p>
    </div>
  );
};

export default Letters;
