import QRCode from "qrcode";
import { useEffect, useState } from "react";

// QR Code de um texto/link (imagem gerada no navegador).
export function QrCode({ texto, tamanho = 220, className = "" }: { texto: string; tamanho?: number; className?: string }) {
  const [img, setImg] = useState<string | null>(null);
  useEffect(() => {
    QRCode.toDataURL(texto, { margin: 1, width: tamanho * 2, errorCorrectionLevel: "M" })
      .then(setImg)
      .catch(() => setImg(null));
  }, [texto, tamanho]);
  if (!img) return <div style={{ width: tamanho, height: tamanho }} className={`rounded-xl bg-white/10 ${className}`} />;
  return <img src={img} alt="QR Code" width={tamanho} height={tamanho} className={`rounded-xl bg-white ${className}`} />;
}
