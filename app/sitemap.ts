import type { MetadataRoute } from "next";
import { getPublishedCommittees, getPublishedSecretariat } from "@/lib/content";
import { getSiteSettings, normalizeSiteUrl } from "@/lib/siteSettings";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, committees, secretariat] = await Promise.all([
    getSiteSettings(),
    getPublishedCommittees(),
    getPublishedSecretariat(),
  ]);
  const siteUrl = normalizeSiteUrl(settings.conference.siteUrl);
  const currentDate = new Date();

  return [
    {
      url: siteUrl,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 1,
    },
    ...(settings.pages.secretariatEnabled
      ? [
          {
            url: `${siteUrl}/secretariat`,
            lastModified: currentDate,
            changeFrequency: "weekly" as const,
            priority: 0.8,
          },
          ...secretariat.map((member) => ({
            url: `${siteUrl}/secretariat/${member.slug}`,
            lastModified: member.updatedAt,
            changeFrequency: "monthly" as const,
            priority: 0.7,
          })),
        ]
      : []),
    {
      url: `${siteUrl}/letters`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...(settings.pages.committeesEnabled
      ? [
          {
            url: `${siteUrl}/committees`,
            lastModified: currentDate,
            changeFrequency: "monthly" as const,
            priority: 0.6,
          },
          ...committees.map((committee) => ({
            url: `${siteUrl}/committees/${committee.slug}`,
            lastModified: committee.updatedAt,
            changeFrequency: "monthly" as const,
            priority: 0.7,
          })),
        ]
      : []),
    {
      url: `${siteUrl}/apply`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...settings.applications
      .filter((application) => application.enabled)
      .map((application) => ({
        url: `${siteUrl}/apply/${application.id}`,
        lastModified: currentDate,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
  ];
}
