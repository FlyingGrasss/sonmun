// app/apply/[applicationType]/layout.tsx

import type { Metadata } from 'next';
import { COPY, formatConferenceText } from '@/lib/conference';
import { getSiteSettings, normalizeSiteUrl } from '@/lib/siteSettings';

type Props = {
  params: Promise<{ applicationType: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { applicationType } = await params;
  const settings = await getSiteSettings();
  const application = settings.applications.find((item) => item.id === applicationType);
  const type = application?.title ?? applicationType;
  
  return {
    title: `Apply - ${type}`,
    description: formatConferenceText(COPY.metadata.applicationDescription, {
      type,
      shortName: settings.conference.shortName,
    }),
    alternates: { canonical: `/apply/${applicationType}` },
    openGraph: {
      title: `Apply ${type}`,
      url: `${normalizeSiteUrl(settings.conference.siteUrl)}/apply/${applicationType}`,
    },
  };
}

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
