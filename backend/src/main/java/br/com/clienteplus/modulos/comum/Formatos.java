package br.com.clienteplus.modulos.comum;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

// Converte valores do banco para o formato de texto/número que o painel mostra.
public final class Formatos {

    private Formatos() {}

    public static final ZoneId FUSO = ZoneId.of("America/Sao_Paulo");

    private static final String[] MESES = {
        "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"
    };
    private static final DateTimeFormatter DIA_MES = DateTimeFormatter.ofPattern("dd/MM");
    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");

    // 2025-08-01 -> "Ago"
    public static String mesAbreviado(LocalDate data) {
        return MESES[data.getMonthValue() - 1];
    }

    // Números do banco (numeric) sem ".00" à toa: 482.00 -> 482, 6.30 -> 6.3.
    public static Number numero(BigDecimal valor) {
        if (valor == null) return 0;
        BigDecimal limpo = valor.stripTrailingZeros();
        // if em vez de "? :", que converteria o long para double (482 -> 482.0)
        if (limpo.scale() <= 0) return limpo.longValue();
        return limpo.doubleValue();
    }

    // Há quanto tempo: "agora", "há 5 min", "há 1 hora", "há 3 dias".
    public static String haQuanto(OffsetDateTime quando) {
        long minutos = Math.max(0, Duration.between(quando, OffsetDateTime.now()).toMinutes());
        if (minutos < 1) return "agora";
        if (minutos < 60) return "há " + minutos + " min";
        long horas = minutos / 60;
        if (horas < 24) return horas == 1 ? "há 1 hora" : "há " + horas + " horas";
        long dias = horas / 24;
        return dias == 1 ? "há 1 dia" : "há " + dias + " dias";
    }

    // "Hoje, 14:30" ou "08/09, 10:15".
    public static String diaEHora(OffsetDateTime quando) {
        var local = quando.atZoneSameInstant(FUSO);
        String dia = local.toLocalDate().equals(LocalDate.now(FUSO)) ? "Hoje" : local.format(DIA_MES);
        return dia + ", " + local.format(HORA);
    }

    // Data de um instante no fuso do Brasil: "2025-09-09".
    public static String data(OffsetDateTime quando) {
        return quando.atZoneSameInstant(FUSO).toLocalDate().toString();
    }
}
