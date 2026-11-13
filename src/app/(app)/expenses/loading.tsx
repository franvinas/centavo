export default function ExpensesLoading() {
  return (
    <div className="animate-pulse space-y-5 md:space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="bg-bg-muted h-8 w-36 rounded-lg" />
        <div className="bg-bg-muted h-4 w-48 rounded" />
      </div>

      {/* Filters row */}
      <div className="flex gap-3">
        <div className="bg-bg-muted h-10 flex-1 rounded-2xl" />
        <div className="bg-bg-muted h-10 w-32 rounded-2xl" />
      </div>

      {/* Expense list items */}
      <div className="space-y-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="bg-bg-muted h-16 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
