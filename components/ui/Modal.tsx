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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, mounted]);

  // Close on Escape is handled natively by <dialog>
  useEffect(() => {
    if (!mounted) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose, mounted]);

  if (!mounted) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      className={`
        ${sizeStyles[size]} w-[calc(100%-2rem)] p-0 m-auto
        bg-surface-container-lowest rounded-2xl
        shadow-[0_24px_48px_-8px_rgba(45,45,45,0.12)]
        backdrop:bg-black/40 backdrop:backdrop-blur-sm
        open:animate-[modal-in_200ms_ease-out]
      `}
      onClick={(e) => {
        if (closeOnOverlay && e.target === dialogRef.current) onClose();
      }}
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
            className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
            aria-label="Cerrar"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
      )}

      {/* Body */}
      <div className={title ? "px-6 pb-6 pt-2" : "p-6"}>{children}</div>
    </dialog>,
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
