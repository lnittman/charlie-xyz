import { z } from 'zod';

// Shared generative UI schema for interpreting user input into a Radar config
export const generativeUISchema = z.object({
  what: z.object({
    topic: z.string().describe('The formalized title for the radar'),
    description: z.string().describe('What will be tracked and monitored'),
    isValid: z.boolean().describe('Whether this is a valid radar topic'),
    confidence: z.number().min(0).max(1).describe('Confidence in interpretation'),
  }),
  when: z.object({
    frequency: z.enum(['hourly', 'daily', 'weekly', 'monthly']),
    schedule: z.string().optional().describe('Human-readable schedule'),
    notifyCondition: z.enum(['always', 'significant_change', 'threshold', 'never']),
    options: z.array(z.object({
      label: z.string().describe('Human-readable option label'),
      value: z.string().describe('Value to store when selected'),
      isRecommended: z.boolean().describe('Whether this is the recommended option'),
    })).length(3).describe('Exactly three contextual notification options'),
  }),
  why: z.object({
    intent: z.string().describe('Concise 1-2 sentence explanation of why to track this'),
    suggestedInsights: z.array(z.string()).max(3).describe('What insights they might gain'),
  }),
});

export type GenerativeUIInterpretation = z.infer<typeof generativeUISchema>;