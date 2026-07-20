import Image from "next/image";

interface ProductIconProps {
  name: string;
  iconUrl?: string | null;
  size?: number;
  className?: string;
}

export default function ProductIcon({ name, iconUrl, size = 80, className = "" }: ProductIconProps) {
  let src = iconUrl;

  if (!src) {
    const cleanName = name.toLowerCase();

    if (cleanName.includes("netflix")) src = "/logos/netflix.svg";
    else if (cleanName.includes("spotify")) src = "/logos/spotify.svg";
    else if (cleanName.includes("youtube")) src = "/logos/youtube.svg";
    else if (cleanName.includes("disney")) src = "/logos/disney.svg";
    else if (cleanName.includes("canva")) src = "/logos/canva.svg";
    else if (cleanName.includes("capcut")) src = "/logos/capcut.svg";
    else if (cleanName.includes("chatgpt") || cleanName.includes("openai") || cleanName.includes("gpt")) src = "/logos/chatgpt.svg";
    else if (cleanName.includes("claude") || cleanName.includes("anthropic")) src = "/logos/claude.svg";
    else if (cleanName.includes("office") || cleanName.includes("microsoft") || cleanName.includes("365")) src = "/logos/office.svg";
    else if (cleanName.includes("adobe") || cleanName.includes("photoshop")) src = "/logos/adobe.svg";
    else if (cleanName.includes("viu")) src = "/logos/viu.svg";
    else if (cleanName.includes("grammarly")) src = "/logos/grammarly.svg";
    else if (cleanName.includes("icloud") || cleanName.includes("apple")) src = "/logos/icloud.svg";
    else if (cleanName.includes("coursera")) src = "/logos/coursera.svg";
  }

  if (src) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl flex-shrink-0 border border-zinc-200/60 dark:border-zinc-800 shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt={name}
          fill
          sizes={`${size}px`}
          className="object-cover"
          unoptimized
        />
      </div>
    );
  }

  const words = name.trim().split(/\s+/);
  let initials = "";
  if (words.length > 1) {
    initials = (words[0][0] || "") + (words[1][0] || "");
  } else {
    initials = name.slice(0, 2);
  }
  initials = initials.toUpperCase();

  return (
    <div
      className={`rounded-2xl flex items-center justify-center flex-shrink-0 font-sans text-2xl font-bold tracking-wider select-none border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 text-zinc-700 dark:text-zinc-300 ${className}`}
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}
