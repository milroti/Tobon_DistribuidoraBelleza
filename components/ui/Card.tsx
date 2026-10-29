import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  hoverable?: boolean;
}

const paddingStyles = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export function Card({
  children,
  padding = "md",
  hoverable = false,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`
        bg-surface-container-lowest rounded-xl border border-outline-variant/40
        shadow-[0_4px_20px_-2px_rgba(181,51,107,0.05)]
        ${paddingStyles[padding]}
        ${hoverable ? "transition-shadow hover:shadow-[0_8px_28px_-4px_rgba(181,51,107,0.08)] cursor-pointer" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
