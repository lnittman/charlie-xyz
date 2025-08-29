"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Check } from "@phosphor-icons/react";
import Balancer from "react-wrap-balancer";
import { useGenerativeInterpretation } from "@/hooks/use-generative-interpretation";
import { useCreateRadar } from "@/hooks/use-radar";
import { useDebounce } from "@/hooks/use-debounce";
import { Spinner } from "@repo/design/components/spinner";
import { Skeleton } from "@repo/design/components/skeleton";
import { cn } from "@/lib/utils";
import { SuggestionOffsetMarquee } from "@/components/suggestion-offset-marquee";
import type { SuggestionTile } from "@/components/radar-create-flow";

type GenerativeStep = "input" | "interpreting" | "review" | "creating" | "complete";

interface GenerativeField {
  label: string;
  value: string;
  description?: string;
  isEditing: boolean;
}

interface RadarCreateProps {
  trendingTopics?: SuggestionTile[];
  heroFontClass?: string;
  onInputChange?: (value: string) => void;
}

export default function RadarCreate({
  trendingTopics = [],
  heroFontClass,
  onInputChange
}: RadarCreateProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<GenerativeStep>("input");
  const [input, setInput] = useState("");
  const [lastInterpretedInput, setLastInterpretedInput] = useState("");

  // Debounce the input to trigger interpretation after user stops typing
  const debouncedInput = useDebounce(input, 800);

  // Generative fields
  const [whatField, setWhatField] = useState<GenerativeField>({
    label: "WHAT",
    value: "",
    description: "",
    isEditing: false,
  });

  const [whenField, setWhenField] = useState<GenerativeField>({
    label: "WHEN TO NOTIFY OF ANY UPDATES",
    value: "",
    description: "",
    isEditing: false,
  });

  const [notificationOptions, setNotificationOptions] = useState<Array<{
    label: string;
    value: string;
    isRecommended: boolean;
  }>>([]);

  const [whyContent, setWhyContent] = useState<{
    intent: string;
    insights: string[];
  } | null>(null);

  const { interpret, interpretation, partialInterpretation, isInterpreting, error: interpretError, stop } = useGenerativeInterpretation();
  const { createRadar, isCreating } = useCreateRadar();

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Trigger interpretation when debounced input changes
  useEffect(() => {
    const triggerInterpretation = async () => {
      // If input is empty, clear all fields and return to input state
      if (!debouncedInput.trim()) {
        if (step !== "input") {
          setStep("input");
          setLastInterpretedInput("");
          setWhatField({ ...whatField, value: "", description: "" });
          setWhenField({ ...whenField, value: "", description: "" });
          setNotificationOptions([]);
          setWhyContent(null);
          stop(); // Stop any ongoing streaming
        }
        return;
      }

      // If input changed while we're in review state, go back to input state
      if (debouncedInput.trim() !== lastInterpretedInput && (step === "review" || step === "interpreting")) {
        setStep("input");
        stop(); // Stop any ongoing streaming
        return;
      }

      if (debouncedInput.trim().length >= 3 && step === "input" && !isInterpreting) {
        setStep("interpreting");
        setLastInterpretedInput(debouncedInput.trim());

        try {
          interpret({ input: debouncedInput.trim() });
        } catch (error) {
          console.error('Error interpreting:', error);
          setStep("input");
        }
      }
    };

    triggerInterpretation();
  }, [debouncedInput, step, isInterpreting, interpret, stop]);

  // Handle streaming interpretation updates
  useEffect(() => {
    const currentInterpretation = interpretation || partialInterpretation;

    if (currentInterpretation && (step === "interpreting" || step === "review")) {
      // Update fields with interpretation (partial or complete)
      if (currentInterpretation.what) {
        setWhatField({
          label: "WHAT",
          value: currentInterpretation.what.topic || "",
          description: currentInterpretation.what.description || "",
          isEditing: false,
        });
      }

      // Set notification options from AI
      if (currentInterpretation.when) {
        if (currentInterpretation.when.options && currentInterpretation.when.options.length > 0) {
          setNotificationOptions(currentInterpretation.when.options);
          // Set the initial value to the recommended option
          const recommended = currentInterpretation.when.options.find(opt => opt.isRecommended);
          setWhenField({
            label: "WHEN TO NOTIFY OF ANY UPDATES",
            value: recommended?.value || currentInterpretation.when.options[0].value,
            description: currentInterpretation.when.schedule || "",
            isEditing: false,
          });
        } else {
          // Fallback to default behavior
          setWhenField({
            label: "WHEN TO NOTIFY OF ANY UPDATES",
            value: getFrequencyDisplay(currentInterpretation.when.frequency || "daily"),
            description: currentInterpretation.when.schedule || "",
            isEditing: false,
          });
        }
      }

      // Set why content if available
      if (currentInterpretation.why) {
        setWhyContent({
          intent: currentInterpretation.why.intent || "",
          insights: currentInterpretation.why.suggestedInsights || [],
        });
      }

      // Show review step when interpretation is complete
      if (interpretation && step === "interpreting") {
        setTimeout(() => setStep("review"), 200);
      }
    }
  }, [interpretation, partialInterpretation, step]);

  const handleInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Only proceed if we have a valid interpretation
    if (!interpretation || step !== "review") {
      return;
    }

    // Proceed to create the radar
    handleCreateRadar();
  };

  const handleCreateRadar = async () => {
    if (!interpretation) return;

    setStep("creating");

    try {
      const radarId = await createRadar({
        query: interpretation.what.topic,
        description: interpretation.what.description || undefined,
        pollInterval: interpretation.when.frequency.toUpperCase() as any,
      });

      setStep("complete");

      // Navigate after a brief celebration
      setTimeout(() => {
        router.push(`/radars/${radarId}`);
      }, 1000);
    } catch (error) {
      console.error('Error creating radar:', error);
      setStep("review");
    }
  };

  const getFrequencyDisplay = (frequency: string): string => {
    const displays: Record<string, string> = {
      realtime: "Whenever new information is available",
      hourly: "Every hour",
      daily: "Every day",
      weekly: "Every week on Monday at 10:00am",
      monthly: "Every month on the 1st",
    };
    return displays[frequency] || frequency;
  };

  const containerClass = "w-full flex flex-col items-center px-4";

  const isFormReady = interpretation && step === "review";
  const canSubmit = isFormReady && whatField.value && whenField.value && input.trim() === lastInterpretedInput;
  const showForm = step === "interpreting" || step === "review";
  const hasInput = input.trim().length > 0;

  return (
    <div className={containerClass}>
      <div className="w-full max-w-2xl mx-auto">
        {/* Prompt section - relative positioning */}
        <div className="flex flex-col items-center">
          <motion.div
            className="w-full"
            animate={{
              y: showForm ? -200 : hasInput ? -20 : 0
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >

            {/* Input form - always visible */}
            <motion.form
              onSubmit={handleInputSubmit}
              className="relative"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  onInputChange?.(e.target.value);
                }}
                placeholder="let me know"
                disabled={isInterpreting}
                className="w-full pl-6 pr-16 py-4 text-lg bg-transparent border-b border-border focus:border-foreground focus:outline-none transition-colors placeholder:text-muted-foreground"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={!canSubmit}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2",
                  "w-10 h-10 rounded-lg transition-all duration-300",
                  "flex items-center justify-center",
                  canSubmit
                    ? "bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 hover:border-red-500/40 active:scale-95 transition-all"
                    : "bg-transparent border border-muted/20 text-muted-foreground cursor-not-allowed"
                )}
              >
                <Target className="w-5 h-5" weight="duotone" />
              </button>
            </motion.form>

            {/* Show suggestion marquee when no input */}
            <motion.div
              animate={{
                opacity: !hasInput && !showForm && trendingTopics.length > 0 ? 1 : 0,
              }}
              transition={{
                duration: 0.3,
                delay: !hasInput && !showForm ? 0.5 : 0
              }}
              className="mt-4"
            >
              {trendingTopics.length > 0 && (
                <SuggestionOffsetMarquee
                  suggestions={trendingTopics}
                  onSelect={(suggestion) => {
                    setInput(suggestion.title);
                    onInputChange?.(suggestion.title);
                  }}
                />
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* Generated form content - only render when actually showing form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              className="absolute inset-x-0"
              style={{ top: 'calc(50% - 168px)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0
              }}
              exit={{
                opacity: 0,
                y: -10
              }}
              transition={{
                duration: 0.2,
                ease: "easeOut"
              }}
            >
              <div className="space-y-6">
                {/* What Field */}
                <div className="space-y-2">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <Target className="w-6 h-6 text-red-500" weight="duotone" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-muted-foreground">
                        WHAT TO TRACK
                      </div>
                      <div className="min-h-[24px]">
                        {step === "review" && whatField.value ? (
                          whatField.isEditing ? (
                            <input
                              type="text"
                              value={whatField.value}
                              onChange={(e) => setWhatField({ ...whatField, value: e.target.value })}
                              onBlur={() => setWhatField({ ...whatField, isEditing: false })}
                              className="w-full bg-transparent border-b border-muted focus:border-primary focus:outline-none"
                              autoFocus
                            />
                          ) : (
                            <div
                              onClick={() => setWhatField({ ...whatField, isEditing: true })}
                              className="cursor-text hover:text-primary transition-colors"
                            >
                              {whatField.value}
                            </div>
                          )
                        ) : partialInterpretation?.what?.topic ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            {partialInterpretation.what.topic}
                          </motion.div>
                        ) : (
                          <Skeleton className="h-6 w-48" />
                        )}
                      </div>
                      {(step === "review" && whatField.description) || partialInterpretation?.what?.description ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className="text-sm text-muted-foreground mt-1"
                        >
                          {step === "review" ? whatField.description : partialInterpretation?.what?.description}
                        </motion.div>
                      ) : showForm && (
                        <Skeleton className="h-4 w-64 mt-1" />
                      )}
                    </div>
                  </div>
                </div>

                {/* When Field */}
                <div className="space-y-2">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-slate-500/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-muted-foreground">
                        WHEN TO NOTIFY OF ANY UPDATES
                      </div>
                      {step === "review" && notificationOptions.length > 0 ? (
                        <div className="space-y-2 mt-2">
                          {notificationOptions.map((option, index) => (
                            <label key={index} className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="radio"
                                name="frequency"
                                checked={whenField.value === option.value}
                                onChange={() => setWhenField({ ...whenField, value: option.value })}
                                className="w-4 h-4"
                              />
                              <span className={option.isRecommended ? "font-medium" : ""}>
                                {option.label}
                                {option.isRecommended && (
                                  <span className="text-xs text-emerald-500 ml-2">(recommended)</span>
                                )}
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="min-h-[24px]">
                          {partialInterpretation?.when ? (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              {whenField.value || getFrequencyDisplay(partialInterpretation.when.frequency || "daily")}
                            </motion.div>
                          ) : (
                            <Skeleton className="h-6 w-32" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Why Section */}
                <div className="space-y-2">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-slate-500/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        WHY TRACK THIS
                      </div>
                      {whyContent?.intent || partialInterpretation?.why?.intent ? (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className="text-sm leading-relaxed"
                        >
                          {whyContent?.intent || partialInterpretation?.why?.intent}
                        </motion.p>
                      ) : (
                        <Skeleton className="h-4 w-full" />
                      )}
                      {(whyContent?.insights || partialInterpretation?.why?.suggestedInsights)?.length ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: 0.1 }}
                          className="mt-2 space-y-1"
                        >
                          {(whyContent?.insights || partialInterpretation?.why?.suggestedInsights || []).map((insight, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                              className="text-xs text-muted-foreground flex items-start gap-2"
                            >
                              <span className="text-red-500 mt-0.5">•</span>
                              <span>{insight}</span>
                            </motion.div>
                          ))}
                        </motion.div>
                      ) : showForm && (
                        <div className="mt-2 space-y-1">
                          <Skeleton className="h-3 w-48" />
                          <Skeleton className="h-3 w-56" />
                          <Skeleton className="h-3 w-44" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start over link - fixed at bottom */}
        {step === "review" && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 text-center pb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button
              type="button"
              onClick={() => {
                setStep("input");
                setInput("");
                setLastInterpretedInput("");
                setWhatField({ ...whatField, value: "", description: "" });
                setWhenField({ ...whenField, value: "", description: "" });
                setNotificationOptions([]);
                setWhyContent(null);
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              start over
            </button>
          </motion.div>
        )}

        {/* Creating/Complete states */}
        <AnimatePresence>
          {step === "creating" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50"
            >
              <div className="text-center space-y-4">
                <Spinner size="lg" />
                <p className="text-sm text-muted-foreground">Creating your radar...</p>
              </div>
            </motion.div>
          )}

          {step === "complete" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-emerald-500" weight="bold" />
                </div>
                <p className="text-sm text-muted-foreground">Radar created successfully!</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
