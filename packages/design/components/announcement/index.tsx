"use client";

import * as React from "react";
import { Badge, type BadgeProps } from "../badge";
import { cn } from "../../lib/utils";
import { X } from "lucide-react";

interface AnnouncementProps extends BadgeProps {
  themed?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function Announcement({
  variant = "secondary",
  themed = false,
  dismissible = false,
  onDismiss,
  className,
  children,
  ...props
}: AnnouncementProps) {
  return (
    <Badge
      className={cn(
        "group gap-3 rounded-full px-4 py-1.5 text-xs font-normal transition-all hover:pr-2 hover:shadow-sm",
        themed && [
          "bg-gradient-to-r",
          variant === "default" && "from-primary/90 to-primary text-primary-foreground",
          variant === "secondary" && "from-secondary/90 to-secondary text-secondary-foreground",
          variant === "destructive" && "from-destructive/90 to-destructive text-destructive-foreground",
          variant === "outline" && "from-background to-background",
          variant === "success" && "from-green-500/10 to-green-600/10 text-green-700 dark:text-green-400",
          variant === "warning" && "from-yellow-500/10 to-yellow-600/10 text-yellow-700 dark:text-yellow-400",
          variant === "info" && "from-blue-500/10 to-blue-600/10 text-blue-700 dark:text-blue-400",
        ],
        className
      )}
      variant={variant}
      {...props}
    >
      <div className="flex items-center gap-3">
        {children}
        {dismissible && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDismiss?.();
            }}
            className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
            aria-label="Dismiss announcement"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </Badge>
  );
}

interface AnnouncementTagProps extends React.HTMLAttributes<HTMLSpanElement> {}

export function AnnouncementTag({ className, children, ...props }: AnnouncementTagProps) {
  return (
    <span
      className={cn(
        "rounded bg-black/10 px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider text-black/60",
        "dark:bg-white/10 dark:text-white/60",
        "group-hover:bg-black/20 dark:group-hover:bg-white/20",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

interface AnnouncementTitleProps extends React.HTMLAttributes<HTMLSpanElement> {}

export function AnnouncementTitle({ className, children, ...props }: AnnouncementTitleProps) {
  return (
    <span className={cn("truncate", className)} {...props}>
      {children}
    </span>
  );
}

// Convenience component for common announcement patterns
interface AnnouncementBarProps extends React.HTMLAttributes<HTMLDivElement> {
  announcements: Array<{
    id: string;
    tag?: string;
    title: string;
    variant?: BadgeProps["variant"];
    href?: string;
  }>;
  dismissible?: boolean;
  onDismiss?: (id: string) => void;
}

export function AnnouncementBar({
  announcements,
  dismissible = true,
  onDismiss,
  className,
  ...props
}: AnnouncementBarProps) {
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());

  const visibleAnnouncements = announcements.filter(
    (announcement) => !dismissed.has(announcement.id)
  );

  if (visibleAnnouncements.length === 0) return null;

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
    onDismiss?.(id);
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4 bg-muted/30 px-4 py-2",
        className
      )}
      {...props}
    >
      {visibleAnnouncements.map((announcement) => {
        const Component = announcement.href ? "a" : "div";
        return (
          <Component
            key={announcement.id}
            href={announcement.href}
            target={announcement.href ? "_blank" : undefined}
            rel={announcement.href ? "noopener noreferrer" : undefined}
          >
            <Announcement
              variant={announcement.variant}
              dismissible={dismissible}
              onDismiss={() => handleDismiss(announcement.id)}
            >
              {announcement.tag && (
                <AnnouncementTag>{announcement.tag}</AnnouncementTag>
              )}
              <AnnouncementTitle>{announcement.title}</AnnouncementTitle>
            </Announcement>
          </Component>
        );
      })}
    </div>
  );
}

// Add compound component pattern
Announcement.Tag = AnnouncementTag;
Announcement.Title = AnnouncementTitle;
Announcement.Content = AnnouncementTitle; // Alias for better API