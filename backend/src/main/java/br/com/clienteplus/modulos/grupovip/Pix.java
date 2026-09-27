package br.com.clienteplus.modulos.grupovip;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;

// Código Pix "copia e cola" (BR Code estático, padrão do Banco Central),
// com valor e identificador da cobrança. O mesmo texto vira o QR Code.
//
// O dinheiro cai direto na chave Pix do dono do grupo. A confirmação do
// pagamento é feita pelo dono (botão "Receber") ou, no projeto principal,
// pelo gateway de pagamento do Cliente Plus (webhook).
public final class Pix {

    private Pix() {}

    public static String copiaECola(String chave, String nome, String cidade, BigDecimal valor, String identificador) {
        String conta = campo("00", "br.gov.bcb.pix") + campo("01", chave(chave));
        String txid = identificador.replaceAll("[^A-Za-z0-9]", "");
        if (txid.length() > 25) txid = txid.substring(0, 25);
        if (txid.isEmpty()) txid = "***";

        String semCrc = campo("00", "01")
                + campo("26", conta)
                + campo("52", "0000")
                + campo("53", "986")
                + campo("54", valor.setScale(2, RoundingMode.HALF_UP).toPlainString())
                + campo("58", "BR")
                + campo("59", texto(nome, 25, "RECEBEDOR"))
                + campo("60", texto(cidade, 15, "BRASIL"))
                + campo("62", campo("05", txid))
                + "6304";
        return semCrc + crc16(semCrc);
    }

    // Chave como o Pix espera: e-mail em minúsculas, telefone com +55, CPF/CNPJ só números.
    static String chave(String chave) {
        String c = chave.trim();
        if (c.contains("@")) return c.toLowerCase();
        if (c.startsWith("+")) return "+" + c.replaceAll("\\D", "");
        String numeros = c.replaceAll("\\D", "");
        // chave aleatória (uuid) fica como está
        if (c.matches("[0-9a-fA-F-]{32,36}") && c.contains("-")) return c.toLowerCase();
        return numeros.isEmpty() ? c : numeros;
    }

    private static String texto(String s, int max, String padrao) {
        if (s == null || s.isBlank()) return padrao;
        String t = Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("[^A-Za-z0-9 ]", "").trim().toUpperCase();
        if (t.isEmpty()) return padrao;
        return t.length() > max ? t.substring(0, max) : t;
    }

    private static String campo(String id, String valor) {
        int tamanho = valor.getBytes(StandardCharsets.UTF_8).length;
        return id + String.format("%02d", tamanho) + valor;
    }

    // CRC16-CCITT (polinômio 0x1021, início 0xFFFF), em 4 dígitos hexadecimais.
    static String crc16(String dados) {
        int crc = 0xFFFF;
        for (byte b : dados.getBytes(StandardCharsets.UTF_8)) {
            crc ^= (b & 0xFF) << 8;
            for (int i = 0; i < 8; i++) {
                crc = (crc & 0x8000) != 0 ? (crc << 1) ^ 0x1021 : crc << 1;
                crc &= 0xFFFF;
            }
        }
        return String.format("%04X", crc);
    }
}
