"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useRadarList } from "@/hooks/use-radar";
import { Status, StatusIndicator, StatusLabel } from "@repo/design/components/status";
import { Pill, PillDelta, PillIcon } from "@repo/design/components/pill";
import { Spinner } from "@repo/design/components/spinner";
import { TimeAgo } from "@repo/design/components/relative-time";
import { Ticker, TickerNumber, TickerChange } from "@repo/design/components/ticker";
import { 
  Glimpse, 
  GlimpseContent, 
  GlimpseTrigger, 
  GlimpseTitle, 
  GlimpseDescription 
} from "@repo/design/components/glimpse";

export function RecentRadars() {
  const { radars, isLoading } = useRadarList();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner variant="dots" size="md" />
      </div>
    );
  }

  if (!radars || radars.length === 0) {
    return null;
  }

  // Take only the first 3 radars for recent display
  const recentRadars = radars.slice(0, 3);

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-muted">Your recent radars</h2>
      <div className="space-y-3">
        {recentRadars.map((radar) => (
          <Link
            key={radar.id}
            href={`/radars/${radar.id}`}
            className="block card-minimal p-4 hover-lift"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Glimpse>
                    <GlimpseTrigger asChild>
                      <h3 className="font-medium text-sm cursor-pointer hover:underline underline-offset-2">{radar.query}</h3>
                    </GlimpseTrigger>
                    <GlimpseContent>
                      <GlimpseTitle>{radar.query}</GlimpseTitle>
                      <GlimpseDescription>
                        {radar.description || `Tracking "${radar.query}" with ${radar.pollInterval.toLowerCase()} updates.`}
                      </GlimpseDescription>
                      <div className="mt-2 text-xs text-muted-foreground">
                        <p>Created <TimeAgo date={radar.createdAt} /></p>
                        <p>Polling {radar.pollInterval || "daily"}</p>
                      </div>
                    </GlimpseContent>
                  </Glimpse>
                  <Status status={isRadarActive(radar.lastPolled) ? "online" : "offline"}>
                    <StatusIndicator />
                    <StatusLabel />
                  </Status>
                </div>
                <p className="text-xs text-muted mt-1 flex items-center gap-1">
                  <span>Status: {radar.status.toLowerCase()}</span>
                  <span>•</span>
                  <span>Updated</span>
                  <TimeAgo date={radar.lastPolled || radar.createdAt} />
                </p>
              </div>
              {radar.trends && radar.trends.length > 0 && (
                <Ticker>
                  <TickerChange value={radar.trends[0].score} />
                </Ticker>
              )}
            </div>
          </Link>
        ))}
      </div>
      
      <Link
        href="/radars"
        className="inline-flex items-center text-sm link-subtle"
      >
        View all radars →
      </Link>
    </div>
  );
}

function isRadarActive(lastPolled: string | Date | undefined): boolean {
  if (!lastPolled) return false;
  const lastPoll = new Date(lastPolled);
  const now = new Date();
  const hoursSinceLastPoll = (now.getTime() - lastPoll.getTime()) / (1000 * 60 * 60);
  return hoursSinceLastPoll < 24; // Consider active if polled within last 24 hours
}