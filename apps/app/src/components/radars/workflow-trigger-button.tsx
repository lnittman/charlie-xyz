"use client";

import { useState } from "react";
import { Button } from "@repo/design";
import { WorkflowVisualizationModal, useWorkflowRun } from "@repo/design";
import { Loader2, Play, Eye } from "lucide-react";
import { useToast } from "@repo/design";

// Execute workflow function
async function executeWorkflow(workflowId: string, inputData: Record<string, any>) {
  const response = await fetch(`/api/workflows/${workflowId}/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(inputData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to execute workflow");
  }

  const data = await response.json();
  return data;
}

interface WorkflowTriggerButtonProps {
  workflowId: string;
  inputData: Record<string, any>;
  buttonText?: string;
  buttonVariant?: "default" | "outline" | "ghost" | "destructive";
  className?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

export function WorkflowTriggerButton({
  workflowId,
  inputData,
  buttonText = "run workflow",
  buttonVariant = "default",
  className,
  onSuccess,
  onError,
}: WorkflowTriggerButtonProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasCompletedOnce, setHasCompletedOnce] = useState(false);
  const { toast } = useToast();

  const { run, loading, error, refresh } = useWorkflowRun({
    workflowId: currentRunId ? workflowId : "",
    runId: currentRunId || "",
    autoRefresh: true,
  });

  // Handle workflow completion
  if (run && run.status === "completed" && currentRunId && !hasCompletedOnce) {
    setHasCompletedOnce(true);
    
    // Auto-refresh for specific workflows that update the UI
    if (workflowId === "generatePing") {
      setTimeout(() => window.location.reload(), 500);
    }
    
    if (onSuccess) {
      onSuccess(run.result);
    }
  }

  const handleExecute = async () => {
    setIsExecuting(true);
    setHasCompletedOnce(false);
    try {
      const { runId } = await executeWorkflow(workflowId, inputData);
      setCurrentRunId(runId);
      setIsModalOpen(true);
      
      toast.success("Workflow Started", {
        description: "Your workflow is now running. You can monitor its progress.",
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Failed to execute workflow");
      
      toast.error("Workflow Error", {
        description: err.message,
      });
      
      if (onError) {
        onError(err);
      }
    } finally {
      setIsExecuting(false);
    }
  };

  const handleViewLastRun = () => {
    if (currentRunId) {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          onClick={handleExecute}
          disabled={isExecuting}
          variant={buttonVariant}
          className={className}
        >
          {isExecuting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              {buttonText}
            </>
          )}
        </Button>

        {currentRunId && !isExecuting && (
          <Button
            onClick={handleViewLastRun}
            variant="outline"
            size="icon"
            title="View last run"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </div>

      <WorkflowVisualizationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        run={run}
        onRefresh={refresh}
      />
    </>
  );
}