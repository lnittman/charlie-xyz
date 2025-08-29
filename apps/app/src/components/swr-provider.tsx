"use client";

import { useRef } from "react";
import { SWRConfig } from "swr";
import type { SWRConfiguration } from "swr";

interface SWRProviderProps {
  children: React.ReactNode;
  fallback?: Record<string, any>;
}

// Custom fetcher that handles authentication and errors
const fetcher = async (url: string) => {
  const res = await fetch(url, {
    credentials: 'include',
  });
  
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    throw error;
  }
  
  return res.json();
};

export function SWRProvider({ children, fallback = {} }: SWRProviderProps) {
  // SWR configuration with optimizations
  const config: SWRConfiguration = {
    fallback,
    fetcher,
    // Prevent refetch on mount when we have server data
    revalidateOnMount: false,
    // Still allow focus revalidation for updates
    revalidateOnFocus: true,
    // Reconnect revalidation is useful
    revalidateOnReconnect: true,
    // Increase deduping interval to prevent rapid fetches
    dedupingInterval: 5000,
    // Keep stale data while revalidating
    keepPreviousData: true,
    // Error retry configuration
    errorRetryInterval: 5000,
    errorRetryCount: 3,
    // Disable automatic revalidation interval by default
    refreshInterval: 0,
  };

  return (
    <SWRConfig value={config}>
      {children}
    </SWRConfig>
  );
}