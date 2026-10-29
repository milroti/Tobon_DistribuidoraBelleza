import type { ReactNode } from "react";

type BadgeVariant = "success" | "warning" | "danger" | "neutral" | "primary";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-success-light text-success-text",
  warning: "bg-warning-light text-warning-text",
  danger: "bg-danger-light text-danger-text",
  neutral: "bg-surface-container text-on-surface-variant",
  primary: "bg-primary-fixed text-on-primary-fixed",
};

const dotColors: Record<BadgeVariant, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-outline",
  primary: "bg-primary",
};

export function Badge({
  variant = "neutral",
  children,
  className = "",
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full
        text-xs font-semibold font-heading
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`}
          aria-hidden
        />
      )}
      {children}
    </span>
  );
}

/** Helper para badge de estado de stock */
export function StockBadge({ stock, minStock }: { stock: number; minStock: number }) {
  if (stock <= 0) return <Badge variant="danger" dot>Sin stock</Badge>;
  if (stock <= minStock) return <Badge variant="danger" dot>Crítico</Badge>;
  if (stock <= minStock * 2) return <Badge variant="warning" dot>Bajo</Badge>;
  return <Badge variant="success" dot>En stock</Badge>;
}
