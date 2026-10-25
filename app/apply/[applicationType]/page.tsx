// app/apply/[applicationType]/page.tsx

import { notFound } from 'next/navigation';
import ApplicationForm from '@/components/ApplicationForm';
import ApplicationsClosedMessage from '@/components/ApplicationsClosedMessage';
import { APPLICATIONS } from '@/lib/conference';
import { canAccessDelegationApplication } from '@/lib/delegationAccess';
import { getSiteSettings, isApplicationsClosed } from '@/lib/siteSettings';
import { getPublishedCommittees } from '@/lib/content';

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
  searchParams: Promise<{
    access?: string | string[];
  }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  // Await the params before accessing properties
  const { applicationType } = await params;
  const { access } = await searchParams;
  const accessToken = typeof access === 'string' ? access : undefined;
  const settings = await getSiteSettings();
  const applicationsClosed = isApplicationsClosed(settings);
  const hasDelegationAccess = canAccessDelegationApplication(applicationType, accessToken);

  if (applicationsClosed && !hasDelegationAccess) {
    return <ApplicationsClosedMessage />;
  }

  const publishedCommittees = await getPublishedCommittees();

  // Double check valid types
  const validTypes = settings.applications.filter((application) => application.enabled).map(
    (application) => application.id
  );
  if (!validTypes.includes(applicationType)) {
    notFound();
  }

  // Render the Client Component
  return (
    <ApplicationForm
      applicationType={applicationType}
      settings={settings}
      publishedCommitteeNames={publishedCommittees.map((committee) => committee.name)}
      accessToken={applicationsClosed && hasDelegationAccess ? accessToken : undefined}
    />
  );
}
