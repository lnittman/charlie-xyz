'use client';

import Image from 'next/image';

export function RadarLogoSmall() {
  return (
    <div className="relative group cursor-pointer">
      <Image
        src="/images/radar-logo.png"
        alt="Radar"
        width={32}
        height={32}
        className="transition-all duration-300 ease-out group-hover:scale-110 group-hover:opacity-80 group-active:scale-105"
        priority
      />
    </div>
  );
}