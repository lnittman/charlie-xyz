"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog } from "../dialog";
import { Badge } from "../badge";
import { cn } from "../../lib/utils";
import { CheckCircle2, Circle, Clock, AlertCircle, ChevronRight, Loader2 } from "lucide-react";

export interface WorkflowStep {
  id: string;
  name: string;
  description?: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt?: string;
  completedAt?: string;
  output?: any;
  error?: string;
}

export interface WorkflowMetadata {
  id: string;
  name: string;
  description?: string;
  createdBy?: string;
  version?: string;
  humanReadable?: {
    title: string;
    description: string;
    steps: Array<{
      id: string;
      title: string;
      description: string;
      icon?: string;
    }>;
  };
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt: string;
  completedAt?: string;
  steps: WorkflowStep[];
  result?: any;
  error?: string;
  metadata?: WorkflowMetadata;
}

interface WorkflowVisualizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  run: WorkflowRun | null;
  onRefresh?: () => void;
}

const statusIcons = {
  pending: Circle,
  running: Loader2,
  completed: CheckCircle2,
  failed: AlertCircle,
};

const statusColors = {
  pending: "text-gray-400",
  running: "text-blue-500",
  completed: "text-green-500",
  failed: "text-red-500",
};

export function WorkflowVisualizationModal({
  isOpen,
  onClose,
  run,
  onRefresh,
}: WorkflowVisualizationModalProps) {
  if (!run) return null;

  const metadata = run.metadata;
  const isRunning = run.status === "running";

  // Auto-refresh while running
  React.useEffect(() => {
    if (isRunning && onRefresh) {
      const interval = setInterval(onRefresh, 2000);
      return () => clearInterval(interval);
    }
  }, [isRunning, onRefresh]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold">
              {metadata?.humanReadable?.title || metadata?.name || "Workflow Run"}
            </h2>
            <Badge
              variant={
                run.status === "completed"
                  ? "default"
                  : run.status === "failed"
                  ? "destructive"
                  : run.status === "running"
                  ? "secondary"
                  : "outline"
              }
            >
              {run.status}
            </Badge>
          </div>
          {metadata?.humanReadable?.description && (
            <p className="text-sm text-muted-foreground">
              {metadata.humanReadable.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>Run ID: {run.id.slice(0, 8)}</span>
            <span>•</span>
            <span>Started: {new Date(run.startedAt).toLocaleTimeString()}</span>
            {run.completedAt && (
              <>
                <span>•</span>
                <span>
                  Duration:{" "}
                  {Math.round(
                    (new Date(run.completedAt).getTime() -
                      new Date(run.startedAt).getTime()) /
                      1000
                  )}
                  s
                </span>
              </>
            )}
          </div>
        </div>

        {/* Steps Visualization */}
        <div className="space-y-4">
          {run.steps.map((step, index) => {
            const stepMetadata = metadata?.humanReadable?.steps?.find(
              (s) => s.id === step.id
            );
            const Icon = statusIcons[step.status];
            const isLastStep = index === run.steps.length - 1;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="relative">
                  {/* Connection Line */}
                  {!isLastStep && (
                    <div className="absolute left-5 top-10 w-0.5 h-16 bg-border" />
                  )}

                  {/* Step Card */}
                  <div
                    className={cn(
                      "flex gap-4 p-4 rounded-lg border bg-card",
                      step.status === "running" && "border-blue-500",
                      step.status === "failed" && "border-red-500"
                    )}
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center bg-background border-2",
                          statusColors[step.status],
                          step.status === "completed" && "border-green-500 bg-green-50 dark:bg-green-950",
                          step.status === "running" && "border-blue-500 bg-blue-50 dark:bg-blue-950",
                          step.status === "failed" && "border-red-500 bg-red-50 dark:bg-red-950"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-5 h-5",
                            step.status === "running" && "animate-spin"
                          )}
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">
                          {stepMetadata?.title || step.name}
                        </h3>
                        {step.status === "running" && (
                          <Badge variant="secondary" className="text-xs">
                            Running...
                          </Badge>
                        )}
                      </div>
                      {(stepMetadata?.description || step.description) && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {stepMetadata?.description || step.description}
                        </p>
                      )}

                      {/* Timing */}
                      {step.startedAt && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(step.startedAt).toLocaleTimeString()}</span>
                          {step.completedAt && (
                            <>
                              <ChevronRight className="w-3 h-3" />
                              <span>
                                {Math.round(
                                  (new Date(step.completedAt).getTime() -
                                    new Date(step.startedAt).getTime()) /
                                    1000
                                )}
                                s
                              </span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Error */}
                      {step.error && (
                        <div className="mt-2 p-2 rounded bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                          <p className="text-sm text-red-600 dark:text-red-400">
                            {step.error}
                          </p>
                        </div>
                      )}

                      {/* Output Preview */}
                      {step.output && step.status === "completed" && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            View output
                          </summary>
                          <pre className="mt-2 p-2 rounded bg-muted text-xs overflow-auto max-h-32">
                            {JSON.stringify(step.output, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Result */}
        {run.status === "completed" && run.result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 p-4 rounded-lg border bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
          >
            <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">
              Workflow Result
            </h3>
            <pre className="text-xs overflow-auto max-h-40 text-green-800 dark:text-green-200">
              {JSON.stringify(run.result, null, 2)}
            </pre>
          </motion.div>
        )}

        {/* Error */}
        {run.status === "failed" && run.error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 p-4 rounded-lg border bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
          >
            <h3 className="font-medium text-red-900 dark:text-red-100 mb-2">
              Workflow Error
            </h3>
            <p className="text-sm text-red-800 dark:text-red-200">{run.error}</p>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6">
          {isRunning && onRefresh && (
            <button
              onClick={onRefresh}
              className="px-4 py-2 text-sm font-medium text-primary hover:text-primary/80"
            >
              Refresh
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Close
          </button>
        </div>
      </div>
    </Dialog>
  );
}