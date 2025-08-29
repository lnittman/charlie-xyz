"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkle } from "lucide-react";
import { useInterpretation, useInterpretationSuggestions } from "@/hooks/use-interpretation";
import { useCreateRadar } from "@/hooks/use-radar";

export default function RadarInput() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const { interpret, isInterpreting, interpretation } = useInterpretation();
  const { createRadar, isCreating } = useCreateRadar();
  const { suggestions, relatedTopics } = useInterpretationSuggestions(input, 300);

  const isProcessing = isInterpreting || isCreating;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    try {
      // First interpret the input
      const result = await interpret({ input: input.trim() });
      
      // Then create a radar with the interpreted topic
      const radar = await createRadar({
        query: result.suggestedTopic || input.trim(),
        pollInterval: 'DAILY'
      });

      // Navigate to the new radar
      router.push(`/radar/${radar.id}`);
    } catch (error) {
      console.error('Error creating radar:', error);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowSuggestions(e.target.value.length > 2);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(input.length > 2)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="What would you like to track?"
            className="input-primary min-h-[100px] resize-none text-lg pr-12"
            disabled={isProcessing}
          />
          
          {/* Processing indicator */}
          {isProcessing && (
            <div className="absolute bottom-3 right-3">
              <Sparkle className="w-5 h-5 text-muted animate-pulse" />
            </div>
          )}
          
          {/* Character count */}
          <div className="absolute bottom-1 right-0 text-xs text-subtle">
            {input.length}/500
          </div>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 card-minimal max-h-60 overflow-y-auto z-10">
            <div className="p-2">
              <p className="text-xs font-medium text-muted px-2 py-1">Suggestions</p>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 rounded hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            
            {relatedTopics.length > 0 && (
              <div className="p-2 border-t divider-light">
                <p className="text-xs font-medium text-muted px-2 py-1">Related topics</p>
                {relatedTopics.map((topic, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(topic)}
                    className="w-full text-left px-3 py-2 rounded hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-sm"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-4 items-center">
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="button-primary"
          >
            {isProcessing ? (
              <>
                <Sparkle className="w-4 h-4 mr-2 animate-pulse" />
                Processing...
              </>
            ) : (
              'Create radar'
            )}
          </button>
          
          {interpretation && (
            <p className="text-sm text-muted animate-fade-in">
              Understood as: <span className="font-medium">{interpretation.suggestedTopic}</span>
            </p>
          )}
        </div>
      </form>
    </div>
  );
}