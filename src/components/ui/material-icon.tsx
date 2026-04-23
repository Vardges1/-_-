type MaterialIconProps = {
  name: string;
  className?: string;
  /** Filled icon style (Material Symbols). */
  filled?: boolean;
};

export function MaterialIcon({ name, className = "", filled }: MaterialIconProps) {
  return (
    <span
      className={`material-symbols-outlined leading-none ${filled ? "icon-fill" : ""} ${className}`.trim()}
      aria-hidden
    >
      {name}
    </span>
  );
}
