export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="bg-bg-muted h-8 w-48 rounded" />
        <div className="bg-bg-muted h-4 w-32 rounded" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-bg-muted h-24 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-bg-muted h-64 rounded-lg" />
        <div className="bg-bg-muted h-64 rounded-lg" />
      </div>
    </div>
  );
}
