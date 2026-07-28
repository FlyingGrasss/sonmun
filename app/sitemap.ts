import type { MetadataRoute } from 'next';
import { getSiteSettings } from '@/lib/siteSettings';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSiteSettings();
  const currentDate = new Date();
  const routes = [
    ["", "yearly", 1],
    ...(settings.pages.secretariatEnabled ? [["/secretariat", "weekly", 0.8] as const] : []),
    ["/letters", "weekly", 0.7],
    ...(settings.pages.committeesEnabled ? [["/committees", "monthly", 0.6] as const] : []),
    ["/apply", "monthly", 0.5],
    ...settings.applications.filter((application) => application.enabled).map((application) => [
      `/apply/${application.id}`,
      "weekly",
      0.8,
    ] as const),
  ] as const;

  return routes.map(([path, changeFrequency, priority]) => ({
    url: `${settings.conference.siteUrl}${path}`,
    lastModified: currentDate,
    changeFrequency,
    priority,
  }));
}
