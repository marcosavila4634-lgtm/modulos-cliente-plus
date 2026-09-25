import { Zap } from "lucide-react";

// Logo "GESTÃO PLUS ACADEMIA": halter com linha de batimento.
export function LogoGestaoPlus({ compacto = false }: { compacto?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 40 28" className="h-7 w-10 shrink-0" aria-hidden>
        <defs>
          <linearGradient id="gp-logo" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#60a5fa" />
            <stop offset="1" stopColor="#2563eb" />
          </linearGradient>
        </defs>
        <g fill="url(#gp-logo)">
          <rect x="1" y="8" width="4" height="12" rx="1.5" />
          <rect x="6" y="3" width="5" height="22" rx="2" />
          <rect x="29" y="3" width="5" height="22" rx="2" />
          <rect x="35" y="8" width="4" height="12" rx="1.5" />
        </g>
        <polyline
          points="11,14 15,14 17.5,8 21,21 24,11 26,14 29,14"
          fill="none"
          stroke="#93c5fd"
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      {!compacto && (
        <div className="leading-none">
          <div className="font-poppins text-[19px] font-bold tracking-wide text-white">
            GESTÃO<sup className="ml-0.5 text-[9px] font-semibold text-blue-400">PLUS</sup>
          </div>
          <div className="mt-1 text-[10px] font-medium tracking-[0.42em] text-blue-300/80">ACADEMIA</div>
        </div>
      )}
    </div>
  );
}

// Logo da academia cliente (círculo escuro com raio).
export function AvatarAcademia({ className = "size-9" }: { className?: string }) {
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-full border border-white/15 bg-black ${className}`}
    >
      <Zap className="size-1/2 fill-white text-white" />
    </div>
  );
}

// Marca circular verde-água do canto superior direito.
export function MarcaCircular() {
  return (
    <div className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600 shadow-[0_0_18px_rgba(45,212,191,0.35)]">
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
        <path d="M12 3 L21 20 H3 Z" fill="white" />
        <path d="M12 11 L15.5 18 H8.5 Z" fill="#0d9488" />
      </svg>
    </div>
  );
}
