export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="yutori-skeleton h-32 rounded-lg" />
      ))}
    </div>
  );
}

export function RadarDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-4">
        <div className="yutori-skeleton h-10 w-3/4 rounded" />
        <div className="yutori-skeleton h-6 w-1/2 rounded" />
      </div>
    </div>
  );
}


export function TrendChartSkeleton() {
  return (
    <div className="p-6 yutori-card">
      <div className="space-y-4">
        <div className="yutori-skeleton h-6 w-48 rounded" />
        <div className="yutori-skeleton h-64 w-full rounded" />
        <div className="flex justify-center gap-4">
          <div className="yutori-skeleton h-4 w-24 rounded" />
          <div className="yutori-skeleton h-4 w-24 rounded" />
          <div className="yutori-skeleton h-4 w-24 rounded" />
        </div>
      </div>
    </div>
  );
}

export function PricingCardSkeleton() {
  return (
    <div className="p-6 yutori-card space-y-6">
      <div className="space-y-2">
        <div className="yutori-skeleton h-6 w-24 rounded" />
        <div className="yutori-skeleton h-10 w-32 rounded" />
      </div>
      
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="yutori-skeleton h-4 w-full rounded" />
        ))}
      </div>
      
      <div className="yutori-skeleton h-12 w-full rounded" />
    </div>
  );
}

export function RadarListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-4 border yutori-divider rounded-lg">
          <div className="space-y-3">
            <div className="yutori-skeleton h-6 w-3/4 rounded" />
            <div className="flex gap-4">
              <div className="yutori-skeleton h-4 w-24 rounded" />
              <div className="yutori-skeleton h-4 w-24 rounded" />
              <div className="yutori-skeleton h-4 w-24 rounded" />
            </div>
            <div className="yutori-skeleton h-16 w-full rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}