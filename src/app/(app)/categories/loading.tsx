export default function CategoriesLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="bg-bg-muted h-8 w-36 rounded" />
        <div className="bg-bg-muted h-4 w-56 rounded" />
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="bg-bg-muted h-20 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
