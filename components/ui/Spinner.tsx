import { Icon } from "./Icon";

interface SpinnerProps {
  size?: number;
  className?: string;
  label?: string;
}

export function Spinner({ size = 24, className = "", label }: SpinnerProps) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`} role="status">
      <Icon
        name="progress_activity"
        size={size}
        className="animate-spin text-primary"
      />
      {label && (
        <span className="text-sm text-on-surface-variant">{label}</span>
      )}
      <span className="sr-only">{label || "Cargando..."}</span>
    </div>
  );
}

/** Spinner centrado a pantalla completa */
export function FullPageSpinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size={40} label={label} />
    </div>
  );
}
