'use client';

import localFont from 'next/font/local';

const brett = localFont({ 
  src: '../../../public/fonts/brett/BrettTrial-Regular.otf',
  display: 'swap',
  variable: '--font-brett',
  weight: '400'
});

interface RadarTextProps {
  className?: string;
}

export function RadarText({ className }: RadarTextProps) {
  return (
    <div className={`${className} flex justify-center`}>
      <h1 
        className={`${brett.className} text-7xl tracking-tight transition-all duration-300 hover:opacity-80 hover:scale-105 active:opacity-60 active:scale-100 cursor-pointer select-none`}
        style={{ fontFamily: "'Brett', var(--font-brett), serif" }}
        data-font="brett"
      >
        RADAR
      </h1>
    </div>
  );
}