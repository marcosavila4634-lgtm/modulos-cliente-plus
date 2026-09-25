import { MessageCircle, Send } from "lucide-react";
import type { Plataforma } from "../../lib/grupo-vip";

// Avião de papel com degradê azul (marca do módulo).
export function AviaoPapel({ className = "size-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <linearGradient id="gv-aviao" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <path d="M4 22 L44 5 L36 42 L24 32 Z" fill="url(#gv-aviao)" />
      <path d="M24 32 L44 5 L18 28 L20 40 Z" fill="#1d4ed8" opacity="0.85" />
      <path d="M18 28 L20 40 L25 33 Z" fill="#1e3a8a" />
    </svg>
  );
}

export function LogoGrupoVip({ compacto = false }: { compacto?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <AviaoPapel className="size-10 shrink-0" />
      {!compacto && (
        <div className="leading-none">
          <div className="font-poppins text-[19px] font-bold text-white">GESTÃO PLUS</div>
          <div className="mt-0.5 text-center text-[11px] font-semibold tracking-[0.38em] text-sky-300">
            GRUPOS VIP
          </div>
          <div className="mt-1.5 text-center text-[7.5px] font-semibold tracking-wider text-slate-300/90 uppercase">
            Conteúdo exclusivo
            <br />
            Pessoas extraordinárias
          </div>
        </div>
      )}
    </div>
  );
}

// Selo da plataforma do grupo.
export function IconePlataforma({ plataforma, className = "size-4" }: { plataforma: Plataforma; className?: string }) {
  return plataforma === "telegram" ? (
    <Send className={className} />
  ) : (
    <MessageCircle className={className} />
  );
}

export const nomePlataforma: Record<Plataforma, string> = {
  telegram: "Telegram",
  whatsapp: "WhatsApp",
};

// Traço laranja "pincelado" usado sob frases.
export function TracoLaranja({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 14" className={className} aria-hidden preserveAspectRatio="none">
      <path d="M2 10 C 40 3, 100 2, 158 6" stroke="#f97316" strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  );
}
