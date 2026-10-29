import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Icon } from "./Icon";

type ButtonVariant = "primary" | "secondary" | "gold" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  iconRight?: string;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-primary-hover active:scale-[0.98] shadow-sm",
  secondary:
    "bg-surface-container text-on-surface border border-outline-variant hover:bg-surface-container-high active:scale-[0.98]",
  gold:
    "bg-secondary text-on-secondary hover:opacity-90 active:scale-[0.98] shadow-sm",
  ghost:
    "bg-transparent text-on-surface hover:bg-surface-container active:scale-[0.98]",
  danger:
    "bg-error text-on-error hover:opacity-90 active:scale-[0.98] shadow-sm",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "text-sm px-3 py-1.5 gap-1.5 rounded-lg",
  md: "text-sm px-4 py-2.5 gap-2 rounded-lg",
  lg: "text-base px-6 py-3 gap-2.5 rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      icon,
      iconRight,
      loading = false,
      fullWidth = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;
    const iconSize = size === "sm" ? 16 : size === "lg" ? 22 : 18;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center font-medium transition-all
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? "w-full" : ""}
          ${isDisabled ? "opacity-50 cursor-not-allowed !scale-100" : "cursor-pointer"}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <Icon
            name="progress_activity"
            size={iconSize}
            className="animate-spin"
          />
        ) : icon ? (
          <Icon name={icon} size={iconSize} />
        ) : null}
        {children}
        {iconRight && !loading && <Icon name={iconRight} size={iconSize} />}
      </button>
    );
  },
);

Button.displayName = "Button";
