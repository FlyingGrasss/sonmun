// app/apply/[applicationType]/layout.tsx

import type { Metadata } from 'next';
import { APPLICATIONS, CONFERENCE, COPY, formatConferenceText } from '@/lib/conference';

type Props = {
  params: Promise<{ applicationType: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { applicationType } = await params;
  const application = APPLICATIONS.find((item) => item.id === applicationType);
  const type = application?.title ?? applicationType;
  
  return {
    title: `Apply - ${type}`,
    description: formatConferenceText(COPY.metadata.applicationDescription, {
      type,
      shortName: CONFERENCE.shortName,
    }),
    openGraph: {
      title: `Apply ${type}`,
      url: `${CONFERENCE.siteUrl}/apply/${applicationType}`,
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
