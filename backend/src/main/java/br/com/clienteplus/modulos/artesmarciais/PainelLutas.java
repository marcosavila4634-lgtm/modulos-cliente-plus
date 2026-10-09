package br.com.clienteplus.modulos.artesmarciais;

import static br.com.clienteplus.modulos.artesmarciais.Lutas.hoje;
import static br.com.clienteplus.modulos.comum.Formatos.FUSO;
import static br.com.clienteplus.modulos.comum.Formatos.haQuanto;

import br.com.clienteplus.modulos.academia.Acesso;
import br.com.clienteplus.modulos.academia.Avaliacao;
import br.com.clienteplus.modulos.artesmarciais.ArtesMarciaisContrato.*;
import br.com.clienteplus.modulos.clienteplus.Assinatura;
import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.clienteplus.Pagamento;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

// Dashboard do Artes Marciais (o que é de luta; o resto vem do Dashboard da
// Academia) e a ficha de luta de um aluno.
//
// - Status das matrículas: ativas em dia, em renovação (vence em até 7 dias),
//   em atraso e canceladas nos últimos 90 dias.
// - Permanência: dos alunos ativos há 90 dias, quantos % continuam.
// - Presenças de hoje: alunos diferentes com entrada hoje, comparados com o
//   mesmo dia da semana passada até a mesma hora.
@ApplicationScoped
public class PainelLutas {

    private static final DateTimeFormatter DIA = DateTimeFormatter.ofPattern("dd/MM");

    @Inject
    Graduacoes graduacoes;

    @Inject
    Presencas presencas;

    @Inject
    Eventos eventos;

    @Inject
    Equipamentos equipamentos;

    @Inject
    Familias familias;

    @Inject
    Loja loja;

    public DashboardLutas montar(UUID storeId) {
        ConfigArtesMarciais cfg = graduacoes.config(storeId);
        List<Assinatura> matriculas = Assinatura.list("storeId", storeId);
        LocalDate hoje = hoje();
        Set<UUID> ativos = ativosEm(matriculas, hoje);

        return new DashboardLutas(
                cfg.lema,
                presencas.aulasDeHoje(storeId),
                modalidades(storeId, ativos),
                (int) AlunoModalidade.<AlunoModalidade>list("storeId = ?1 and ativo = true", storeId).stream()
                        .filter(a -> ativos.contains(a.cliente.id)).map(a -> a.cliente.id).distinct().count(),
                status(storeId, matriculas),
                permanencia(matriculas, hoje),
                presencasHoje(storeId, ativos.size()),
                alertas(storeId, cfg),
                atividades(storeId));
    }

    static boolean ativaEm(Assinatura m, LocalDate dia) {
        if (m.inicio.isAfter(dia)) return false;
        if (Assinatura.ATIVA.equals(m.status)) return true;
        return m.canceladaEm != null && m.canceladaEm.atZoneSameInstant(FUSO).toLocalDate().isAfter(dia);
    }

    static Set<UUID> ativosEm(List<Assinatura> ms, LocalDate dia) {
        return ms.stream().filter(m -> ativaEm(m, dia)).map(m -> m.cliente.id).collect(Collectors.toSet());
    }

    List<FatiaModalidade> modalidades(UUID storeId, Set<UUID> ativos) {
        Map<Modalidade, Long> por = AlunoModalidade.<AlunoModalidade>list("storeId = ?1 and ativo = true", storeId)
                .stream()
                .filter(a -> ativos.contains(a.cliente.id))
                .collect(Collectors.groupingBy(a -> a.modalidade, Collectors.counting()));
        long total = por.values().stream().mapToLong(Long::longValue).sum();
        if (total == 0) return List.of();
        List<Map.Entry<Modalidade, Long>> ordem = por.entrySet().stream()
                .sorted(Map.Entry.<Modalidade, Long>comparingByValue().reversed())
                .toList();
        List<FatiaModalidade> lista = new ArrayList<>();
        long outras = 0;
        for (int i = 0; i < ordem.size(); i++) {
            var e = ordem.get(i);
            if (i < 7) {
                lista.add(new FatiaModalidade(e.getKey().nome, e.getKey().cor, e.getValue().intValue(),
                        (int) Math.round(e.getValue() * 100.0 / total)));
            } else {
                outras += e.getValue();
            }
        }
        if (outras > 0) lista.add(new FatiaModalidade("Outras", "#a1a1aa", (int) outras, (int) Math.round(outras * 100.0 / total)));
        return lista;
    }

    StatusMatriculas status(UUID storeId, List<Assinatura> ms) {
        LocalDate hoje = hoje();
        Map<UUID, Pagamento> proxima = new HashMap<>();
        for (Pagamento p : Pagamento.<Pagamento>list(
                "storeId = ?1 and status = 'pendente' and assinatura is not null order by vencimento", storeId)) {
            proxima.putIfAbsent(p.assinatura.id, p);
        }
        int emDia = 0, renovacao = 0, atraso = 0, canceladas = 0;
        OffsetDateTime limite = OffsetDateTime.now().minusDays(90);
        for (Assinatura m : ms) {
            if (Assinatura.ATIVA.equals(m.status)) {
                Pagamento p = proxima.get(m.id);
                if (p != null && p.vencimento.isBefore(hoje)) atraso++;
                else if (p != null && !p.vencimento.isAfter(hoje.plusDays(7))) renovacao++;
                else emDia++;
            } else if (m.canceladaEm != null && m.canceladaEm.isAfter(limite)) {
                canceladas++;
            }
        }
        return new StatusMatriculas(emDia, renovacao, atraso, canceladas, emDia + renovacao + atraso + canceladas);
    }

    static Permanencia permanencia(List<Assinatura> ms, LocalDate hoje) {
        int[] atual = taxa(ms, hoje.minusDays(90), hoje);
        int[] anterior = taxa(ms, hoje.minusDays(120), hoje.minusDays(30));
        return new Permanencia(atual[0], atual[0] - anterior[0], atual[1]);
    }

    // [taxa %, base]
    static int[] taxa(List<Assinatura> ms, LocalDate de, LocalDate ate) {
        Set<UUID> antes = ativosEm(ms, de);
        if (antes.isEmpty()) return new int[] {0, 0};
        Set<UUID> depois = ativosEm(ms, ate);
        long ficaram = antes.stream().filter(depois::contains).count();
        return new int[] {(int) Math.round(ficaram * 100.0 / antes.size()), antes.size()};
    }

    static PresencasHoje presencasHoje(UUID storeId, int ativos) {
        LocalDate hoje = hoje();
        OffsetDateTime inicio = hoje.atStartOfDay(FUSO).toOffsetDateTime();
        long agora = Acesso.<Acesso>list("storeId = ?1 and resultado = 'liberado' and momento >= ?2", storeId, inicio)
                .stream().map(a -> a.cliente.id).distinct().count();
        long semana = Acesso.<Acesso>list("storeId = ?1 and resultado = 'liberado' and momento >= ?2 and momento < ?3",
                        storeId, inicio.minusWeeks(1), OffsetDateTime.now().minusWeeks(1))
                .stream().map(a -> a.cliente.id).distinct().count();
        int variacao = semana == 0 ? (agora > 0 ? 100 : 0) : (int) Math.round((agora - semana) * 100.0 / semana);
        return new PresencasHoje((int) agora, variacao, ativos, ativos == 0 ? 0 : (int) Math.round(agora * 100.0 / ativos));
    }

    List<AlertaLutas> alertas(UUID storeId, ConfigArtesMarciais cfg) {
        List<AlertaLutas> lista = new ArrayList<>();
        LocalDate hoje = hoje();

        List<Progresso> ps = graduacoes.progressos(storeId).stream().filter(Progresso::matriculaAtiva).toList();
        long faixa = ps.stream().filter(p -> "apto_faixa".equals(p.situacao())).count();
        long grau = ps.stream().filter(p -> "apto_grau".equals(p.situacao())).count();
        if (faixa + grau > 0) {
            lista.add(new AlertaLutas("aptos_graduar", plural(faixa + grau, "aluno pronto para graduar", "alunos prontos para graduar"),
                    faixa + " para nova faixa · " + grau + " para novo grau"));
        }
        Exame exame = Exame.<Exame>find("storeId = ?1 and status = 'agendado' and data >= ?2 order by data", storeId, hoje)
                .firstResult();
        if (exame != null && !exame.data.isAfter(hoje.plusDays(30))) {
            long dias = java.time.temporal.ChronoUnit.DAYS.between(hoje, exame.data);
            long candidatos = ExameCandidato.count("exame", exame);
            lista.add(new AlertaLutas("exame", dias == 0 ? "Exame de faixa hoje" : "Exame de faixa em " + dias + (dias == 1 ? " dia" : " dias"),
                    exame.modalidade.nome + " · " + plural(candidatos, "candidato", "candidatos") + " · " + exame.data.format(DIA)));
        }
        List<EventoResumo> abertos = eventos.lista(storeId).stream()
                .filter(e -> "inscricoes_abertas".equals(e.fase()))
                .toList();
        if (!abertos.isEmpty()) {
            EventoResumo prox = abertos.stream().min(Comparator.comparing(EventoResumo::data)).get();
            lista.add(new AlertaLutas("evento", plural(abertos.size(), "evento com inscrições abertas", "eventos com inscrições abertas"),
                    prox.nome() + " · " + prox.inscritos() + " inscritos"));
        }
        long equip = equipamentos.precisamAtencao(storeId);
        if (equip > 0) {
            lista.add(new AlertaLutas("equipamentos", plural(equip, "equipamento precisa de manutenção", "equipamentos precisam de manutenção"),
                    "Revisão vencida ou estado ruim"));
        }
        long filiacoes = eventos.filiacoes(storeId).stream().filter(f -> !"valida".equals(f.situacao())).count();
        if (filiacoes > 0) {
            lista.add(new AlertaLutas("filiacoes", plural(filiacoes, "filiação vencida ou vencendo", "filiações vencidas ou vencendo"),
                    "Renove antes do próximo campeonato"));
        }
        long kids = familias.painel(storeId).kidsSemResponsavel().size();
        if (kids > 0) {
            lista.add(new AlertaLutas("kids_sem_responsavel", plural(kids, "aluno kids sem responsável", "alunos kids sem responsável"),
                    "Cadastre quem acompanha e paga"));
        }
        long estoque = Produto.<Produto>list("storeId = ?1 and ativo = true", storeId).stream()
                .filter(p -> p.tamanhos.stream().anyMatch(t -> t.estoque <= t.estoqueMinimo))
                .count();
        if (estoque > 0) {
            lista.add(new AlertaLutas("estoque", plural(estoque, "produto com estoque baixo", "produtos com estoque baixo"),
                    "Uniformes e loja"));
        }
        return lista;
    }

    static String plural(long n, String singular, String plural) {
        return n + " " + (n == 1 ? singular : plural);
    }

    // Últimas atividades: check-ins, matrículas, avaliações, graduações,
    // inscrições, vendas e pagamentos.
    List<AtividadeLutas> atividades(UUID storeId) {
        OffsetDateTime agora = OffsetDateTime.now();
        OffsetDateTime desde = agora.minusDays(7);
        List<AtividadeLutas> lista = new ArrayList<>();
        Acesso.<Acesso>find("storeId = ?1 and resultado = 'liberado' and momento >= ?2 order by momento desc", storeId, desde)
                .page(0, 3).list()
                .forEach(a -> lista.add(atividade("checkin", a.cliente.nome + " fez check-in", faixaDe(a.cliente), a.momento)));
        Assinatura.<Assinatura>find("storeId = ?1 and createdAt >= ?2 order by createdAt desc", storeId, desde)
                .page(0, 3).list()
                .forEach(m -> lista.add(atividade("matricula", "Nova matrícula - " + m.cliente.nome, m.plano.nome, m.createdAt)));
        Avaliacao.<Avaliacao>find("storeId = ?1 and data >= ?2 order by data desc", storeId, desde.toLocalDate())
                .page(0, 2).list()
                .forEach(a -> lista.add(atividade("avaliacao", "Avaliação física concluída", a.cliente.nome,
                        a.data.atTime(10, 0).atZone(FUSO).toOffsetDateTime())));
        Graduacao.<Graduacao>find("storeId = ?1 and tipo <> 'inicial' and data >= ?2 order by data desc, createdAt desc",
                        storeId, desde.toLocalDate())
                .page(0, 3).list()
                .forEach(g -> lista.add(atividade("graduacao", "Graduação registrada",
                        g.cliente.nome + " - " + Lutas.faixaComGrau(g.faixa, g.grau), momento(g.data, g.createdAt))));
        Inscricao.<Inscricao>find("storeId = ?1 and createdAt >= ?2 order by createdAt desc", storeId, desde)
                .page(0, 2).list()
                .forEach(i -> lista.add(atividade("inscricao", "Inscrição em evento", i.cliente.nome + " - " + i.evento.nome,
                        i.createdAt)));
        VendaLoja.<VendaLoja>find("storeId = ?1 and createdAt >= ?2 order by createdAt desc", storeId, desde)
                .page(0, 2).list()
                .forEach(v -> lista.add(atividade("venda", "Venda na loja", v.cliente.nome, v.createdAt)));
        Pagamento.<Pagamento>find("storeId = ?1 and status = 'pago' and pagoEm >= ?2 order by pagoEm desc", storeId, desde)
                .page(0, 3).list()
                .forEach(p -> lista.add(atividade("pagamento", "Pagamento confirmado",
                        "R$ " + String.format(java.util.Locale.of("pt", "BR"), "%,.2f", p.valor) + formaTexto(p.formaPagamento),
                        p.pagoEm)));
        return lista.stream()
                .filter(a -> !a.momento().isAfter(agora))
                .sorted(Comparator.comparing(AtividadeLutas::momento).reversed())
                .limit(6)
                .toList();
    }

    private static OffsetDateTime momento(LocalDate data, OffsetDateTime criado) {
        if (criado != null && criado.atZoneSameInstant(FUSO).toLocalDate().equals(data)) return criado;
        return data.atTime(12, 0).atZone(FUSO).toOffsetDateTime();
    }

    private static String formaTexto(String forma) {
        if (forma == null) return "";
        return " - via " + switch (forma) {
            case "pix" -> "PIX";
            case "dinheiro" -> "dinheiro";
            case "cartao_credito" -> "cartão de crédito";
            case "cartao_debito" -> "cartão de débito";
            default -> forma;
        };
    }

    private static AtividadeLutas atividade(String tipo, String texto, String detalhe, OffsetDateTime quando) {
        return new AtividadeLutas(tipo, texto, detalhe, haQuanto(quando), quando);
    }

    private static String faixaDe(Cliente c) {
        AlunoModalidade am = AlunoModalidade.<AlunoModalidade>find("cliente = ?1 and ativo = true order by faixa.ordem desc", c)
                .firstResult();
        return am != null ? am.modalidade.nome + " · " + am.faixa.nome : "Matrícula ativa";
    }

    // ---------- Ficha de luta do aluno ----------

    public FichaLutas ficha(UUID storeId, Cliente aluno) {
        List<Progresso> ps = graduacoes.progressosDoAluno(storeId, aluno);
        Graduacoes.Aulas aulas = graduacoes.aulas(storeId, aluno.id);
        int total = aulas.total(aluno.id);
        LocalDate hoje = hoje();
        int mes = 0;
        Set<UUID> vistas = new HashSet<>();
        boolean porCheckin = "checkins".equals(graduacoes.config(storeId).contarAulasPor);
        for (Progresso p : ps) {
            if (porCheckin && !vistas.isEmpty()) break;
            vistas.add(p.modalidade().id());
            mes += aulas.entre(aluno.id, p.modalidade().id(), hoje.withDayOfMonth(1), hoje);
        }
        Dependente dep = familias.dependenteDe(aluno);
        ResponsavelResumo resp = dep == null ? null
                : new ResponsavelResumo(dep.responsavel.id, dep.responsavel.nome, dep.responsavel.telefone, dep.parentesco,
                        dep.responsavel.codigo);
        return new FichaLutas(aluno.id, aluno.nome, Lutas.idade(aluno), ps, graduacoes.historico(aluno),
                eventos.doAluno(aluno), eventos.filiacoes(aluno), resp,
                presencas.conquistas(storeId, aluno, total, mes), total);
    }
}
