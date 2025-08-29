"use client";

import { useState } from "react";
import Link from "next/link";
import { useRadarList, useDeleteRadar, useRefreshRadar } from "@/hooks/use-radar";
import { Spinner } from "@repo/design/components/spinner";
import { Pill, PillIndicator } from "@repo/design/components/pill";
import { Status, StatusIndicator } from "@repo/design/components/status";
import { TimeAgo } from "@repo/design/components/relative-time";
import { 
  Glimpse, 
  GlimpseContent, 
  GlimpseTrigger, 
  GlimpseTitle, 
  GlimpseDescription 
} from "@repo/design/components/glimpse";

export default function RadarList() {
  const { radars, isLoading } = useRadarList();
  const [selectedRadarId, setSelectedRadarId] = useState<string | null>(null);
  
  const { deleteRadar, isDeleting } = useDeleteRadar();
  const { refreshRadar, isRefreshing } = useRefreshRadar();

  const handleDelete = async (radarId: string) => {
    if (!confirm("Are you sure you want to delete this radar?")) return;
    setSelectedRadarId(radarId);
    try {
      await deleteRadar({ id: radarId as any });
      setSelectedRadarId(null);
    } catch (error) {
      console.error("Failed to delete radar:", error);
    }
  };

  const handleRefresh = async (radarId: string) => {
    setSelectedRadarId(radarId);
    try {
      await refreshRadar({ id: radarId as any });
      setSelectedRadarId(null);
    } catch (error) {
      console.error("Failed to refresh radar:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner variant="ring" size="lg" />
      </div>
    );
  }

  if (radars.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted mb-4">No radars yet</p>
        <Link href="/" className="button-primary">
          Create Your First Radar
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {radars.map((radar) => (
        <div
          key={radar._id}
          className="card-minimal hover:shadow-lg transition-all duration-300"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Glimpse>
                  <GlimpseTrigger asChild>
                    <Link href={`/radar/${radar._id}`}>
                      <h3 className="text-lg font-semibold hover:text-stone-600 dark:hover:text-stone-400 transition-colors cursor-pointer">
                        {radar.query}
                      </h3>
                    </Link>
                  </GlimpseTrigger>
                  <GlimpseContent side="right">
                    <GlimpseTitle>{radar.query}</GlimpseTitle>
                    <GlimpseDescription>
                      Ping frequency: {radar.pollInterval} •
                      Status: {radar.status}
                    </GlimpseDescription>
                  </GlimpseContent>
                </Glimpse>
                <Status status={isRadarActive(radar.lastPolledAt || null) ? "online" : "offline"}>
                  <StatusIndicator />
                </Status>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted">
            <Pill variant="secondary">
              <PillIndicator
                color="blue"
                pulse={isRadarActive(radar.lastPolledAt || null)}
              />
              <span className="capitalize">{radar.pollInterval}</span>
            </Pill>
            <span>•</span>
            <span>Active monitoring</span>
          </div>
          
          <div className="mt-2 text-xs text-subtle flex items-center gap-1">
            <span>Created</span>
            <TimeAgo date={new Date(radar._creationTime)} />
            {radar.lastPolledAt && (
              <>
                <span>•</span>
                <span>Last pinged</span>
                <TimeAgo date={new Date(radar.lastPolledAt)} />
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function isRadarActive(lastPolled: number | null): boolean {
  if (!lastPolled) return false;
  const lastPoll = new Date(lastPolled);
  const now = new Date();
  const hoursSinceLastPoll = (now.getTime() - lastPoll.getTime()) / (1000 * 60 * 60);
  return hoursSinceLastPoll < 24; // Consider active if polled within last 24 hours
}