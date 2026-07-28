// app/apply/[applicationType]/page.tsx

import { notFound } from 'next/navigation';
import ApplicationForm from '@/components/ApplicationForm';
import { APPLICATIONS } from '@/lib/conference';

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

  // Double check valid types
  const validTypes = APPLICATIONS.filter((application) => application.enabled).map(
    (application) => application.id
  );
  if (!validTypes.includes(applicationType)) {
    notFound();
  }

  // Render the Client Component
  return <ApplicationForm applicationType={applicationType} />;
}
