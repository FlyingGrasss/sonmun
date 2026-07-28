import Image from 'next/image';
import type { Metadata } from 'next';
import { ASSETS, CONFERENCE, COPY, formatConferenceText } from '@/lib/conference';

export const metadata: Metadata = {
  title: "Letters",
  description: formatConferenceText(COPY.metadata.lettersDescription, {
    shortName: CONFERENCE.shortName,
  }),
  keywords: [
    CONFERENCE.shortName,
    "Letters",
    "Secretary General",
    "MUN conference",
    "Model United Nations",
    ...CONFERENCE.keywords,
  ],
  openGraph: {
    title: "Letters",
    description: formatConferenceText(COPY.metadata.lettersDescription, {
      shortName: CONFERENCE.shortName,
    }),
    url: `${CONFERENCE.siteUrl}/letters`,
  },
  twitter: {
    title: "Letters",
    description: formatConferenceText(COPY.metadata.lettersDescription, {
      shortName: CONFERENCE.shortName,
    }),
    card: "summary_large_image",
  },
};

const Letters = () => {
  return (
    <div>
      <h1 className="text-white text-center text-5xl max-sm:text-3xl max-sm:pt-6 pt-12">
        {COPY.letters.titlePrefix} <br className="sm:hidden" />{" "}
        <span className="text-[var(--color-accent)] font-black">
          {COPY.letters.titleHighlight}
        </span>
      </h1>

      <p className="text-white mx-auto w-[1000px] max-sm:w-[350px] max-sm:text-sm text-2xl bg-black/60 relative rounded-4xl max-sm:rounded-2xl max-sm:px-8 max-sm:py-4 max-sm:my-6 px-16 py-8 my-12">
        {COPY.letters.opening}
        <br />
        <br />
        {COPY.letters.paragraphs.map((paragraph, index) => (
          <span key={paragraph}>
            {formatConferenceText(paragraph, {
              sessionName: CONFERENCE.sessionName,
              dates: CONFERENCE.dates,
              shortName: CONFERENCE.shortName,
            })}
            {index < COPY.letters.paragraphs.length - 1 && <><br /><br /></>}
          </span>
        ))}
        <br />
        <br />
        <span className="text-[var(--color-accent)] font-black">
          {CONFERENCE.organizer.name}
        </span>
        <br />
        {CONFERENCE.hashtag}

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
