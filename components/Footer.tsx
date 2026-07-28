"use client"

import { usePathname } from "next/navigation"
import { CONFERENCE, COPY } from "@/lib/conference"

const Footer = () => {
  const pathname = usePathname()

  if (pathname?.startsWith("/admin")) {
    return null
  }

  return (
    <p className="text-white text-center min-[1800px]:text-xl">
      &copy; {CONFERENCE.year} {CONFERENCE.brandName}, {COPY.footer.rights}{" "}
      <br className="sm:hidden" />{" "}
      <a
        href={CONFERENCE.organizer.creditUrl}
        target="_blank"
        className="underline cursor-pointer"
      >
        {CONFERENCE.organizer.creditName}
      </a>
    </p>
  )
}

export default Footer
