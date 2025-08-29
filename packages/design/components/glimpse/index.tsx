"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../hover-card";

export interface GlimpseProps extends React.ComponentProps<typeof HoverCard> {}

export function Glimpse(props: GlimpseProps) {
  return <HoverCard {...props} />;
}

export interface GlimpseContentProps extends React.ComponentProps<typeof HoverCardContent> {}

export function GlimpseContent(props: GlimpseContentProps) {
  return <HoverCardContent {...props} />;
}

export interface GlimpseTriggerProps extends React.ComponentProps<typeof HoverCardTrigger> {}

export function GlimpseTrigger(props: GlimpseTriggerProps) {
  return <HoverCardTrigger {...props} />;
}

export interface GlimpseTitleProps extends React.ComponentProps<"p"> {}

export function GlimpseTitle({ className, ...props }: GlimpseTitleProps) {
  return (
    <p className={cn("truncate font-semibold text-sm", className)} {...props} />
  );
}

export interface GlimpseDescriptionProps extends React.ComponentProps<"p"> {}

export function GlimpseDescription({
  className,
  ...props
}: GlimpseDescriptionProps) {
  return (
    <p
      className={cn("line-clamp-2 text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export interface GlimpseImageProps extends React.ComponentProps<"img"> {}

export function GlimpseImage({
  className,
  alt,
  ...props
}: GlimpseImageProps) {
  return (
    <img
      alt={alt ?? ""}
      className={cn(
        "mb-4 aspect-[120/63] w-full rounded-md border object-cover",
        className
      )}
      {...props}
    />
  );
}