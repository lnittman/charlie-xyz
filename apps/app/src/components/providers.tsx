"use client";

import { DesignSystemProvider } from "@repo/design";
import { AuthProvider } from "@repo/auth/provider";
import { Provider as JotaiProvider } from "jotai";

export default function Providers({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <JotaiProvider>
        <DesignSystemProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </DesignSystemProvider>
      </JotaiProvider>
    </AuthProvider>
  );
}
