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

  // 4. DISNEY+ HOTSTAR (Official Disney Logo + Hotstar Badge)
  if (cleanName.includes("disney")) {
    return (
      <div
        className={`rounded-2xl flex flex-col items-center justify-center flex-shrink-0 bg-gradient-to-b from-[#0f172a] via-[#040714] to-[#020617] border border-[#1e293b] select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="flex flex-col items-center justify-center space-y-0.5">
          <svg viewBox="0 0 24 24" fill="#FFFFFF" style={{ width: size * 0.45, height: size * 0.45 }}>
            <path d="M11.332 17.514c-1.89.096-2.585.99-2.585 1.83 0 .782.607 1.547 1.84 1.547 1.704 0 3.238-1.572 3.843-2.822a9.663 9.663 0 0 1-3.098-.555zm1.564-4.831c-.694 0-1.22.378-1.22.872 0 .43.327.9.967.9.68 0 1.258-.415 1.258-.9 0-.422-.387-.872-1.005-.872zM24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12zm-3.882 1.776c-.573-.244-1.229-.028-1.556.467-.783 1.18-1.815 1.758-3.08 1.758-.292 0-.616-.037-.962-.116.545-.71 1.05-1.545 1.488-2.457.29-.607.03-1.336-.576-1.627a1.298 1.298 0 0 0-1.626.577c-.503 1.047-1.11 2.008-1.782 2.812-1.127-1.127-1.748-2.602-1.748-4.22 0-.742.13-1.464.38-2.146.216-.59-.092-1.246-.684-1.462a1.206 1.206 0 0 0-1.462.684A10.82 10.82 0 0 0 8.01 11.2c0 2.213.84 4.237 2.228 5.766-1.106 1.626-2.906 3.447-4.992 3.447-1.922 0-2.986-1.24-2.986-2.678 0-1.79 1.465-3.324 3.738-3.44a14.73 14.73 0 0 0 2.827.243c.638.014 1.173-.487 1.187-1.126a1.18 1.18 0 0 0-1.126-1.188 16.92 16.92 0 0 1-3.238-.277C2.26 11.77.29 13.978.29 16.634c0 2.766 2.062 4.962 5.093 4.962 3.65 0 6.643-2.95 8.358-5.32 1.488.75 3.03 1.144 4.545 1.144 2.235 0 4.148-1.077 5.248-2.738.352-.53.18-1.246-.347-1.606z"/>
          </svg>
          <span className="text-[10px] font-extrabold tracking-wider text-[#00D2FF] uppercase font-sans">
            Disney+
          </span>
        </div>
      </div>
    );
  }

  // 5. CANVA
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

  // 6. CAPCUT (Official CapCut Geometry Logo)
  if (cleanName.includes("capcut")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-[#000000] border border-zinc-800 select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 24 24" fill="#FFFFFF" style={{ width: size * 0.52, height: size * 0.52 }}>
          <path d="M19.345 5.564l-4.5 3.15a1.2 1.2 0 0 1-1.38 0l-4.5-3.15A1.2 1.2 0 0 0 7.08 6.57l3.855 4.5a1.2 1.2 0 0 1 0 1.56L7.08 17.13a1.2 1.2 0 0 0 1.885 1.006l4.5-3.15a1.2 1.2 0 0 1 1.38 0l4.5 3.15a1.2 1.2 0 0 0 1.885-1.006l-3.855-4.5a1.2 1.2 0 0 1 0-1.56l3.855-4.5a1.2 1.2 0 0 0-1.885-1.006z" />
        </svg>
      </div>
    );
  }

  // 7. CHATGPT / OPENAI (Official OpenAI Logo Path from SimpleIcons)
  if (cleanName.includes("chatgpt") || cleanName.includes("openai") || cleanName.includes("gpt")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-[#10a37f] border border-[#14b8a6] select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 24 24" fill="#FFFFFF" style={{ width: size * 0.55, height: size * 0.55 }}>
          <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
        </svg>
      </div>
    );
  }

  // 8. CLAUDE (Official Anthropic Logo Path from SimpleIcons)
  if (cleanName.includes("claude") || cleanName.includes("anthropic")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-[#CC785C] border border-[#d97706] select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 24 24" fill="#FFFFFF" style={{ width: size * 0.55, height: size * 0.55 }}>
          <path d="M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z" />
        </svg>
      </div>
    );
  }

  // 9. MICROSOFT / OFFICE 365 (Official Microsoft 4-Color Grid)
  if (cleanName.includes("office") || cleanName.includes("microsoft") || cleanName.includes("365") || cleanName.includes("outlook")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-[#1e1e1e] border border-zinc-800 select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 24 24" style={{ width: size * 0.52, height: size * 0.52 }}>
          <path fill="#F25022" d="M1 1h10v10H1z" />
          <path fill="#7FBA00" d="M13 1h10v10H13z" />
          <path fill="#00A4EF" d="M1 13h10v10H1z" />
          <path fill="#FFB900" d="M13 13h10v10H13z" />
        </svg>
      </div>
    );
  }

  // 10. ADOBE (Official Adobe Path from SimpleIcons)
  if (cleanName.includes("adobe") || cleanName.includes("photoshop")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-[#FA0F00] border border-[#ff4d4d] select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 24 24" fill="#FFFFFF" style={{ width: size * 0.55, height: size * 0.55 }}>
          <path d="M13.966 22.624l-1.69-4.281H8.122l3.892-9.144 5.662 13.425zM8.884 1.376H0v21.248zm15.116 0h-8.884L24 22.624Z" />
        </svg>
      </div>
    );
  }

  // 11. VIU (Official Viu Wordmark Logo)
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

  // 12. GRAMMARLY (Official Grammarly Path from SimpleIcons)
  if (cleanName.includes("grammarly")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-[#15C39A] border border-[#38dfb7] select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 24 24" fill="#FFFFFF" style={{ width: size * 0.55, height: size * 0.55 }}>
          <path d="M12 24H.032V12c0-3.314 1.341-6.314 3.504-8.486C5.703 1.344 8.694 0 12 0c3.305 0 6.297 1.344 8.463 3.514 2.164 2.172 3.505 5.172 3.505 8.486s-1.338 6.314-3.505 8.486C18.297 22.656 15.305 24 12 24m2.889-13.137-1.271 2.205h4.418c-.505 2.882-3.018 5.078-6.036 5.078-3.38 0-6.132-2.757-6.132-6.146S8.618 5.854 12 5.854c1.821 0 3.458.801 4.584 2.069l1.143-1.988c-1.493-1.418-3.506-2.29-5.725-2.29-4.6 0-8.332 3.74-8.332 8.355s3.73 8.354 8.332 8.354c4.603 0 8.332-3.739 8.332-8.354 0-.387-.029-.765-.079-1.137z" />
        </svg>
      </div>
    );
  }

  // 13. ICLOUD / APPLE (Official iCloud Path from SimpleIcons)
  if (cleanName.includes("icloud") || cleanName.includes("apple")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-b from-[#3b82f6] to-[#1d4ed8] border border-[#60a5fa] select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 24 24" fill="#FFFFFF" style={{ width: size * 0.55, height: size * 0.55 }}>
          <path d="M13.762 4.29a6.51 6.51 0 0 0-5.669 3.332 3.571 3.571 0 0 0-1.558-.36 3.571 3.571 0 0 0-3.516 3A4.918 4.918 0 0 0 0 14.796a4.918 4.918 0 0 0 4.92 4.914 4.93 4.93 0 0 0 .617-.045h14.42c2.305-.272 4.041-2.258 4.043-4.589v-.009a4.594 4.594 0 0 0-3.727-4.508 6.51 6.51 0 0 0-6.511-6.27z" />
        </svg>
      </div>
    );
  }

  // 14. COURSERA (Official Coursera Path from SimpleIcons)
  if (cleanName.includes("coursera")) {
    return (
      <div
        className={`rounded-2xl flex items-center justify-center flex-shrink-0 bg-[#0056D2] border border-[#2575fc] select-none shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 24 24" fill="#FFFFFF" style={{ width: size * 0.55, height: size * 0.55 }}>
          <path d="M11.374 23.977c-4.183-.21-8.006-2.626-9.959-6.347-2.097-3.858-1.871-8.864.732-12.454C4.748 1.338 9.497-.698 14.281.23c4.583.857 8.351 4.494 9.358 8.911 1.122 4.344-.423 9.173-3.925 12.04-2.289 1.953-5.295 2.956-8.34 2.797zm7.705-8.05a588.737 588.737 0 0 0-3.171-1.887c-.903 1.483-2.885 2.248-4.57 1.665-2.024-.639-3.394-2.987-2.488-5.134.801-2.009 2.79-2.707 4.357-2.464a4.19 4.19 0 0 1 2.623 1.669c1.077-.631 2.128-1.218 3.173-1.855-2.03-3.118-6.151-4.294-9.656-2.754-3.13 1.423-4.89 4.68-4.388 7.919.54 3.598 3.73 6.486 7.716 6.404a7.664 7.664 0 0 0 6.404-3.563z" />
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
