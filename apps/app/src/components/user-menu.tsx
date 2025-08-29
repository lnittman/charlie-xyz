"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
//import { useTheme } from "next-themes";
import { useClerk, useUser } from "@repo/auth/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/design/components/dropdown-menu";
import {
  SignOut,
  User,
  Moon,
  Sun,
  Desktop,
  List,
  X,
  GridFour,
  Gear,
  Bell,
  ChatCircle,
} from "@phosphor-icons/react";
import { cn } from "@repo/design/lib/utils";
import { useSetAtom } from "jotai";
import { feedbackSheetOpenAtom } from "@/atoms";

export function UserMenuWithTheme() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();
  //const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const setFeedbackOpen = useSetAtom(feedbackSheetOpenAtom);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/signin");
  };

  // Get user initials for avatar
  const userInitials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.emailAddresses?.[0]?.emailAddress?.charAt(0).toUpperCase() || "U";

  const hasCustomAvatar = user?.imageUrl && !user.imageUrl.includes("gravatar");

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger asChild>
        <button className={cn(
          "h-8 w-8 bg-muted text-foreground flex items-center justify-center text-xs font-medium flex-shrink-0 border border-border transition-all duration-300 rounded-lg overflow-hidden",
          "hover:bg-accent hover:border-foreground/20",
          "focus:outline-none select-none",
          menuOpen ? "bg-accent/80 border-foreground/30" : ""
        )}>
          <span className="text-xs font-medium">{userInitials}</span>
        </button>
      </DropdownMenuTrigger>

      <AnimatePresence>
        {menuOpen && (
          <DropdownMenuContent align="end" className="w-56 bg-popover border-border/50" forceMount>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: [0.32, 0.72, 0, 1]
              }}
            >
              <div className="flex items-center justify-start gap-3 px-2 py-2 border-b border-border/50">
                <div className="flex-1">
                  {user?.firstName && (
                    <p className="font-medium text-sm">{user.firstName} {user.lastName}</p>
                  )}
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.emailAddresses?.[0]?.emailAddress}
                  </p>
                </div>
              </div>

              <div className="py-1">
                <DropdownMenuItem
                  onClick={() => router.push("/radars")}
                  className="mx-1 px-2 py-1.5 rounded-md hover:bg-muted/30 transition-all duration-300 group cursor-pointer"
                >
                  <div className="flex items-center w-full">
                    <GridFour className="w-4 h-4 mr-2 text-muted-foreground group-hover:text-foreground transition-all duration-300" weight="duotone" />
                    <span className="flex-1 text-sm">My Radars</span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => router.push("/account")}
                  className="mx-1 px-2 py-1.5 rounded-md hover:bg-muted/30 transition-all duration-300 group cursor-pointer"
                >
                  <div className="flex items-center w-full">
                    <Gear className="w-4 h-4 mr-2 text-muted-foreground group-hover:text-foreground transition-all duration-300" weight="duotone" />
                    <span className="flex-1 text-sm">Settings</span>
                  </div>
                </DropdownMenuItem>
              </div>

              <DropdownMenuSeparator className="my-1" />

              {/* Feedback */}
              <DropdownMenuItem
                onClick={() => {
                  setMenuOpen(false);
                  setTimeout(() => setFeedbackOpen(true), 100);
                }}
                className="mx-1 px-2 py-1.5 rounded-md hover:bg-muted/30 transition-all duration-300 group cursor-pointer"
              >
                <div className="flex items-center w-full">
                  <ChatCircle className="w-4 h-4 mr-2 text-muted-foreground group-hover:text-foreground transition-all duration-300" weight="duotone" />
                  <span className="flex-1 text-sm">Send Feedback</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1" />

              <DropdownMenuItem
                onClick={handleSignOut}
                className="mx-1 px-2 py-1.5 rounded-md hover:bg-muted/30 transition-all duration-300 group cursor-pointer"
              >
                <div className="flex items-center w-full">
                  <SignOut className="w-4 h-4 mr-2 text-red-500/70 group-hover:text-red-600 transition-all duration-300" weight="duotone" />
                  <span className="flex-1 text-sm text-red-500/70 group-hover:text-red-600 transition-all duration-300">Sign out</span>
                </div>
              </DropdownMenuItem>
            </motion.div>
          </DropdownMenuContent>
        )}
      </AnimatePresence>
    </DropdownMenu>
  );
}
