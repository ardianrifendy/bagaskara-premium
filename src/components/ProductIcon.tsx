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
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-[#141414] border border-zinc-800 select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 60 100" style={{ width: size * 0.38, height: size * 0.62 }}>
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
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-[#121212] border border-zinc-800 select-none shadow-md ${className}`}
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
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-[#0f0f0f] border border-zinc-800 select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 24 24" fill="#FF0000" style={{ width: size * 0.58, height: size * 0.58 }}>
          <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11C4.482 20.455 12 20.455 12 20.455s7.518 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      </div>
    );
  }

  // 4. DISNEY+ HOTSTAR (Official Disney+ Logo & Arc)
  if (cleanName.includes("disney")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-b from-[#0f172a] via-[#040714] to-[#020617] border border-[#1e293b] select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="flex flex-col items-center justify-center">
          <svg viewBox="0 0 120 70" style={{ width: size * 0.75, height: size * 0.45 }}>
            {/* Curved Glow Arc */}
            <path
              d="M 10 55 C 35 15, 85 15, 110 55"
              fill="none"
              stroke="#00D2FF"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Disney D Stylized */}
            <path
              d="M 28 22 C 28 22, 42 16, 52 28 C 60 38, 50 50, 38 50 C 32 50, 28 46, 28 42 Z M 36 28 L 36 44 C 42 44, 46 38, 42 32 C 40 29, 38 28, 36 28 Z"
              fill="#FFFFFF"
            />
            {/* Plus Sign */}
            <path
              d="M 75 32 H 87 M 81 26 V 38"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-[9px] font-extrabold tracking-widest text-[#00D2FF] uppercase -mt-1 font-sans">
            HOTSTAR
          </span>
        </div>
      </div>
    );
  }

  // 5. CANVA (Official Cursive Canva)
  if (cleanName.includes("canva")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-tr from-[#7d2ae8] via-[#00c4cc] to-[#00c4cc] select-none shadow-md border border-[#9b51e0] ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-white font-extrabold italic tracking-tighter drop-shadow-sm" style={{ fontSize: size * 0.38, fontFamily: "serif" }}>
          Canva
        </span>
      </div>
    );
  }

  // 6. CAPCUT (Official Scissors / Overlapping Geometry)
  if (cleanName.includes("capcut")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-[#0a0a0a] border border-zinc-800 select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 100 100" style={{ width: size * 0.55, height: size * 0.55 }}>
          {/* Capcut Top Bracket */}
          <path d="M 20 25 L 50 45 L 80 25 M 20 25 V 40 L 50 60 L 80 40 V 25" fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          {/* Capcut Bottom Bracket */}
          <path d="M 20 75 L 50 55 L 80 75 M 20 75 V 60 L 50 40 L 80 60 V 75" fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  // 7. CHATGPT / OPENAI (Official OpenAI Flower / Vortex Spiral)
  if (cleanName.includes("chatgpt") || cleanName.includes("openai") || cleanName.includes("gpt")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-[#10a37f] border border-[#14b8a6] select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 100 100" fill="none" stroke="#FFFFFF" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: size * 0.55, height: size * 0.55 }}>
          <path d="M 50 20 C 58 20, 65 25, 65 34 C 65 40, 58 45, 50 45 L 35 45 C 28 45, 22 50, 22 58 C 22 66, 28 72, 36 72 L 50 72 C 60 72, 70 65, 70 52 C 70 42, 62 35, 50 35 L 42 35" />
          <circle cx="50" cy="50" r="12" fill="#FFFFFF" />
        </svg>
      </div>
    );
  }

  // 8. CLAUDE (Official Anthropic Spark / Asterisk Logo)
  if (cleanName.includes("claude") || cleanName.includes("anthropic")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-[#CC785C] border border-[#d97706] select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        {/* Official Anthropic Multi-point Spark */}
        <svg viewBox="0 0 100 100" fill="#FBF7EE" style={{ width: size * 0.58, height: size * 0.58 }}>
          <path d="M 50 10 L 55 38 L 82 22 L 65 47 L 92 58 L 64 64 L 75 90 L 52 70 L 40 94 L 38 66 L 12 75 L 30 52 L 8 38 L 36 38 Z" />
        </svg>
      </div>
    );
  }

  // 9. MICROSOFT / OFFICE 365 (Official Office Ribbon/Hexagon Tile)
  if (cleanName.includes("office") || cleanName.includes("microsoft") || cleanName.includes("365") || cleanName.includes("outlook")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[#E33A1F] to-[#D83B01] border border-[#f97316] select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 100 100" fill="#FFFFFF" style={{ width: size * 0.55, height: size * 0.55 }}>
          {/* Office 365 Hexagon Logo */}
          <path d="M 50 15 L 85 30 V 70 L 50 85 L 15 70 V 30 Z" fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinejoin="round" />
          <path d="M 50 15 V 85 M 15 30 L 85 70 M 85 30 L 15 70" stroke="#FFFFFF" strokeWidth="4" opacity="0.6" />
        </svg>
      </div>
    );
  }

  // 10. ADOBE (Official Adobe "A" Ribbon)
  if (cleanName.includes("adobe") || cleanName.includes("photoshop")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-[#FA0F00] border border-[#ff4d4d] select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 100 100" fill="#FFFFFF" style={{ width: size * 0.55, height: size * 0.55 }}>
          {/* Left leg */}
          <polygon points="0,0 38,0 0,90" />
          {/* Right leg */}
          <polygon points="100,0 62,0 100,90" />
          {/* Crossbar */}
          <polygon points="38,48 62,48 50,78" />
        </svg>
      </div>
    );
  }

  // 11. VIU (Official Viu Typography)
  if (cleanName.includes("viu")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-[#FFB800] border border-[#ffd000] select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-black font-extrabold tracking-tighter font-sans" style={{ fontSize: size * 0.42 }}>
          viu
        </span>
      </div>
    );
  }

  // 12. GRAMMARLY (Official Grammarly Circular Arrow "g")
  if (cleanName.includes("grammarly")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-[#15C39A] border border-[#38dfb7] select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 100 100" style={{ width: size * 0.55, height: size * 0.55 }}>
          <circle cx="50" cy="50" r="38" fill="none" stroke="#FFFFFF" strokeWidth="9" />
          <path d="M 50 25 C 65 25, 75 35, 75 50 C 75 65, 62 75, 48 75 C 35 75, 25 65, 25 50" fill="none" stroke="#FFFFFF" strokeWidth="9" strokeLinecap="round" />
          <path d="M 50 50 H 75" stroke="#FFFFFF" strokeWidth="9" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // 13. ICLOUD / APPLE (Official Apple Cloud)
  if (cleanName.includes("icloud") || cleanName.includes("apple")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-b from-[#3b82f6] to-[#1d4ed8] border border-[#60a5fa] select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 24 24" fill="#FFFFFF" style={{ width: size * 0.55, height: size * 0.55 }}>
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
        </svg>
      </div>
    );
  }

  // 14. COURSERA (Official Coursera "C" Crescent)
  if (cleanName.includes("coursera")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-[#0056D2] border border-[#2575fc] select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 100 100" style={{ width: size * 0.55, height: size * 0.55 }}>
          <path d="M 75 25 C 60 10, 35 10, 20 28 C 5 46, 5 72, 22 88 C 38 102, 65 100, 78 82 L 62 70 C 52 82, 36 82, 28 72 C 18 60, 18 42, 28 32 C 38 22, 54 22, 64 32 Z" fill="#FFFFFF" />
        </svg>
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
