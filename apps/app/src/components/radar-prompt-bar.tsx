"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Clock, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface RadarFormData {
  query: string;
  description: string;
  keywords: string[];
  pollInterval: "daily" | "twice_daily" | "weekly" | "monthly";
}

interface RadarPromptBarProps {
  onCreateRadar: (data: RadarFormData) => Promise<void>;
  initialRadars?: any[];
}

export function RadarPromptBar({ onCreateRadar, initialRadars = [] }: RadarPromptBarProps) {
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<RadarFormData>({
    query: "",
    description: "",
    keywords: [],
    pollInterval: "daily",
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const processPrompt = async () => {
    if (!prompt.trim()) return;
    
    setIsProcessing(true);
    
    try {
      // Call AI endpoint to process the prompt
      const response = await fetch("/api/ai/process-radar-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error("Failed to process prompt");

      const data = await response.json();
      
      // Update form data with AI suggestions
      setFormData({
        query: data.query || prompt,
        description: data.description || "",
        keywords: data.keywords || [],
        pollInterval: data.pollInterval || "daily",
      });
      
      setShowForm(true);
    } catch (error) {
      console.error("Error processing prompt:", error);
      // Fallback to basic form with prompt as query
      setFormData({
        query: prompt,
        description: "",
        keywords: [],
        pollInterval: "daily",
      });
      setShowForm(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    await onCreateRadar(formData);
    setPrompt("");
    setShowForm(false);
    setFormData({
      query: "",
      description: "",
      keywords: [],
      pollInterval: "daily",
    });
  };

  const pollIntervalOptions = [
    { value: "daily", label: "Daily", icon: "24h" },
    { value: "twice_daily", label: "Twice Daily", icon: "12h" },
    { value: "weekly", label: "Weekly", icon: "7d" },
    { value: "monthly", label: "Monthly", icon: "30d" },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              processPrompt();
            }
          }}
          placeholder="What opinions do you want to track?"
          className={cn(
            "w-full px-4 py-4 pr-12 text-lg rounded-2xl border transition-all duration-300",
            "bg-background/50 backdrop-blur-sm",
            "focus:outline-none focus:ring-2 focus:ring-primary/20",
            "placeholder:text-muted-foreground/60",
            showForm && "rounded-b-none border-b-0"
          )}
          disabled={isProcessing}
        />
        <button
          onClick={processPrompt}
          disabled={isProcessing || !prompt.trim()}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg",
            "text-muted-foreground hover:text-foreground",
            "transition-colors duration-300",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isProcessing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-5 w-5" />
            </motion.div>
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-6 border border-t-0 rounded-b-2xl bg-background/50 backdrop-blur-sm space-y-4">
              {/* Query Display */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">
                  Tracking
                </label>
                <div className="text-lg font-medium">{formData.query}</div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add context about what you're tracking..."
                  className="w-full px-3 py-2 rounded-lg border bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  rows={2}
                />
              </div>

              {/* Keywords */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  Keywords
                </label>
                <div className="flex flex-wrap gap-2">
                  {formData.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm rounded-full bg-primary/10 text-primary border border-primary/20"
                    >
                      {keyword}
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="Add keyword..."
                    className="px-3 py-1 text-sm rounded-full bg-transparent border border-dashed border-muted-foreground/30 focus:outline-none focus:border-primary/50"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value) {
                        e.preventDefault();
                        setFormData({
                          ...formData,
                          keywords: [...formData.keywords, e.currentTarget.value],
                        });
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                </div>
              </div>

              {/* Poll Interval */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Check for opinions
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {pollIntervalOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFormData({ ...formData, pollInterval: option.value as any })}
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                        "border hover:border-primary/50",
                        formData.pollInterval === option.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background/50 text-muted-foreground border-muted-foreground/20"
                      )}
                    >
                      <div>{option.label}</div>
                      <div className="text-xs opacity-70">{option.icon}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Start scouting
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setPrompt("");
                  }}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}