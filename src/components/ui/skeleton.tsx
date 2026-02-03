function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={`bg-border-subtle animate-pulse rounded-md ${className ?? ""}`}
      {...props}
    />
  );
}

export { Skeleton };
