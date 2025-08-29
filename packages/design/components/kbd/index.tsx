import * as React from "react";
import { cn } from "../../lib/utils";

const DefaultKbdSeparator = ({
  className,
  children = "+",
  ...props
}: React.ComponentProps<"span">) => (
  <span className={cn("text-muted-foreground/50", className)} {...props}>
    {children}
  </span>
);

export interface KbdProps extends React.ComponentProps<"span"> {
  separator?: React.ReactNode;
}

export function Kbd({
  className,
  separator = <DefaultKbdSeparator />,
  children,
  ...props
}: KbdProps) {
  return (
    <span
      className={cn(
        "inline-flex select-none items-center gap-1 rounded border bg-muted px-1.5 align-middle font-medium font-mono text-[10px] text-muted-foreground leading-loose",
        className
      )}
      {...props}
    >
      {Array.isArray(children)
        ? children.map((child, index) => (
            <React.Fragment key={index}>
              {child}
              {index < children.length - 1 && separator}
            </React.Fragment>
          ))
        : children}
    </span>
  );
}

export interface KbdKeyProps extends React.ComponentProps<"kbd"> {}

export function KbdKey({ className, ...props }: KbdKeyProps) {
  return <kbd className={cn("", className)} {...props} />;
}