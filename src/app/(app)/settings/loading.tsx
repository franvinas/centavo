export default function SettingsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="bg-bg-muted h-8 w-32 rounded" />
        <div className="bg-bg-muted h-4 w-48 rounded" />
      </div>

      {/* Settings form fields */}
      <div className="bg-bg-surface shadow-card space-y-5 rounded-lg p-5">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-2">
            <div className="bg-bg-muted h-4 w-24 rounded" />
            <div className="bg-bg-muted h-10 w-full rounded-lg" />
          </div>
        ))}
        <div className="bg-bg-muted h-10 w-24 rounded-lg" />
      </div>
    </div>
  );
}
