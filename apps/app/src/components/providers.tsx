"use client";

import { DesignSystemProvider } from "@repo/design";
import { Provider as JotaiProvider } from "jotai";

export default function Providers({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <JotaiProvider>
      <DesignSystemProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </DesignSystemProvider>
    </JotaiProvider>
  );
}