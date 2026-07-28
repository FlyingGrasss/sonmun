"use client"

import { usePathname } from "next/navigation"
import { COPY } from "@/lib/conference"

const Footer = ({
  year,
  brandName,
  organizer,
}: {
  year: number;
  brandName: string;
  organizer: { creditName: string; creditUrl: string };
}) => {
  const pathname = usePathname()

  if (pathname?.startsWith("/admin")) {
    return null
  }

  return (
    <p className="text-white text-center min-[1800px]:text-xl">
      &copy; {year} {brandName}, {COPY.footer.rights}{" "}
      <br className="sm:hidden" />{" "}
      <a
        href={organizer.creditUrl}
        target="_blank"
        className="underline cursor-pointer"
      >
        {organizer.creditName}
      </a>
    </p>
  )
}

export default Footer
