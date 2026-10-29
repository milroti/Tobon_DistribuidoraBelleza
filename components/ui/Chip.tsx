"use client";

import type { ReactNode } from "react";
import { Icon } from "./Icon";

interface ChipProps {
  active?: boolean;
  icon?: string;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function Chip({
  active = false,
  icon,
  children,
  onClick,
  className = "",
}: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full
        text-sm font-medium whitespace-nowrap transition-all
        ${
          active
            ? "bg-primary text-on-primary shadow-sm"
            : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/40"
        }
        ${className}
      `}
    >
      {icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  );
}

/** Contenedor con scroll horizontal para chips */
export function ChipGroup({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`
        flex gap-2 overflow-x-auto pb-1
        scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]
        [&::-webkit-scrollbar]:hidden
        ${className}
      `}
    >
      {children}
    </div>
  );
}
