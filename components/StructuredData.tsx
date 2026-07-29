import { ASSETS } from "@/lib/conference";
import { normalizeSiteUrl, type EditableSettings } from "@/lib/siteSettings";

function getEndDateIso(startDateIso: string, dates: string) {
  const dateCount = dates.match(/\d+/g)?.length ?? 1;
  const endDate = new Date(startDateIso);

  if (Number.isNaN(endDate.getTime())) return undefined;

  endDate.setUTCDate(endDate.getUTCDate() + Math.max(0, dateCount - 1));
  return endDate.toISOString();
}

export default function StructuredData({
  conference,
}: {
  conference: EditableSettings["conference"];
}) {
  const siteUrl = normalizeSiteUrl(conference.siteUrl);
  const endDate = getEndDateIso(conference.startDateIso, conference.dates);
  const organizationName = conference.organizer.name || conference.brandName;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Event",
        "@id": `${siteUrl}/#event`,
        name: `${conference.displayName} | ${conference.fullName}`,
        description: `${conference.sessionName}. ${conference.dates}.`,
        url: siteUrl,
        startDate: conference.startDateIso,
        ...(endDate ? { endDate } : {}),
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        image: [`${siteUrl}${ASSETS.logo}`],
        location: {
          "@type": "Place",
          name: `${conference.location.city}, ${conference.location.country}`,
          address: {
            "@type": "PostalAddress",
            addressLocality: conference.location.city,
            addressCountry: conference.location.country,
          },
        },
        organizer: {
          "@type": "Organization",
          name: organizationName,
          url: siteUrl,
        },
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: conference.displayName,
        description: `${conference.sessionName}. Join us on ${conference.dates}.`,
        inLanguage: conference.locale.replace("_", "-"),
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: organizationName,
        url: siteUrl,
        logo: `${siteUrl}${ASSETS.logo}`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
      }}
    />
  );
}
