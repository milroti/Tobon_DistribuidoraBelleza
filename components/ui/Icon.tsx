interface IconProps {
  name: string;
  className?: string;
  size?: number;
  fill?: boolean;
}

export function Icon({ name, className = "", size = 24, fill = false }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontSize: size, fontVariationSettings: fill ? "'FILL' 1" : undefined }}
    >
      {name}
    </span>
  );
}
