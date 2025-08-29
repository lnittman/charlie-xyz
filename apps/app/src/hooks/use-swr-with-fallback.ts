import useSWR, { useSWRConfig } from 'swr';
import type { SWRConfiguration } from 'swr';

/**
 * Custom hook that properly handles SWR with server-side fallback data
 * Prevents unnecessary refetches on mount when data is already available
 */
export function useSWRWithFallback<T = any>(
  key: string | null,
  fetcher?: (...args: any[]) => Promise<T>,
  options?: SWRConfiguration<T>
) {
  const { fallback } = useSWRConfig();
  
  // Check if we have fallback data for this key
  const hasFallbackData = key && fallback && key in fallback;
  
  // Merge options with optimizations when we have fallback data
  const optimizedOptions: SWRConfiguration<T> = {
    ...options,
    // Don't revalidate on mount if we have server data
    revalidateOnMount: hasFallbackData ? false : (options?.revalidateOnMount ?? true),
    // Don't revalidate if stale when we just got server data
    revalidateIfStale: hasFallbackData ? false : (options?.revalidateIfStale ?? true),
    // Keep the fallback data as initial data
    fallbackData: hasFallbackData ? fallback[key] : options?.fallbackData,
  };
  
  return useSWR<T>(key, fetcher || null, optimizedOptions);
}