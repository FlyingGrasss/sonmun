// components/SecretariatCard.tsx

import ContentImage from "@/components/ContentImage"
import Link from "next/link"

const Card = ({ 
    imageUrl, 
    secretariatName, 
    role, 
    slug,
    hasDetails = false,
    align = 'left' 
}: { 
    imageUrl: string, 
    secretariatName: string, 
    role?: string,
    slug: string,
    hasDetails?: boolean,
    align?: 'left' | 'right'
}) => {

  const isImageRight = align === 'right';

  return (
    <div className={`flex flex-col gap-6 md:gap-12 items-center w-full max-w-[95vw] lg:max-w-[80vw] ${isImageRight ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
      
      {/* Image Side */}
      <div className="relative w-full md:w-1/2 flex justify-center group">
        <ContentImage
          src={imageUrl}
          alt={secretariatName}
          width={800}
          height={800}
          className="w-full h-auto object-contain rounded-3xl border-2 border-[var(--color-accent)] shadow-2xl transition-transform duration-700 group-hover:scale-105"
        />
      </div>

      {/* Content Side */}
      <div className={`flex flex-col justify-center w-full md:w-1/2 gap-4 ${isImageRight ? 'md:items-end md:text-right' : 'md:items-start md:text-left'} items-center text-center`}>
        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-wide">
          {secretariatName}
        </h2>
        
        {role && (
            <h3 className="text-2xl text-[var(--color-accent)] font-medium">
                {role}
            </h3>
        )}

        {hasDetails && <div className="flex gap-4 mt-4">
            <Link href={`/secretariat/${slug}`}>
                <button className={`group glassmorphism text-lg cursor-pointer items-center transition-all duration-300 justify-center gap-3 inline-flex backdrop-blur-md rounded-full px-8 py-3 shadow-lg border border-white/20 hover:border-[var(--color-accent)] ${isImageRight ? 'flex-row' : 'flex-row-reverse'}`}>
                    <span>Read More</span>
                    <svg
                        width="20"
                        height="16"
                        viewBox="0 0 24 19"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
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
        </div>}
      </div>
    </div>
  )
}

export default Card
