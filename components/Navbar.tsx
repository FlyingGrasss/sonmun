import Image from "next/image";
import Link from "next/link";
import MobileMenu from "@/components/MobileMenu";
import NavigationIcon, { type NavigationIconName } from "@/components/NavigationIcon";
import { ASSETS, COPY } from "@/lib/conference";

const links: { href: string; label: string; icon: NavigationIconName }[] = [
  { href: "/", label: COPY.navigation.home, icon: "home" },
  { href: "/letters", label: COPY.navigation.letters, icon: "letters" },
  { href: "/secretariat", label: COPY.navigation.secretariat, icon: "secretariat" },
  { href: "/committees", label: COPY.navigation.committees, icon: "committees" },
];

const Navbar = ({ brandName, showCommittees, showSecretariat }: { brandName: string; showCommittees: boolean; showSecretariat: boolean }) => {
  const visibleLinks = links.filter((link) =>
    (link.href !== "/committees" || showCommittees) &&
    (link.href !== "/secretariat" || showSecretariat)
  );

  return (
    <div className="flex px-8 max-sm:px-0 max-sm:w-full bg-transparent py-4 max-sm:py-2 justify-between items-center border-b border-gray-300">
      <div className="flex items-center gap-4 max-sm:ml-4 max-sm:w-full max-sm:justify-between max-sm:pr-4">
        <Link href="/" className="flex items-center gap-4">
          <Image
            src={ASSETS.logoNoBackground}
            width={75}
            height={75}
            priority
            loading="eager"
            alt={`${brandName} Logo`}
            className="max-sm:w-[50px] max-sm:h-[50px]"
          />
          <h1 className="conference-brand text-3xl font-bold max-sm:hidden">{brandName}</h1>
        </Link>
        <Link
          href="/"
          className="max-sm:absolute max-sm:left-1/2 max-sm:transform max-sm:-translate-x-1/2 sm:hidden"
        >
          <h1 className="conference-brand max-sm:text-2xl font-bold">{brandName}</h1>
        </Link>
      </div>

      <div className="hidden md:ml-12 md:flex w-full items-center justify-end gap-8 max-lg:ml-8 max-lg:gap-5">
        {visibleLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group w-fit text-xl flex items-center gap-1.5 transition-all duration-300 hover:text-gray-400"
          >
            <NavigationIcon name={link.icon} />
            {link.label}
          </Link>
        ))}
        <Link
          href="/apply"
          className="group w-fit glassmorphism text-xl max-sm:text-base cursor-pointer items-center transition-all duration-300 justify-center gap-1.5 inline-flex backdrop-blur-md rounded-full px-5 py-3 shadow-lg"
        >
          <NavigationIcon name="apply" />
          {COPY.navigation.apply}
        </Link>
      </div>

      <MobileMenu showCommittees={showCommittees} showSecretariat={showSecretariat} />
    </div>
  );
};

export default Navbar;
