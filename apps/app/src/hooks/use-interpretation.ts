import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

export interface Interpretation {
  id: string;
  input: string;
  interpretation: string;
  suggestedTopic: string;
  confidence: number;
  entities: Entity[];
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  categories: string[];
  createdAt: string;
}

export interface Entity {
  text: string;
  type: 'person' | 'organization' | 'location' | 'concept' | 'other';
  relevance: number;
}

export interface InterpretationRequest {
  input: string;
  context?: string;
  language?: string;
}

// Fetcher function for interpretation
const interpretInput = async (url: string, { arg }: { arg: InterpretationRequest }) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  });
  if (!response.ok) throw new Error('Failed to interpret input');
  return response.json();
};

// Hook to get interpretation history
export function useInterpretationHistory(limit: number = 10) {
  const { data, error, isLoading, mutate } = useSWR<Interpretation[]>(
    `/api/interpretations?limit=${limit}`,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    interpretations: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook to interpret user input
export function useInterpretation() {
  const { trigger, data, error, isMutating } = useSWRMutation(
    '/api/ai/interpret',
    interpretInput
  );

  return {
    interpret: trigger,
    interpretation: data,
    isInterpreting: isMutating,
    error,
  };
}

// Hook for real-time interpretation suggestions
export function useInterpretationSuggestions(
  input: string, 
  debounceMs: number = 500,
  fallbackData?: { suggestions: string[]; relatedTopics: string[] }
) {
  const { data, error, isLoading } = useSWR<{
    suggestions: string[];
    relatedTopics: string[];
  }>(
    input.length > 2 ? `/api/interpretations/suggestions?q=${encodeURIComponent(input)}` : null,
    {
      fallbackData,
      dedupingInterval: debounceMs,
      revalidateOnFocus: false,
    }
  );

  return {
    suggestions: data?.suggestions || [],
    relatedTopics: data?.relatedTopics || [],
    isLoading,
    isError: error,
  };
}

// Hook to get trending interpretations
export function useTrendingInterpretations() {
  const { data, error, isLoading } = useSWR<{
    trending: {
      topic: string;
      count: number;
      sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
      growth: number;
    }[];
  }>(
    '/api/interpretations/trending',
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
    }
  );

  return {
    trending: data?.trending || [],
    isLoading,
    isError: error,
  };
}

// Hook for interpretation analytics
export function useInterpretationAnalytics(timeframe: 'day' | 'week' | 'month' = 'week') {
  const { data, error, isLoading } = useSWR<{
    totalInterpretations: number;
    averageConfidence: number;
    sentimentDistribution: {
      positive: number;
      negative: number;
      neutral: number;
      mixed: number;
    };
    topCategories: {
      category: string;
      count: number;
    }[];
    topEntities: {
      entity: string;
      type: string;
      count: number;
    }[];
  }>(
    `/api/interpretations/analytics?timeframe=${timeframe}`,
    {
      refreshInterval: 300000, // Refresh every 5 minutes
      revalidateOnFocus: false,
    }
  );

  return {
    analytics: data,
    isLoading,
    isError: error,
  };
}