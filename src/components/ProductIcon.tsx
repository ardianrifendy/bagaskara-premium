import Image from "next/image";

interface ProductIconProps {
  name: string;
  iconUrl?: string | null;
  size?: number;
  className?: string;
}

export function getProductInitialsAndColor(name: string) {
  const cleanName = name.toLowerCase();
  if (cleanName.includes("netflix")) {
    return { initials: "NF", bg: "bg-rose-600 text-white" };
  }
  if (cleanName.includes("spotify")) {
    return { initials: "SP", bg: "bg-emerald-500 text-zinc-950 font-extrabold" };
  }
  if (cleanName.includes("youtube")) {
    return { initials: "YT", bg: "bg-red-600 text-white" };
  }
  if (cleanName.includes("disney")) {
    return { initials: "DS", bg: "bg-sky-900 text-white" };
  }
  if (cleanName.includes("canva")) {
    return { initials: "CV", bg: "bg-blue-600 text-white" };
  }
  if (cleanName.includes("capcut")) {
    return { initials: "CC", bg: "bg-zinc-800 dark:bg-zinc-700 text-white" };
  }
  if (cleanName.includes("chatgpt")) {
    return { initials: "GP", bg: "bg-teal-600 text-white" };
  }

  // Fallback initials generator
  const words = name.trim().split(/\s+/);
  let initials = "";
  if (words.length > 1) {
    initials = (words[0][0] || "") + (words[1][0] || "");
  } else {
    initials = name.slice(0, 2);
  }
  return {
    initials: initials.toUpperCase(),
    bg: "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300",
  };
}

export default function ProductIcon({ name, iconUrl, size = 80, className = "" }: ProductIconProps) {
  const { initials, bg } = getProductInitialsAndColor(name);

  if (iconUrl) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl flex-shrink-0 border border-zinc-200 dark:border-zinc-800 ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={iconUrl}
          alt={name}
          fill
          sizes={`${size}px`}
          className="object-cover"
          unoptimized // To allow arbitrary external URLs without next.config domains errors
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl flex items-center justify-center flex-shrink-0 font-sans text-2xl font-bold tracking-wider select-none border border-zinc-200 dark:border-zinc-800 ${bg} ${className}`}
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}
