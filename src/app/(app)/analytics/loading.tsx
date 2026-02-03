export default function AnalyticsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="bg-bg-muted h-8 w-36 rounded" />
        <div className="bg-bg-muted h-4 w-56 rounded" />
      </div>

      {/* Spending over time chart */}
      <div className="bg-bg-muted h-[350px] rounded-lg" />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="bg-bg-muted h-24 rounded-lg" />
        ))}
      </div>

      {/* Two-column grid: pie chart + currency breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-bg-muted h-64 rounded-lg" />
        <div className="bg-bg-muted h-64 rounded-lg" />
      </div>
    </div>
  );
}
