interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: "sm" | "md" | "lg" | "full" | "xl";
}

const roundedStyles = {
  sm: "rounded",
  md: "rounded-lg",
  lg: "rounded-xl",
  xl: "rounded-2xl",
  full: "rounded-full",
};

export function Skeleton({
  className = "",
  width,
  height,
  rounded = "md",
}: SkeletonProps) {
  return (
    <div
      className={`
        animate-pulse bg-surface-container-high
        ${roundedStyles[rounded]}
        ${className}
      `}
      style={{ width, height }}
      aria-hidden
    />
  );
}

/** Skeleton para una tarjeta de producto */
export function ProductCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 p-3 flex gap-3">
      <Skeleton className="w-20 h-20 shrink-0" rounded="lg" />
      <div className="flex-1 space-y-2 py-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between mt-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" rounded="full" />
        </div>
      </div>
    </div>
  );
}

/** Skeleton para una fila de tabla */
export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 py-3 px-4">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4 flex-1"
          width={i === 0 ? "40%" : undefined}
        />
      ))}
    </div>
  );
}
