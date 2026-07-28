// components/CommitteeCard.tsx

import ContentImage from "@/components/ContentImage"
import Link from "next/link"

const Card = ({ 
    imageUrl, 
    committeeName, 
    slug, 
    description,
    align = 'left' 
}: { 
    imageUrl: string, 
    committeeName: string, 
    slug: string,
    description?: string,
    align?: 'left' | 'right'
}) => {
  
  const plainDescription = description?.replace(/[#*_`-]/g, "").trim() ?? "";
  const shortDesc =
    plainDescription.length > 150
      ? `${plainDescription.slice(0, 150)}...`
      : plainDescription;

  const isImageRight = align === 'right';

  return (
    <div className={`flex flex-col gap-6 md:gap-12 items-center w-full max-w-[95vw] lg:max-w-[80vw] ${isImageRight ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
      
      {/* Image Side - Unrestricted Aspect Ratio */}
      <div className="relative w-full md:w-1/2 flex justify-center group">
        <ContentImage
          src={imageUrl}
          alt={committeeName}
          width={800} 
          height={800} 
          className="w-full h-auto object-contain rounded-3xl border-2 border-[var(--color-accent)] shadow-2xl transition-transform duration-700 group-hover:scale-105"
        />
      </div>

      {/* Content Side */}
      <div className={`flex flex-col justify-center w-full md:w-1/2 gap-6 ${isImageRight ? 'md:items-end md:text-right' : 'md:items-start md:text-left'} items-center text-center`}>
        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-wide">
            {committeeName}
        </h2>
        
        <p className="text-gray-300 text-lg md:text-xl leading-relaxed max-w-xl">
            {shortDesc}
        </p>

        <Link href={`/committees/${slug}`} className="w-fit mt-2">
            {/* 
               Button Layout Logic:
               - If Image is Right (align='right'): Text is Left. Arrow points Right -> `flex-row` (Text then Arrow)
               - If Image is Left (align='left'): Text is Right. Arrow points Left -> `flex-row-reverse` (Arrow then Text)
            */}
            <button className={`group glassmorphism text-lg cursor-pointer items-center transition-all duration-300 justify-center gap-3 inline-flex backdrop-blur-md rounded-full px-8 py-3 shadow-lg border border-white/20 hover:border-[var(--color-accent)] ${isImageRight ? 'flex-row' : 'flex-row-reverse'}`}>
                <span>Explore</span>
                <svg
                    width="20"
                    height="16"
                    viewBox="0 0 24 19"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    // If Image Left (reversed flex), arrow starts rotated 180 to point left.
                    // If Image Right (normal flex), arrow is normal to point right.
                    className={`transition-transform duration-300 fill-white group-hover:fill-[var(--color-accent)] ${
                        !isImageRight 
                        ? 'rotate-180 group-hover:-translate-x-2' // Pointing Left 
                        : 'group-hover:translate-x-2'              // Pointing Right
                    }`}
                >
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M14.7105 0.439344C14.1953 1.02511 14.1953 1.97487 14.7105 2.56064L19.4951 7.99997H1.56946C0.840735 7.99997 0.25 8.67155 0.25 9.49997C0.25 10.3284 0.840735 11 1.56946 11H19.4951L14.7105 16.4392C14.1953 17.0251 14.1953 17.9749 14.7105 18.5606C15.2258 19.1465 16.0614 19.1465 16.5765 18.5606L23.6136 10.5606C24.1288 9.97473 24.1288 9.02509 23.6136 8.43932L16.5765 0.439344C16.0614 -0.146448 15.2258 -0.146448 14.7105 0.439344Z"
                    />
                </svg>
            </button>
        </Link>
      </div>     
    </div>
  )
}

export default Card
