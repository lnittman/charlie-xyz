"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { TextScramble } from "@/components/text-scramble";

// ASCII explosion effect for Charlie
const CharlieAsciiExplosion = ({ className = "" }: { className?: string }) => {
  const frames = [
    `
       .  *  .   . *       
    *  . \\|/ .  *   .     
  .  * .-*#*-. *  .  *    
    . /  \\|/  \\ .   .     
  *   . /|\\ .   *  .      
    .  * . *  .     *     
  `,
    `
    .  *  .   . *  .      
  *  . ~\\|/~ .  *   .     
 .  * .-*###*-. *  .  *   
   . ~/  \\|/  \\~ .   .    
 *   . ~/|\\~ .   *  .     
   .  * . *  .     *      
  `,
    `
   .  *  .   . *  .       
 *  . ~~\\|/~~ .  *   .    
.  * ..-*#####*-.. *  . * 
  . ~~/  \\|/  \\~~ .   .   
*   . ~~~/|\\~~~ .   *  .  
  .  * . *  .     *       
  `,
  ];

  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, 500);
    return () => clearInterval(interval);
  }, [frames.length]);

  return (
    <pre className={`font-mono text-[#ABF716]/20 select-none ${className}`}>
      {frames[frameIndex]}
    </pre>
  );
};

export default function NotFound() {
  const router = useRouter();
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    setIsInView(true);
  }, []);

  // Memoize the logo section to prevent ASCII animation from re-rendering
  const logoSection = useMemo(
    () => (
      <div className="relative py-12 md:py-16 overflow-hidden">
        {/* ASCII explosion background */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <CharlieAsciiExplosion className="text-4xl md:text-6xl opacity-30" />
          </div>
        </div>
        
        {/* Charlie logo */}
        <div className="flex items-center justify-center relative z-10">
          <Image
            src="/charlie-logo.svg"
            alt="Charlie"
            width={120}
            height={120}
            className="md:w-32 md:h-32"
          />
        </div>
      </div>
    ),
    []
  );

  return (
    <div className="h-[calc(100vh-3.5rem)] bg-black text-white flex flex-col overflow-hidden">
      <div className="w-full max-w-md mx-auto flex flex-col h-full relative">

        {/* Content wrapper */}
        <div className="flex flex-col flex-1">
          {/* Logo section - Fixed and Memoized */}
          {logoSection}

          {/* 404 Content section */}
          <div className="relative bg-gray-900/30">
            <div className="px-6 py-12 text-center">
              <h1 className="font-mono text-4xl md:text-5xl text-[#ABF716] mb-2">
                {isInView ? (
                  <TextScramble trigger={isInView}>404</TextScramble>
                ) : (
                  "404"
                )}
              </h1>
              <p className="font-mono text-lg text-gray-400 mt-4">
                {isInView ? (
                  <TextScramble trigger={isInView}>Page not found</TextScramble>
                ) : (
                  "Page not found"
                )}
              </p>
            </div>
          </div>

          {/* Spacer pushes the button section to the bottom */}
          <div className="flex-1" />

          {/* Bottom-aligned button section with safe-area padding */}
          <div className="relative">
            <div className="px-6 py-8 pb-[env(safe-area-inset-bottom)]">
              <button
                className="group w-full inline-flex items-center justify-center rounded-lg font-mono text-sm transition-all duration-200 h-12 px-6 bg-gray-900 text-white border border-gray-800 hover:border-[#ABF716]/50 hover:shadow-[0_0_20px_rgba(171,247,22,0.2)] active:scale-[0.98]"
                onClick={() => router.push("/")}
              >
                <ChevronLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
                <span>Go Back Home</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}