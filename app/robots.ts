import { CONFERENCE } from "@/lib/conference";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin",
    },
    sitemap: `${CONFERENCE.siteUrl}/sitemap.xml`,
  };
}
