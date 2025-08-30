"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Check, ChevronLeft } from "lucide-react";

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

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const copiedTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  const handleCopy = () => {
    const errorText = `Error: ${error.message || "An unexpected error occurred"}${
      error.digest ? `\nID: ${error.digest}` : ""
    }${error.stack ? `\n\nStack:\n${error.stack}` : ""}`;

    navigator.clipboard.writeText(errorText);
    setCopied(true);

    if (copiedTimeout.current) {
      clearTimeout(copiedTimeout.current);
    }

    copiedTimeout.current = setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copiedTimeout.current) {
        clearTimeout(copiedTimeout.current);
      }
    };
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
      {/* Desktop and Mobile layout unified */}
      <div className="w-full max-w-md mx-auto flex flex-col h-full relative">

        {/* Logo section */}
        <div className="flex-shrink-0">
          {logoSection}
        </div>

        {/* Error message panel */}
        <div className="relative bg-red-900/10 flex-shrink-0">
          <div className="px-6 py-8 text-center">
            <p className="font-mono text-lg text-[#ABF716]">
              Something went wrong...
            </p>
          </div>
        </div>

        {/* Buttons section */}
        <div className="relative flex-shrink-0">
          <div className="px-6 py-6 flex gap-3">
            <button
              className="group flex-1 inline-flex items-center justify-center rounded-lg font-mono text-sm transition-all duration-200 h-10 px-4 bg-gray-900 text-gray-400 border border-gray-800 hover:text-white hover:border-gray-700 active:scale-[0.98]"
              onClick={() => router.push("/")}
            >
              <ChevronLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-0.5" />
              <span>Go Home</span>
            </button>
            <button
              className="flex-1 inline-flex items-center justify-center rounded-lg font-mono text-sm transition-all duration-200 h-10 px-4 bg-[#ABF716] text-black hover:bg-[#9BE516] active:scale-[0.98] shadow-[0_0_20px_rgba(171,247,22,0.3)]"
              onClick={reset}
            >
              Try Again
            </button>
          </div>
        </div>

        {/* Error diagnostic section */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-6 font-mono text-sm text-gray-400 space-y-4">
            {/* Error message */}
            <div className="break-all">
              <span className="text-gray-500">Error:</span>{" "}
              <span className="text-white">
                {error.message || "An unexpected error occurred"}
              </span>
            </div>

            {/* Error ID if available */}
            {error.digest && (
              <div>
                <span className="text-gray-500">ID:</span>{" "}
                <span className="text-gray-400">{error.digest}</span>
              </div>
            )}

            {/* Stack trace in dev mode */}
            {process.env.NODE_ENV === "development" && error.stack && (
              <div className="mt-6">
                <div className="text-gray-500 mb-2">Stack trace:</div>
                <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap break-all max-h-64 overflow-y-auto bg-gray-900/50 rounded-lg p-3 border border-gray-800">
                  {error.stack}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Copy button section - Fixed at bottom */}
        <div className="relative flex-shrink-0">
          <div className="px-6 py-6">
            <button
              className="group w-full inline-flex items-center justify-center rounded-lg font-mono text-sm transition-all duration-200 h-12 px-6 bg-gray-900 text-white border border-gray-800 hover:border-[#ABF716]/50 hover:shadow-[0_0_20px_rgba(171,247,22,0.2)] active:scale-[0.98] overflow-hidden"
              onClick={handleCopy}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={copied ? "copied" : "copy"}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="flex gap-2 items-center"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-[#ABF716]" />
                      <span className="text-[#ABF716]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Error Details</span>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}