"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** "bottom" = bottom sheet en mobile, "right" = side panel */
  side?: "bottom" | "right";
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  side = "bottom",
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className={`
          fixed inset-0 z-40 bg-black/40 backdrop-blur-sm
          transition-opacity duration-200
          ${open ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`
          fixed z-50 bg-surface-container-lowest
          shadow-[0_-12px_32px_-4px_rgba(45,45,45,0.08)]
          transition-transform duration-300 ease-out
          ${
            side === "bottom"
              ? `inset-x-0 bottom-0 rounded-t-2xl max-h-[85vh] overflow-y-auto
                 ${open ? "translate-y-0" : "translate-y-full pointer-events-none"}`
              : `top-0 right-0 h-full w-full max-w-96 overflow-y-auto
                 ${open ? "translate-x-0" : "translate-x-full pointer-events-none"}`
          }
        `}
      >
        {/* Drag handle (bottom sheet only) */}
        {side === "bottom" && (
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-outline-variant" />
          </div>
        )}

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/40">
            <h2 className="text-lg font-heading font-semibold text-on-surface">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
              aria-label="Cerrar"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-5">{children}</div>
      </div>
    </>,
    document.body,
  );
}
