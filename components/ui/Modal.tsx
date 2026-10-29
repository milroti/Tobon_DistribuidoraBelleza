"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  closeOnOverlay?: boolean;
}

const sizeStyles = {
  sm: "max-w-80",
  md: "max-w-[28rem]",
  lg: "max-w-[36rem]",
};

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  closeOnOverlay = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and handle Escape key when open
  useEffect(() => {
    if (!mounted || !open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, mounted, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (closeOnOverlay && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`
          ${sizeStyles[size]} w-full max-h-[90vh] overflow-y-auto
          bg-surface-container-lowest rounded-2xl
          shadow-[0_24px_48px_-8px_rgba(45,45,45,0.12)]
          animate-[modal-in_200ms_ease-out]
        `}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <h2 className="text-lg font-heading font-semibold text-on-surface">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
              aria-label="Cerrar"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className={title ? "px-6 pb-6 pt-2" : "p-6"}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}

/** Footer helper para acciones dentro del modal */
export function ModalFooter({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/40 mt-4 ${className}`}
    >
      {children}
    </div>
  );
}
