'use client';

import Image from 'next/image';

interface RadarLogoProps {
  className?: string;
}

export function RadarLogo({ className }: RadarLogoProps) {
  return (
    <div className={`${className} flex justify-center`}>
      <div className="relative group cursor-pointer">
        <Image
          src="/images/radar-logo.png"
          alt="Radar Logo"
          width={120}
          height={120}
          className="transition-all duration-300 ease-out group-hover:scale-110 group-hover:opacity-90 group-active:scale-105 group-active:opacity-80"
          priority
        />
        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-400/20 to-red-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>
    </div>
  );
}