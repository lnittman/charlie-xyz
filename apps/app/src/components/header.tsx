"use client";
import localFont from 'next/font/local';

import Image from "next/image";
import Link from "next/link";
import { useAtom } from "jotai";
import { motion } from "framer-motion";

import { CreateRadarButton } from "./create-radar-button";
import { UserMenuWithTheme } from "./user-menu";
import { ViewToggle } from "./view-toggle";
import { MobileUserMenu } from "./mobile-user-menu";
import { mobileUserMenuOpenAtom } from "@/atoms";

const brett = localFont({
  src: '../../public/fonts/brett/BrettTrial-Regular.otf',
  display: 'swap',
  variable: '--font-brett',
  weight: '400'
});

export default function Header() {
  const [isMobileMenuOpen] = useAtom(mobileUserMenuOpenAtom);
  
  return (
    <header className="sticky top-0 z-40 w-full bg-background">
      <div className="flex h-16 items-center justify-between px-4 relative">
        {/* Left side - Logo and Desktop Navigation */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/images/radar-logo.png"
                alt="Radar Logo"
                width={32}
                height={32}
                className="object-contain"
              />
              <span className={`${brett.className} text-2xl tracking-tight hidden sm:block`}>radar</span>
            </Link>
          </div>
        </div>

        {/* Center - View Toggle */}
        <motion.div 
          className="absolute left-1/2 transform -translate-x-1/2 z-10"
          animate={{ opacity: isMobileMenuOpen ? 0 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <ViewToggle />
        </motion.div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Desktop user menu */}
          <div className="hidden md:block">
            <UserMenuWithTheme />
          </div>
          {/* Mobile user menu */}
          <MobileUserMenu />
        </div>
      </div>
    </header>
  );
}
