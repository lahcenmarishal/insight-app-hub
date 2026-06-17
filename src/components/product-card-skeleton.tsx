export function ProductCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border overflow-hidden flex flex-col">
      <div className="h-36 sm:h-40 w-full shimmer" />
      <div className="p-3 sm:p-4 flex flex-col gap-2">
        <div className="h-2.5 w-1/2 rounded shimmer" />
        <div className="h-3.5 w-full rounded shimmer" />
        <div className="h-3.5 w-3/4 rounded shimmer mb-2" />
        <div className="flex gap-2 mt-1">
          <div className="h-8 flex-1 rounded-lg shimmer" />
          <div className="h-8 w-16 rounded-lg shimmer" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}