"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/design";
import { Badge } from "@repo/design";
import { cn } from "@repo/design";
import { 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  Clock, 
  ChevronRight,
  FileText,
  Zap,
  Mail
} from "lucide-react";
import type { WorkflowRun } from "@repo/design";

interface WorkflowRunViewerProps {
  run: WorkflowRun;
  className?: string;
}

const statusConfig = {
  pending: {
    icon: Circle,
    color: "text-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-950",
    borderColor: "border-gray-200 dark:border-gray-800",
    label: "Pending",
  },
  running: {
    icon: Zap,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950",
    borderColor: "border-blue-200 dark:border-blue-800",
    label: "Running",
  },
  completed: {
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-950",
    borderColor: "border-green-200 dark:border-green-800",
    label: "Completed",
  },
  failed: {
    icon: AlertCircle,
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-950",
    borderColor: "border-red-200 dark:border-red-800",
    label: "Failed",
  },
};

const workflowIcons: Record<string, any> = {
  generatePing: Mail,
};

export function WorkflowRunViewer({ run, className }: WorkflowRunViewerProps) {
  const metadata = run.metadata;
  const config = statusConfig[run.status];
  const WorkflowIcon = workflowIcons[run.workflowId] || FileText;

  // Calculate duration
  const duration = run.completedAt
    ? Math.round(
        (new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 1000
      )
    : null;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              config.bgColor,
              config.borderColor,
              "border"
            )}>
              <WorkflowIcon className={cn("w-5 h-5", config.color)} />
            </div>
            <div>
              <CardTitle className="text-lg">
                {metadata?.humanReadable?.title || metadata?.name || "Workflow Run"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {new Date(run.startedAt).toLocaleString()}
              </p>
            </div>
          </div>
          <Badge variant={
            run.status === "completed" ? "default" : 
            run.status === "failed" ? "destructive" : 
            "secondary"
          }>
            {config.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>{duration ? `${duration}s` : "In progress"}</span>
          </div>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">
            {run.steps.filter(s => s.status === "completed").length} of {run.steps.length} steps
          </span>
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {run.steps.map((step, index) => {
            const stepConfig = statusConfig[step.status];
            const StepIcon = stepConfig.icon;
            const stepMetadata = metadata?.humanReadable?.steps?.find(s => s.id === step.id);
            
            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg transition-colors",
                  step.status === "failed" && "bg-red-50/50 dark:bg-red-950/20"
                )}
              >
                <div className={cn("mt-0.5", stepConfig.color)}>
                  <StepIcon className="w-4 h-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {stepMetadata?.title || step.name}
                    </span>
                    {step.completedAt && step.startedAt && (
                      <span className="text-xs text-muted-foreground">
                        {Math.round(
                          (new Date(step.completedAt).getTime() - 
                           new Date(step.startedAt).getTime()) / 1000
                        )}s
                      </span>
                    )}
                  </div>
                  
                  {(stepMetadata?.description || step.description) && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {stepMetadata?.description || step.description}
                    </p>
                  )}
                  
                  {step.error && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {step.error}
                    </p>
                  )}
                </div>

                {index < run.steps.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-muted-foreground mt-0.5" />
                )}
              </div>
            );
          })}
        </div>

        {/* Result Summary */}
        {run.status === "completed" && run.result && (
          <div className={cn(
            "p-3 rounded-lg border",
            config.bgColor,
            config.borderColor
          )}>
            <h4 className="text-sm font-medium mb-1">Result</h4>
            {run.workflowId === "generatePing" && run.result.emailSent && (
              <p className="text-sm text-muted-foreground">
                Email sent successfully to {run.result.recipientCount || 1} recipient(s)
              </p>
            )}
          </div>
        )}

        {/* Error Summary */}
        {run.status === "failed" && run.error && (
          <div className={cn(
            "p-3 rounded-lg border",
            config.bgColor,
            config.borderColor
          )}>
            <h4 className="text-sm font-medium mb-1 text-red-600 dark:text-red-400">
              Error
            </h4>
            <p className="text-sm text-muted-foreground">{run.error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}