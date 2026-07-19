interface BadgeProps {
  type: "HOT" | "AUTO" | "SMART";
  className?: string;
}

export default function Badge({ type, className = "" }: BadgeProps) {
  const styles = {
    HOT: "bg-rose-500 text-white",
    AUTO: "bg-emerald-500 text-zinc-950",
    SMART: "bg-amber-500 text-zinc-950",
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider select-none ${styles[type]} ${className}`}
    >
      {type}
    </span>
  );
}
