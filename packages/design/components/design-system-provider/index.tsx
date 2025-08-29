"use client";

import type { ThemeProviderProps } from "next-themes";
import { ThemeProvider } from "../theme-provider";
import { Toaster } from "../toast";

export function DesignSystemProvider({
  children,
  ...props
}: ThemeProviderProps) {
  return (
    <ThemeProvider {...props}>
      {children}
      <Toaster />
    </ThemeProvider>
  );
}