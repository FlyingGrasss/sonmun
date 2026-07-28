/* eslint-disable @next/next/no-img-element */
import Image from "next/image";

type ContentImageProps = {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
};

export default function ContentImage({
  src,
  alt,
  className,
  width = 800,
  height = 800,
}: ContentImageProps) {
  if (src.startsWith("/")) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
      />
    );
  }

  return <img src={src} alt={alt} className={className} loading="lazy" />;
}
