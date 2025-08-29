"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

interface RelativeTimeContextValue {
  time: Date;
  locale?: string;
}

const RelativeTimeContext = React.createContext<RelativeTimeContextValue | null>(null);

function useRelativeTimeContext() {
  const context = React.useContext(RelativeTimeContext);
  if (!context) {
    throw new Error("RelativeTime components must be used within a RelativeTime provider");
  }
  return context;
}

interface RelativeTimeProps extends React.HTMLAttributes<HTMLDivElement> {
  time?: Date;
  locale?: string;
  live?: boolean;
  updateInterval?: number;
}

export function RelativeTime({
  time: initialTime = new Date(),
  locale = "en-US",
  live = true,
  updateInterval = 1000,
  className,
  children,
  ...props
}: RelativeTimeProps) {
  const [time, setTime] = React.useState(initialTime);

  React.useEffect(() => {
    if (!live) return;

    const interval = setInterval(() => {
      setTime(new Date());
    }, updateInterval);

    return () => clearInterval(interval);
  }, [live, updateInterval]);

  return (
    <RelativeTimeContext.Provider value={{ time, locale }}>
      <div className={cn("inline-flex items-center gap-2", className)} {...props}>
        {children}
      </div>
    </RelativeTimeContext.Provider>
  );
}

interface RelativeTimeDisplayProps extends React.HTMLAttributes<HTMLSpanElement> {
  format?: Intl.DateTimeFormatOptions;
}

export function RelativeTimeDisplay({
  format = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  },
  className,
  ...props
}: RelativeTimeDisplayProps) {
  const { time, locale } = useRelativeTimeContext();

  const formattedTime = React.useMemo(() => {
    return new Intl.DateTimeFormat(locale, format).format(time);
  }, [time, locale, format]);

  return (
    <span className={cn("font-mono tabular-nums", className)} {...props}>
      {formattedTime}
    </span>
  );
}

interface RelativeTimeDateProps extends React.HTMLAttributes<HTMLSpanElement> {
  format?: Intl.DateTimeFormatOptions;
}

export function RelativeTimeDate({
  format = {
    month: "short",
    day: "numeric",
    year: "numeric",
  },
  className,
  ...props
}: RelativeTimeDateProps) {
  const { time, locale } = useRelativeTimeContext();

  const formattedDate = React.useMemo(() => {
    return new Intl.DateTimeFormat(locale, format).format(time);
  }, [time, locale, format]);

  return (
    <span className={cn("text-muted-foreground", className)} {...props}>
      {formattedDate}
    </span>
  );
}

interface RelativeTimeAgoProps extends React.HTMLAttributes<HTMLSpanElement> {
  from: Date | string;
}

export function RelativeTimeAgo({
  from,
  className,
  ...props
}: RelativeTimeAgoProps) {
  const { time } = useRelativeTimeContext();
  const fromDate = new Date(from);

  const [timeAgo, setTimeAgo] = React.useState("");

  React.useEffect(() => {
    const updateTimeAgo = () => {
      const seconds = Math.floor((time.getTime() - fromDate.getTime()) / 1000);
      
      if (seconds < 60) {
        setTimeAgo("just now");
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        setTimeAgo(`${minutes}m ago`);
      } else if (seconds < 86400) {
        const hours = Math.floor(seconds / 3600);
        setTimeAgo(`${hours}h ago`);
      } else if (seconds < 604800) {
        const days = Math.floor(seconds / 86400);
        setTimeAgo(`${days}d ago`);
      } else {
        setTimeAgo(fromDate.toLocaleDateString());
      }
    };

    updateTimeAgo();
  }, [time, fromDate]);

  return (
    <span className={cn("text-muted-foreground", className)} {...props}>
      {timeAgo}
    </span>
  );
}

// Standalone version for simple use cases
interface TimeAgoProps extends React.HTMLAttributes<HTMLSpanElement> {
  date: Date | string;
  live?: boolean;
}

export function TimeAgo({ date, live = true, className, ...props }: TimeAgoProps) {
  return (
    <RelativeTime live={live}>
      <RelativeTimeAgo from={date} className={className} {...props} />
    </RelativeTime>
  );
}