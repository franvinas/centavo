export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-bg-primary flex min-h-dvh items-center justify-center px-6">
      {children}
    </div>
  );
}
