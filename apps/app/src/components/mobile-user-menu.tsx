"use client";

import { useAtom } from "jotai";
import { motion, AnimatePresence } from "framer-motion";
import { List, X } from "@phosphor-icons/react";
import { useUser } from "@repo/auth/client";
import { mobileUserMenuOpenAtom } from "@/atoms";
import { cn } from "@/lib/utils";

export function MobileUserMenu() {
  const [isOpen, setIsOpen] = useAtom(mobileUserMenuOpenAtom);
  const { user } = useUser();

  // Get user initials for avatar
  const userInitials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.emailAddresses?.[0]?.emailAddress?.charAt(0).toUpperCase() || "U";

  return (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        "relative flex h-8 w-8 items-center justify-center",
        "rounded-lg border border-border",
        "bg-muted text-foreground",
        "transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
        "md:hidden", // Only show on mobile
        isOpen ? "bg-accent border-foreground/30" : "hover:bg-accent hover:border-foreground/20"
      )}
      aria-label={isOpen ? "Close menu" : "Open menu"}
    >
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="close"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <X className="h-4 w-4" weight="duotone" />
          </motion.div>
        ) : (
          <motion.div
            key="initials"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="text-xs font-medium">{userInitials}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
