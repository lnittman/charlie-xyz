"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/design";
import { Badge } from "@repo/design";
import { Mail, Clock, CheckCircle, TrendingUp, TrendingDown } from "lucide-react";
import { TimeAgo } from "@repo/design/components/relative-time";
import Link from "next/link";

interface PingData {
  id: string;
  sentAt: string;
  frequency: string;
  metadata?: {
    opinionCount: number;
    sentiment: string;
    changeHighlights: string[];
  };
}

interface LatestPingCardProps {
  radarId: string;
  ping?: PingData | null;
}

export function LatestPingCard({ radarId, ping }: LatestPingCardProps) {
  if (!ping) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            No email updates sent yet. Configure your notification preferences to receive regular updates.
          </p>
          <Link
            href={`/radars/${radarId}/settings`}
            className="text-sm text-primary hover:underline"
          >
            Configure notifications →
          </Link>
        </CardContent>
      </Card>
    );
  }

  const sentimentColor = 
    ping.metadata?.sentiment === "positive" ? "text-green-600 dark:text-green-400" :
    ping.metadata?.sentiment === "negative" ? "text-red-600 dark:text-red-400" :
    "text-gray-600 dark:text-gray-400";

  const sentimentIcon = 
    ping.metadata?.sentiment === "positive" ? TrendingUp :
    ping.metadata?.sentiment === "negative" ? TrendingDown :
    null;

  const SentimentIcon = sentimentIcon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Latest Update
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {ping.frequency}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sent Time */}
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-muted-foreground">
            Sent <TimeAgo date={ping.sentAt} />
          </span>
        </div>

        {/* Summary Stats */}
        {ping.metadata && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-sm text-muted-foreground">Opinions</p>
              <p className="text-lg font-semibold">{ping.metadata.opinionCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sentiment</p>
              <div className="flex items-center gap-1">
                {SentimentIcon && <SentimentIcon className={`h-4 w-4 ${sentimentColor}`} />}
                <p className={`text-lg font-semibold capitalize ${sentimentColor}`}>
                  {ping.metadata.sentiment}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Change Highlights */}
        {ping.metadata?.changeHighlights && ping.metadata.changeHighlights.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Key Changes:</p>
            <ul className="space-y-1">
              {ping.metadata.changeHighlights.slice(0, 3).map((highlight, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-1">
                  <span className="text-primary mt-1">•</span>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* View History Link */}
        <div className="pt-2 border-t">
          <Link
            href={`/radar/${radarId}/runs`}
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            <Clock className="h-3 w-3" />
            View all updates
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}