import Image from "next/image";

interface ProductIconProps {
  name: string;
  iconUrl?: string | null;
  size?: number;
  className?: string;
}

export default function ProductIcon({ name, iconUrl, size = 80, className = "" }: ProductIconProps) {
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
          unoptimized
        />
      </div>
    );
  }

  const cleanName = name.toLowerCase();

  // 1. NETFLIX
  if (cleanName.includes("netflix")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-zinc-950 border border-zinc-800 select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 60 100" style={{ width: size * 0.4, height: size * 0.65 }}>
          <path d="M10 0V100H23.5V36.5L46.5 100H60V0H46.5V63.5L23.5 0H10Z" fill="#E50914" />
          <path d="M10 0H23.5V100H10V0Z" fill="#B1060F" />
        </svg>
      </div>
    );
  }

  // 2. SPOTIFY
  if (cleanName.includes("spotify")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-zinc-950 border border-zinc-800 select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 24 24" fill="#1DB954" style={{ width: size * 0.55, height: size * 0.55 }}>
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.49 17.306c-.215.352-.676.463-1.025.247-2.825-1.728-6.38-2.118-10.567-1.164-.403.092-.81-.16-.902-.563-.092-.403.16-.81.563-.902 4.58-1.047 8.497-.603 11.684 1.348.35.215.462.677.247 1.03zm1.464-3.26c-.27.44-.848.583-1.288.312-3.233-1.987-8.163-2.564-11.986-1.403-.497.15-1.023-.13-1.173-.627-.15-.497.13-1.024.627-1.174 4.375-1.328 9.814-.68 13.51 1.597.44.27.584.85.31 1.295zm.126-3.41C15.2 8.223 8.79 8.01 5.093 9.133c-.59.18-1.218-.153-1.397-.743-.18-.59.153-1.218.743-1.397 4.246-1.29 11.332-1.044 16.035 1.748.53.315.706 1.002.392 1.533-.314.53-.997.708-1.53.393z" />
        </svg>
      </div>
    );
  }

  // 3. YOUTUBE
  if (cleanName.includes("youtube")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-zinc-950 border border-zinc-800 select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 24 24" fill="#FF0000" style={{ width: size * 0.55, height: size * 0.55 }}>
          <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11C4.482 20.455 12 20.455 12 20.455s7.518 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      </div>
    );
  }

  // 4. DISNEY+
  if (cleanName.includes("disney")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[#0c122c] to-[#122c54] border border-[#1b3e75] select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 24 24" fill="url(#disneyGrad)" style={{ width: size * 0.6, height: size * 0.6 }}>
          <defs>
            <linearGradient id="disneyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00E5FF" />
              <stop offset="100%" stopColor="#9C27B0" />
            </linearGradient>
          </defs>
          <path d="M22.046 14.398c-.144-1.267-.936-2.534-1.728-3.4-.648-.648-1.368-1.224-2.16-1.728.864-.864 1.728-1.944 2.16-3.168.144-.432-.144-.864-.576-.864h-1.08c-.72 0-1.44.432-1.872 1.008-.576.864-1.368 1.872-2.16 2.592v-5.904c0-.576-.432-1.008-1.008-1.008H12.5c-.576 0-1.008.432-1.008 1.008v8.352c-.72-.72-1.728-1.44-2.88-1.872.288-1.296.864-2.592 1.728-3.744.288-.432-.144-1.008-.576-1.008H8.686c-.576 0-1.152.288-1.584.864-.864 1.296-1.44 2.88-1.728 4.464-1.152-.432-2.304-.72-3.456-.72h-.72c-.576 0-1.008.432-1.008 1.008v.72c0 .576.432 1.008 1.008 1.008h.72c1.728 0 3.312.432 4.896 1.152-.288 2.016-.288 4.032.288 5.904.144.576.72 1.008 1.296 1.008h1.08c.576 0 1.008-.432 1.008-1.008v-.72c0-.576-.288-1.296-.576-2.016 1.152-.432 2.304-1.008 3.312-1.728v3.456c0 .576.432 1.008 1.008 1.008h1.08c.576 0 1.008-.432 1.008-1.008v-5.616c.864-.576 1.728-1.008 2.592-1.296.288.72.576 1.584.864 2.448.288.864 1.008 1.584 1.872 1.584h1.08c.576 0 .864-.576.72-1.152z" />
        </svg>
      </div>
    );
  }

  // 5. CANVA
  if (cleanName.includes("canva")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-tr from-[#7d2ae8] to-[#00c4cc] select-none shadow-md border border-[#9b51e0] ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-white font-extrabold tracking-tighter" style={{ fontSize: size * 0.42 }}>
          Canva
        </span>
      </div>
    );
  }

  // 6. CAPCUT
  if (cleanName.includes("capcut")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-zinc-950 border border-zinc-800 select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: size * 0.45, height: size * 0.45 }}>
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
    );
  }

  // 7. CHATGPT / OPENAI
  if (cleanName.includes("chatgpt") || cleanName.includes("openai") || cleanName.includes("gpt")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[#0f766e] to-[#115e59] border border-[#14b8a6] select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: size * 0.55, height: size * 0.55 }}>
          <path d="M4.5 16.5c-1.5-1.2-2.5-3-2.5-5s1-3.8 2.5-5" />
          <path d="M19.5 7.5c1.5 1.2 2.5 3 2.5 5s-1 3.8-2.5 5" />
          <path d="M12 2c2.5 0 4.5 1.5 5.5 3.5m-11 0C7.5 3.5 9.5 2 12 2" />
          <path d="M12 22c-2.5 0-4.5-1.5-5.5-3.5m11 0c1-2 1-3.5-5.5-3.5" />
          <circle cx="12" cy="12" r="3" fill="#FFFFFF" />
        </svg>
      </div>
    );
  }

  // 8. CLAUDE
  if (cleanName.includes("claude") || cleanName.includes("anthropic")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[#d97706] to-[#b45309] border border-[#f59e0b] select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-white font-serif font-bold italic" style={{ fontSize: size * 0.5 }}>
          C
        </span>
      </div>
    );
  }

  // 9. MICROSOFT / OFFICE
  if (cleanName.includes("office") || cleanName.includes("microsoft") || cleanName.includes("365") || cleanName.includes("outlook")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[#ea580c] to-[#c2410c] border border-[#f97316] select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-white font-extrabold" style={{ fontSize: size * 0.45 }}>
          O
        </span>
      </div>
    );
  }

  // 10. ADOBE
  if (cleanName.includes("adobe") || cleanName.includes("photoshop")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-[#fa0f00] border border-[#ff4d4d] select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-white font-extrabold italic" style={{ fontSize: size * 0.5 }}>
          A
        </span>
      </div>
    );
  }

  // 11. VIU
  if (cleanName.includes("viu")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-[#ffb800] border border-[#ffd000] select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-black font-extrabold tracking-tighter" style={{ fontSize: size * 0.4 }}>
          viu
        </span>
      </div>
    );
  }

  // 12. GRAMMARLY
  if (cleanName.includes("grammarly")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-[#15c39a] border border-[#38dfb7] select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-white font-bold" style={{ fontSize: size * 0.5 }}>
          G
        </span>
      </div>
    );
  }

  // 13. ICLOUD / APPLE
  if (cleanName.includes("icloud") || cleanName.includes("apple")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] border border-[#60a5fa] select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 24 24" fill="#FFFFFF" style={{ width: size * 0.5, height: size * 0.5 }}>
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
        </svg>
      </div>
    );
  }

  // 14. COURSERA
  if (cleanName.includes("coursera")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-[#0056D2] border border-[#2575fc] select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-white font-extrabold" style={{ fontSize: size * 0.5 }}>
          C
        </span>
      </div>
    );
  }

  // FALLBACK INITIALS GENERATOR
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
