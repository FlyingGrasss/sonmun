import { APPLICATIONS, CONFERENCE } from '@/lib/conference';
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date();
  const routes = [
    ["", "yearly", 1],
    ["/secretariat", "weekly", 0.8],
    ["/letters", "weekly", 0.7],
    ["/committees", "monthly", 0.6],
    ["/apply", "monthly", 0.5],
    ...APPLICATIONS.filter((application) => application.enabled).map((application) => [
      `/apply/${application.id}`,
      "weekly",
      0.8,
    ] as const),
  ] as const;

  return routes.map(([path, changeFrequency, priority]) => ({
    url: `${CONFERENCE.siteUrl}${path}`,
    lastModified: currentDate,
    changeFrequency,
    priority,
  }));
}
