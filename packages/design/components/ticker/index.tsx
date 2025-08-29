"use client";

import * as React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "../../lib/utils";

interface TickerContextValue {
  formatter: Intl.NumberFormat;
}

const TickerContext = React.createContext<TickerContextValue | null>(null);

function useTickerContext() {
  const context = React.useContext(TickerContext);
  if (!context) {
    throw new Error("Ticker components must be used within a Ticker provider");
  }
  return context;
}

interface TickerProps extends React.HTMLAttributes<HTMLDivElement> {
  currency?: string;
  locale?: string;
}

export function Ticker({
  currency = "USD",
  locale = "en-US",
  className,
  children,
  ...props
}: TickerProps) {
  const formatter = React.useMemo(() => {
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch {
      // Fallback for invalid currency/locale combinations
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
  }, [currency, locale]);

  return (
    <TickerContext.Provider value={{ formatter }}>
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5 text-sm",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </TickerContext.Provider>
  );
}

interface TickerSymbolProps extends React.HTMLAttributes<HTMLSpanElement> {}

export const TickerSymbol = React.memo(function TickerSymbol({
  className,
  children,
  ...props
}: TickerSymbolProps) {
  return (
    <span
      className={cn("font-medium text-foreground", className)}
      {...props}
    >
      {children}
    </span>
  );
});

interface TickerPriceProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
}

export const TickerPrice = React.memo(function TickerPrice({
  value,
  className,
  ...props
}: TickerPriceProps) {
  const { formatter } = useTickerContext();
  
  return (
    <span
      className={cn("font-mono tabular-nums", className)}
      {...props}
    >
      {formatter.format(value)}
    </span>
  );
});

interface TickerChangeProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  showIcon?: boolean;
}

export const TickerChange = React.memo(function TickerChange({
  value,
  showIcon = true,
  className,
  ...props
}: TickerChangeProps) {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium tabular-nums",
        isPositive && "text-green-600 dark:text-green-400",
        !isPositive && !isNeutral && "text-red-600 dark:text-red-400",
        isNeutral && "text-muted-foreground",
        className
      )}
      {...props}
    >
      {showIcon && !isNeutral && <Icon className="h-3 w-3" />}
      {isPositive && "+"}
      {value.toFixed(2)}%
    </span>
  );
});

// For non-currency number animations
interface TickerNumberProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  format?: (value: number) => string;
}

export const TickerNumber = React.memo(function TickerNumber({
  value,
  format = (v) => v.toLocaleString(),
  className,
  ...props
}: TickerNumberProps) {
  return (
    <span
      className={cn("font-mono tabular-nums", className)}
      {...props}
    >
      {format(value)}
    </span>
  );
});