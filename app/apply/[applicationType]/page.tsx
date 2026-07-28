// app/apply/[applicationType]/page.tsx

import { notFound } from 'next/navigation';
import ApplicationForm from '@/components/ApplicationForm';
import { APPLICATIONS } from '@/lib/conference';
import { getSiteSettings } from '@/lib/siteSettings';

// Static generation definition (Server-side)
export async function generateStaticParams() {
  return [
    ...APPLICATIONS.filter((application) => application.enabled).map((application) => ({
      applicationType: application.id,
    })),
  ];
}

interface PageProps {
  params: Promise<{
    applicationType: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  // Await the params before accessing properties
  const { applicationType } = await params;
  const settings = await getSiteSettings();

  // Double check valid types
  const validTypes = settings.applications.filter((application) => application.enabled).map(
    (application) => application.id
  );
  if (!validTypes.includes(applicationType)) {
    notFound();
  }

  // Render the Client Component
  return <ApplicationForm applicationType={applicationType} settings={settings} />;
}
