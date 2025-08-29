"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkle } from "@phosphor-icons/react";
import { useGenerativeInterpretation } from "@/hooks/use-generative-interpretation";
import { useCreateRadar, useRadarList, type Radar } from "@/hooks/use-radar";
import { Spinner } from "@repo/design/components/spinner";
import { Pill } from "@repo/design/components/pill";
import { SuggestionOffsetMarquee } from "@/components/suggestion-offset-marquee";
import { cn } from "@/lib/utils";

export type SuggestionTile = {
  id: string;
  title: string;
  emoji?: string;
  category?: string;
  trending?: boolean;
  trendingChange?: number;
};
import { 
  AIInput, 
  AIInputTextarea, 
  AIInputToolbar, 
  AIInputTools, 
  AIInputSubmit 
} from "@repo/design/components/ai-input";
import { 
  AISuggestions, 
  AISuggestion 
} from "@repo/design/components/ai-suggestion";
import { DynamicSuggestions } from "@/components/dynamic-suggestions";

type FlowStep = "input" | "options" | "creating";

interface RadarOptions {
  frequency: "hourly" | "daily" | "weekly";
  notifications: boolean;
}

interface RadarCreateFlowProps {
  initialRadars?: Radar[];
  trendingTopics?: SuggestionTile[];
}

export default function RadarCreateFlow({ trendingTopics = [] }: RadarCreateFlowProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const [step, setStep] = useState<FlowStep>("input");
  const [input, setInput] = useState("");
  const [options, setOptions] = useState<RadarOptions>({
    frequency: "daily",
    notifications: false,
  });
  
  const { interpret, interpretation, isInterpreting, error } = useGenerativeInterpretation();
  const { createRadar, isCreating } = useCreateRadar();

  // Use provided suggestion tiles
  const suggestionTiles: SuggestionTile[] = trendingTopics;

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isInterpreting) return;

    // Start the interpretation
    interpret({ input: input.trim() });
  };

  // Watch for interpretation completion
  useEffect(() => {
    if (interpretation && !isInterpreting && step === "input") {
      // Set recommended frequency if provided
      if (interpretation.when?.frequency) {
        // Map unsupported frequencies to supported ones
        const mappedFrequency = interpretation.when.frequency === "monthly"
          ? "weekly"
          : interpretation.when.frequency as "hourly" | "daily" | "weekly";
        
        setOptions(prev => ({
          ...prev,
          frequency: mappedFrequency
        }));
      }
      setStep("options");
    }
  }, [interpretation, isInterpreting, step]);

  const handleCreateRadar = async () => {
    if (!interpretation) return;
    
    setStep("creating");
    
    try {
      const radar = await createRadar({
        query: interpretation.what?.topic || input.trim(),
        initialPosition: 'neutral',
        // Map UI freq to backend enum
        pollInterval: options.frequency.toUpperCase() as 'HOURLY' | 'DAILY' | 'WEEKLY',
        notifications: options.notifications,
      });

      // Navigate to the new radar
      router.push(`/radars/${radar.id}`);
    } catch (error) {
      console.error('Error creating radar:', error);
      setStep("options");
    }
  };

  const handleSuggestionSelect = async (suggestion: SuggestionTile) => {
    // Smooth autofill animation
    const targetText = suggestion.title;
    const chars = targetText.split('');
    setInput('');
    
    // Focus the input first
    inputRef.current?.focus();
    
    // Animate typing effect
    for (let i = 0; i < chars.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 20));
      setInput(prev => prev + chars[i]);
    }
    
    // Small delay before auto-submit for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Auto-submit the form
    const form = inputRef.current?.closest('form');
    if (form) {
      form.requestSubmit();
    }
  };


  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {step === "input" && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="space-y-6">
              <form onSubmit={handleInputSubmit} className="relative">
                <div className="relative bg-background border border-border rounded-2xl transition-all focus-within:border-foreground/20 focus-within:shadow-sm">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="What would you like to track?"
                    disabled={isInterpreting}
                    className="w-full resize-none bg-transparent px-4 py-3.5 text-base placeholder:text-muted-foreground focus:outline-none min-h-[56px] max-h-[200px]"
                    style={{ height: 'auto' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleInputSubmit(e);
                      }
                    }}
                  />
                  <div className="absolute right-2 bottom-2">
                    <button
                      type="submit"
                      disabled={!input.trim() || isInterpreting}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                        "flex items-center gap-1.5",
                        input.trim() && !isInterpreting
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "bg-muted text-muted-foreground cursor-not-allowed"
                      )}
                    >
                      {isInterpreting ? (
                        <>
                          <Spinner variant="dots" size="sm" />
                          <span>Thinking...</span>
                        </>
                      ) : (
                        <>
                          <span>Ping</span>
                          <Sparkle className="w-3.5 h-3.5" weight="fill" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* Dynamic suggestions based on typing */}
              <DynamicSuggestions 
                input={input} 
                onSelect={(suggestion) => {
                  setInput(suggestion);
                  // Auto-submit after a short delay
                  setTimeout(() => {
                    const form = inputRef.current?.closest('form');
                    if (form) {
                      form.requestSubmit();
                    }
                  }, 100);
                }}
              />

              {/* Show suggestion marquee when no input */}
              {!input && suggestionTiles.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">Suggestions based on your interests</p>
                  <SuggestionOffsetMarquee
                    suggestions={suggestionTiles}
                    onSelect={handleSuggestionSelect}
                  />
                </div>
              )}

              {/* Real-time interpretation preview */}
              {isInterpreting && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-2 text-sm text-muted"
                >
                  <Spinner variant="dots" size="sm" />
                  <span>Understanding your request...</span>
                </motion.div>
              )}

              {/* Error message */}
              {error && !isInterpreting && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-500 text-center"
                >
                  {error.message || "Failed to interpret your request. Please try again."}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {step === "options" && interpretation && (
          <motion.div
            key="options"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* Topic confirmation */}
            <div className="card-minimal">
              <h3 className="text-sm font-medium text-muted mb-2">Tracking</h3>
              <p className="text-lg font-medium">{interpretation.what?.topic || input}</p>
              {interpretation.what?.description && (
                <p className="text-sm text-muted mt-2">{interpretation.what.description}</p>
              )}
            </div>

            {/* Options */}
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2 block">Update frequency</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["hourly", "daily", "weekly"] as const).map((freq) => {
                    const isRecommended = interpretation.when?.frequency === freq;
                    return (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => setOptions(prev => ({ ...prev, frequency: freq }))}
                        className={`
                          py-2 px-4 rounded-lg capitalize transition-all font-medium relative
                          ${options.frequency === freq 
                            ? "bg-stone-900 text-stone-50 dark:bg-stone-50 dark:text-stone-900" 
                            : "bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
                          }
                        `}
                      >
                        {freq}
                        {isRecommended && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.notifications}
                    onChange={(e) => setOptions(prev => ({ ...prev, notifications: e.target.checked }))}
                    className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                  />
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                    Notify me of significant changes
                  </span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setStep("input")}
                className="px-5 py-2.5 text-stone-700 dark:text-stone-300 font-medium rounded-lg 
                         hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCreateRadar}
                className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg 
                         hover:bg-green-700 transition-colors group flex items-center gap-2"
              >
                Ping
                <Sparkle className="w-4 h-4" weight="duotone" />
              </button>
            </div>
          </motion.div>
        )}

        {step === "creating" && (
          <motion.div
            key="creating"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center py-12"
          >
            <div className="mb-4">
              <Spinner variant="ring" size="lg" />
            </div>
            <h3 className="text-lg font-medium mb-2">Pinging...</h3>
            <p className="text-sm text-muted">Gathering initial signals</p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}