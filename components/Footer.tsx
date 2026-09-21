"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
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
    <div className="space-y-2 pb-4 text-center text-white min-[1800px]:text-xl">
      <nav aria-label="Privacy and data protection" className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm min-[1800px]:text-base">
        <Link href="/acik-riza-onay-metni" className="underline underline-offset-2 hover:text-[var(--color-accent)]">Açık Rıza Onay Metni</Link>
        <Link href="/kvkk-aydinlatma-metni" className="underline underline-offset-2 hover:text-[var(--color-accent)]">KVKK Aydınlatma Metni</Link>
        <Link href="/kvkk" className="underline underline-offset-2 hover:text-[var(--color-accent)]">KVKK Başvuru Formu</Link>
      </nav>
      <p>
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
    </div>
  )
}

export default Footer
