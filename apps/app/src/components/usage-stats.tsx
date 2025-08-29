"use client";

import { Activity, Eye, RefreshCw } from "lucide-react";

// Mock data - replace with actual API call
const stats = {
  activeRadars: { value: 12, change: 3, label: "Active radars" },
  totalOpinions: { value: 847, change: 124, label: "Total opinions" },
  refreshesUsed: { value: 5, limit: 10, label: "Refreshes today" },
};

export function UsageStats() {
  return (
    <>
      <div className="card-minimal flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-muted" />
            <p className="text-sm text-muted">{stats.activeRadars.label}</p>
          </div>
          <p className="text-2xl font-light">{stats.activeRadars.value}</p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            +{stats.activeRadars.change} from last week
          </p>
        </div>
      </div>

      <div className="card-minimal flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-4 h-4 text-muted" />
            <p className="text-sm text-muted">{stats.totalOpinions.label}</p>
          </div>
          <p className="text-2xl font-light">{stats.totalOpinions.value}</p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            +{stats.totalOpinions.change} this week
          </p>
        </div>
      </div>

      <div className="card-minimal flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <RefreshCw className="w-4 h-4 text-muted" />
            <p className="text-sm text-muted">{stats.refreshesUsed.label}</p>
          </div>
          <p className="text-2xl font-light">
            {stats.refreshesUsed.value}/{stats.refreshesUsed.limit}
          </p>
          <p className="text-xs text-muted mt-1">
            {stats.refreshesUsed.limit - stats.refreshesUsed.value} remaining
          </p>
        </div>
      </div>
    </>
  );
}