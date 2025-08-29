"use client";

import { useState, useEffect, useCallback } from "react";
import type { WorkflowRun } from "../components/workflow-visualization";

interface UseWorkflowRunOptions {
  workflowId: string;
  runId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useWorkflowRun({
  workflowId,
  runId,
  autoRefresh = true,
  refreshInterval = 2000,
}: UseWorkflowRunOptions) {
  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRun = useCallback(async () => {
    if (!workflowId || !runId) return;

    try {
      const response = await fetch(`/api/workflows/${workflowId}/runs/${runId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch workflow run: ${response.statusText}`);
      }

      const data = await response.json();
      setRun(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch workflow run");
    } finally {
      setLoading(false);
    }
  }, [workflowId, runId]);

  // Initial fetch
  useEffect(() => {
    fetchRun();
  }, [fetchRun]);

  // Auto-refresh for running workflows
  useEffect(() => {
    if (!autoRefresh || !run || run.status !== "running") return;

    const interval = setInterval(fetchRun, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, run, refreshInterval, fetchRun]);

  return {
    run,
    loading,
    error,
    refresh: fetchRun,
  };
}

// Mock function to simulate workflow execution
export async function executeWorkflow(
  workflowId: string,
  inputData: Record<string, any>
): Promise<{ runId: string }> {
  const response = await fetch(`/api/workflows/${workflowId}/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputData }),
  });

  if (!response.ok) {
    throw new Error(`Failed to execute workflow: ${response.statusText}`);
  }

  return response.json();
}