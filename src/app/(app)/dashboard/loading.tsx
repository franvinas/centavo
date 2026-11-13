export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-5 md:space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="bg-bg-muted h-8 w-48 rounded-lg" />
        <div className="bg-bg-muted h-4 w-32 rounded" />
      </div>

      {/* Metric card */}
      <div className="bg-bg-muted h-36 rounded-2xl md:h-32" />

      {/* Two-column grid: category breakdown + recent expenses */}
      <div className="grid gap-5 md:gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="bg-bg-muted h-64 rounded-2xl" />
        <div className="bg-bg-muted h-64 rounded-2xl" />
      </div>
    </div>
  );
}
