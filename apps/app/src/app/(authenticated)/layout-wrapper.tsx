"use client";

import { SWRConfig } from "swr";
import type { ReactNode } from "react";

interface LayoutWrapperProps {
  children: ReactNode;
  fallback: Record<string, any>;
}

export function LayoutWrapper({ children, fallback }: LayoutWrapperProps) {
  return (
    <SWRConfig
      value={{
        fallback,
        revalidateOnMount: false,
        revalidateOnFocus: false,
        dedupingInterval: 60000, // 1 minute
      }}
    >
      {children}
    </SWRConfig>
  );
}