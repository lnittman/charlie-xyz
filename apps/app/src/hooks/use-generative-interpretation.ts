"use client";

import { experimental_useObject as useObject } from "@ai-sdk/react";
import { generativeUISchema, type GenerativeUIInterpretation } from "@/lib/generative-types";

interface UseGenerativeInterpretationReturn {
  interpret: (params: { input: string }) => void;
  interpretation: GenerativeUIInterpretation | undefined;
  partialInterpretation: Partial<GenerativeUIInterpretation> | undefined;
  isInterpreting: boolean;
  error: Error | undefined;
  stop: () => void;
}

export function useGenerativeInterpretation(): UseGenerativeInterpretationReturn {
  const { object, submit, isLoading, error, stop } = useObject({
    api: '/api/ai/interpret/start',
    schema: generativeUISchema as any, // Type mismatch between zod versions
  });

  const interpret = ({ input }: { input: string }) => {
    submit({
      messages: [
        {
          role: 'user',
          content: input
        }
      ]
    });
  };

  return {
    interpret,
    interpretation: object as GenerativeUIInterpretation | undefined,
    partialInterpretation: object as Partial<GenerativeUIInterpretation> | undefined,
    isInterpreting: isLoading,
    error,
    stop,
  };
}