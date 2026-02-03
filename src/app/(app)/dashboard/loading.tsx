export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="bg-bg-muted h-8 w-48 rounded" />
        <div className="bg-bg-muted h-4 w-32 rounded" />
      </div>

      {/* Metric card */}
      <div className="bg-bg-muted h-24 rounded-lg" />

      {/* Two-column grid: category breakdown + recent expenses */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-bg-muted h-64 rounded-lg" />
        <div className="bg-bg-muted h-64 rounded-lg" />
      </div>
    </div>
  );
}
