package br.com.clienteplus.modulos.academia;

import static br.com.clienteplus.modulos.comum.Formatos.FUSO;

import br.com.clienteplus.modulos.academia.AcessoContrato.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

// Horários de pico, calculados a partir dos check-ins (acessos liberados).
//
// - Média = entradas naquele dia da semana e hora, divididas pelo número de
//   semanas analisadas (sem contar hoje).
// - Ocupação = média / capacidade da academia. Considera que cada aluno fica
//   cerca de 1 hora: quem entra numa hora ocupa aquela hora.
@ApplicationScoped
public class HorariosPico {

    @Inject
    Configuracoes configuracoes;

    // Entradas de hoje e das últimas semanas, já separadas por dia/hora.
    private record Contagem(int[][] semanas, int[] hoje, int agora) {}

    private static Contagem contar(UUID storeId, int semanas) {
        LocalDate hoje = Matriculas.hoje();
        OffsetDateTime inicio = Acessos.inicioDo(hoje.minusWeeks(semanas));
        int[][] porDiaHora = new int[8][24]; // [1..7][0..23]
        int[] hojePorHora = new int[24];
        OffsetDateTime limiteAgora = OffsetDateTime.now().minusMinutes(Acessos.MINUTOS_NA_ACADEMIA);
        java.util.Set<UUID> agora = new java.util.HashSet<>();

        List<Acesso> acessos = Acesso.list(
                "storeId = ?1 and resultado = ?2 and momento >= ?3", storeId, Acesso.LIBERADO, inicio);
        for (Acesso a : acessos) {
            ZonedDateTime local = a.momento.atZoneSameInstant(FUSO);
            if (local.toLocalDate().equals(hoje)) {
                hojePorHora[local.getHour()]++;
                if (!a.momento.isBefore(limiteAgora)) agora.add(a.cliente.id);
            } else {
                porDiaHora[local.getDayOfWeek().getValue()][local.getHour()]++;
            }
        }
        return new Contagem(porDiaHora, hojePorHora, agora.size());
    }

    private static int ocupacao(double pessoas, int capacidade) {
        return (int) Math.min(100, Math.round(pessoas * 100 / capacidade));
    }

    private static double umaCasa(double v) {
        return Math.round(v * 10) / 10.0;
    }

    public PainelPico painel(UUID storeId, int semanas) {
        AcademiaConfig cfg = configuracoes.config(storeId);
        List<HorarioFuncionamento> horarios = configuracoes.horarios(storeId);
        Contagem c = contar(storeId, semanas);

        int horaInicio = horarios.stream()
                .filter(h -> !h.fechado && h.abre != null)
                .mapToInt(h -> h.abre.getHour())
                .min()
                .orElse(6);
        int horaFim = horarios.stream()
                .filter(h -> !h.fechado && h.fecha != null)
                .mapToInt(h -> h.fecha.getMinute() > 0 ? h.fecha.getHour() + 1 : h.fecha.getHour())
                .max()
                .orElse(23);

        List<DiaPico> mapa = new ArrayList<>();
        double maiorMedia = -1;
        int[] totalPorHora = new int[24];
        int[] totalPorDia = new int[8];
        for (int dia = 1; dia <= 7; dia++) {
            List<HoraPico> horas = new ArrayList<>();
            for (int h = horaInicio; h < horaFim; h++) {
                double media = c.semanas()[dia][h] / (double) semanas;
                maiorMedia = Math.max(maiorMedia, media);
                totalPorHora[h] += c.semanas()[dia][h];
                totalPorDia[dia] += c.semanas()[dia][h];
                horas.add(new HoraPico(h, umaCasa(media), ocupacao(media, cfg.capacidade)));
            }
            mapa.add(new DiaPico(dia, Configuracoes.DIAS[dia - 1], horas));
        }

        int diaHoje = Matriculas.hoje().getDayOfWeek().getValue();
        List<HoraHoje> hoje = new ArrayList<>();
        for (int h = horaInicio; h < horaFim; h++) {
            hoje.add(new HoraHoje(h, c.hoje()[h], umaCasa(c.semanas()[diaHoje][h] / (double) semanas)));
        }

        // Hora mais cheia e mais vazia: só entre as horas em que a academia
        // abre de segunda a sexta (as de fim de semana distorcem a média).
        int cheia = -1, vazia = -1;
        for (int h = horaInicio; h < horaFim; h++) {
            final int hora = h;
            boolean abreNaSemana = horarios.stream()
                    .filter(x -> x.diaSemana <= 5)
                    .allMatch(x -> x.abertoAs(java.time.LocalTime.of(hora, 30)));
            if (!abreNaSemana) continue;
            if (cheia < 0 || totalPorHora[h] > totalPorHora[cheia]) cheia = h;
            if (vazia < 0 || totalPorHora[h] < totalPorHora[vazia]) vazia = h;
        }
        int diaCheio = 1;
        for (int d = 2; d <= 7; d++) if (totalPorDia[d] > totalPorDia[diaCheio]) diaCheio = d;

        long diasAbertos = horarios.stream().filter(h -> !h.fechado).count() * semanas;
        int total = 0;
        for (int d = 1; d <= 7; d++) total += totalPorDia[d];

        Destaques destaques = new Destaques(
                cheia >= 0 ? hora(cheia) : "—",
                ocupacao(Math.max(0, maiorMedia), cfg.capacidade),
                vazia >= 0 ? hora(vazia) : "—",
                total > 0 ? Configuracoes.DIAS[diaCheio - 1] : "—",
                diasAbertos > 0 ? umaCasa(total / (double) diasAbertos) : 0);

        return new PainelPico(cfg.capacidade, semanas, horaInicio, horaFim, diaHoje, mapa, hoje, destaques,
                c.agora(), ocupacao(c.agora(), cfg.capacidade));
    }

    // Para o Dashboard: as 7 horas mais cheias do dia da semana de hoje, em
    // ordem de horário.
    public List<DashboardAcademia.HorarioPico> paraDashboard(UUID storeId) {
        PainelPico p = painel(storeId, 4);
        DiaPico hoje = p.mapa().get(p.diaHoje() - 1);
        return hoje.horas().stream()
                .filter(h -> h.media() > 0)
                .sorted((a, b) -> Double.compare(b.media(), a.media()))
                .limit(7)
                .sorted((a, b) -> Integer.compare(a.hora(), b.hora()))
                .map(h -> new DashboardAcademia.HorarioPico(hora(h.hora()), h.ocupacao()))
                .toList();
    }

    static String hora(int h) {
        return String.format("%02dh", h);
    }
}
