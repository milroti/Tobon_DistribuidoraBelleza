import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { Icon } from "./Icon";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: string;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      icon,
      iconRight,
      fullWidth = true,
      className = "",
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || props.name;

    return (
      <div className={fullWidth ? "w-full" : ""}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-on-surface mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <Icon
              name={icon}
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
            />
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full rounded-lg border bg-surface-container-lowest
              text-on-surface placeholder:text-outline/60
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              ${icon ? "pl-10" : "pl-4"}
              ${iconRight ? "pr-10" : "pr-4"}
              py-2.5 text-sm
              ${error ? "border-error focus:ring-error/30 focus:border-error" : "border-outline-variant"}
              ${className}
            `}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            {...props}
          />
          {iconRight && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {iconRight}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-xs text-error">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1 text-xs text-outline">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
