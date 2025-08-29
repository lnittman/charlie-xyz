"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAtom, useSetAtom } from "jotai";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, useClerk } from "@repo/auth/client";
import { 
  mobileUserMenuOpenAtom, 
  isMobileMenuOpenAtom,
  shouldShowBlurOverlayAtom,
  feedbackSheetOpenAtom 
} from "@/atoms";
import { cn } from "@/lib/utils";
import { 
  GridFour, 
  Gear, 
  SignOut,
  Moon,
  Sun,
  Desktop,
  FileText,
  ChatCircle,
  Sparkle
} from "@phosphor-icons/react";
import { useTheme } from "next-themes";

function MenuContent() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { theme, setTheme } = useTheme();
  const setIsOpen = useSetAtom(mobileUserMenuOpenAtom);
  const shouldShowBlur = useAtom(shouldShowBlurOverlayAtom)[0];
  const setFeedbackOpen = useSetAtom(feedbackSheetOpenAtom);

  const handleSignOut = async () => {
    await signOut();
    router.push("/signin");
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  const userInitials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.emailAddresses?.[0]?.emailAddress?.charAt(0).toUpperCase() || "U";

  const hasCustomAvatar = user?.imageUrl && !user.imageUrl.includes("gravatar");

  return (
    <div className="flex flex-col h-full">
      {/* User Info */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted overflow-hidden">
            {hasCustomAvatar ? (
              <img
                src={user?.imageUrl}
                alt="User avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-lg font-medium">{userInitials}</span>
            )}
          </div>
          <div>
            {user?.firstName && (
              <p className="font-medium">{user.firstName} {user.lastName}</p>
            )}
            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
              {user?.emailAddresses?.[0]?.emailAddress}
            </p>
          </div>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="p-4 space-y-2">
        <button
          onClick={() => handleNavigation("/upgrade")}
          className={cn(
            "w-full flex items-center justify-center gap-2",
            "py-3 px-4 rounded-lg",
            "bg-primary text-primary-foreground",
            "hover:bg-primary/90 transition-colors"
          )}
        >
          <Sparkle className="w-4 h-4" weight="duotone" />
          <span className="font-medium">Upgrade to Pro</span>
        </button>
      </div>

      {/* Menu Items */}
      <div className="flex-1 px-4 pb-4 space-y-1">
        <button
          onClick={() => handleNavigation("/radars")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors text-left"
        >
          <GridFour className="w-5 h-5" weight="duotone" />
          <span>My Radars</span>
        </button>

        <button
          onClick={() => handleNavigation("/account")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors text-left"
        >
          <Gear className="w-5 h-5" weight="duotone" />
          <span>Settings</span>
        </button>

        <div className="py-2">
          <div className="h-px bg-border" />
        </div>

        {/* Theme Switcher */}
        <div className="px-4 py-2">
          <p className="text-sm font-medium text-muted-foreground mb-2">Theme</p>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme("light")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2",
                "py-2 px-3 rounded-lg border transition-colors",
                theme === "light" 
                  ? "border-primary bg-primary/10" 
                  : "border-border hover:bg-accent"
              )}
            >
              <Sun className="w-4 h-4" weight="duotone" />
              <span className="text-sm">Light</span>
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2",
                "py-2 px-3 rounded-lg border transition-colors",
                theme === "dark" 
                  ? "border-primary bg-primary/10" 
                  : "border-border hover:bg-accent"
              )}
            >
              <Moon className="w-4 h-4" weight="duotone" />
              <span className="text-sm">Dark</span>
            </button>
            <button
              onClick={() => setTheme("system")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2",
                "py-2 px-3 rounded-lg border transition-colors",
                theme === "system" 
                  ? "border-primary bg-primary/10" 
                  : "border-border hover:bg-accent"
              )}
            >
              <Desktop className="w-4 h-4" weight="duotone" />
              <span className="text-sm">System</span>
            </button>
          </div>
        </div>

        <div className="py-2">
          <div className="h-px bg-border" />
        </div>

        {/* Documentation Links */}
        <button
          onClick={() => window.open("https://radar.com/docs", "_blank")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors text-left"
        >
          <FileText className="w-5 h-5" weight="duotone" />
          <span>Documentation</span>
        </button>

        <button
          onClick={() => {
            setIsOpen(false);
            setTimeout(() => setFeedbackOpen(true), 100);
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors text-left"
        >
          <ChatCircle className="w-5 h-5" weight="duotone" />
          <span>Send Feedback</span>
        </button>

        <div className="py-2">
          <div className="h-px bg-border" />
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors text-left text-destructive"
        >
          <SignOut className="w-5 h-5" weight="duotone" />
          <span>Sign out</span>
        </button>
      </div>

      {/* Blur overlay for nested modals */}
      {shouldShowBlur && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-[77]" />
      )}
    </div>
  );
}

export function MobileUserMenuOverlay() {
  const [isOpen, setIsOpen] = useAtom(mobileUserMenuOpenAtom);
  const setIsMobileMenuOpen = useSetAtom(isMobileMenuOpenAtom);

  // Update global mobile menu state
  useEffect(() => {
    setIsMobileMenuOpen(isOpen);
  }, [isOpen, setIsMobileMenuOpen]);

  // Close on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsOpen]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "fixed inset-0 top-14 bg-background z-[68]",
            "md:hidden" // Only show on mobile
          )}
        >
          <div className="relative h-full overflow-y-auto z-[69]">
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground">Loading...</div>
              </div>
            }>
              <MenuContent />
            </Suspense>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}