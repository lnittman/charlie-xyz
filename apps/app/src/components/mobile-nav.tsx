"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, X } from "@phosphor-icons/react";
import Image from "next/image";
import localFont from 'next/font/local';
import { cn } from "@repo/design/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const brett = localFont({ 
  src: '../../public/fonts/brett/BrettTrial-Regular.otf',
  display: 'swap',
  variable: '--font-brett',
  weight: '400'
});

interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/radar", label: "Explore" },
    { to: "/pricing", label: "Pricing" },
  ];

  // Close menu when route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md",
          "hover:bg-accent transition-colors md:hidden",
          className
        )}
        aria-label="Open menu"
      >
        <List size={20} weight="bold" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 md:hidden"
              onClick={() => setOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 h-full w-[280px] bg-background border-r border-border z-50 md:hidden"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <Link 
                    href="/" 
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3"
                  >
                    <Image 
                      src="/images/radar-logo.png" 
                      alt="Radar Logo" 
                      width={32} 
                      height={32} 
                      className="object-contain"
                    />
                    <span className={`${brett.className} text-2xl tracking-tight`}>RADAR</span>
                  </Link>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-2 hover:bg-accent rounded-md transition-colors"
                    aria-label="Close menu"
                  >
                    <X size={20} weight="bold" />
                  </button>
                </div>
                
                {/* Navigation */}
                <nav className="flex-1 p-4">
                  <div className="flex flex-col gap-2">
                    {links.map(({ to, label }) => {
                      const isActive = pathname === to || (to !== "/" && pathname.startsWith(to));
                      return (
                        <Link
                          key={to}
                          href={to}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                            isActive 
                              ? "bg-accent text-foreground" 
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                          )}
                        >
                          {label}
                        </Link>
                      );
                    })}
                  </div>
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}