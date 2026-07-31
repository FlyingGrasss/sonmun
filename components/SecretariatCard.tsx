// components/SecretariatCard.tsx

import ContentImage from "@/components/ContentImage"

const Card = ({ 
    imageUrl, 
    secretariatName, 
    role, 
    align = 'left' 
}: { 
    imageUrl: string, 
    secretariatName: string, 
    role?: string,
    align?: 'left' | 'right'
}) => {

  const isImageRight = align === 'right';

  return (
    <div className={`flex flex-col gap-4 md:gap-8 items-center w-full max-w-3xl mx-auto ${isImageRight ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
      
      {/* Image Side */}
      <div className="relative w-full md:w-5/12 max-w-xs flex justify-center group">
        <ContentImage
          src={imageUrl}
          alt={secretariatName}
          width={600}
          height={600}
          className="w-full h-auto object-contain rounded-2xl border-2 border-[var(--color-accent)] shadow-xl transition-transform duration-700 group-hover:scale-105"
        />
      </div>

      {/* Content Side */}
      <div className={`flex flex-col justify-center w-full md:w-7/12 gap-1 ${isImageRight ? 'md:items-end md:text-right' : 'md:items-start md:text-left'} items-center text-center`}>
        <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide">
          {secretariatName}
        </h2>
        
        {role && (
            <h3 className="text-lg md:text-xl text-[var(--color-accent)] font-medium">
                {role}
            </h3>
        )}
      </div>
    </div>
  )
}

export default Card
