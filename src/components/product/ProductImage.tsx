import Image from "next/image";

interface Props {
  src: string | null | undefined;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export default function ProductImage({ src, alt, width, height, className = "" }: Props) {
  if (!src) {
    return (
      <div
        style={{ width, height }}
        className={`flex items-center justify-center bg-slate-100 text-slate-400 rounded ${className}`}
        aria-label={`${alt} 이미지 없음`}
      >
        <svg className="w-1/3 h-1/3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }
  return (
    <Image src={src} alt={alt} width={width} height={height} className={className} unoptimized />
  );
}
