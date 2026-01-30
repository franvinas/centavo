export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded bg-bg-muted" />
        <div className="h-4 w-32 rounded bg-bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-bg-muted" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-64 rounded-lg bg-bg-muted" />
        <div className="h-64 rounded-lg bg-bg-muted" />
      </div>
    </div>
  );
}
