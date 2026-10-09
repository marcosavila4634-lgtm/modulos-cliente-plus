package br.com.clienteplus.modulos.artesmarciais;

import static br.com.clienteplus.modulos.artesmarciais.Lutas.hoje;
import static br.com.clienteplus.modulos.artesmarciais.Lutas.ref;
import static br.com.clienteplus.modulos.comum.Formatos.numero;

import br.com.clienteplus.modulos.academia.Matriculas;
import br.com.clienteplus.modulos.artesmarciais.ArtesMarciaisContrato.*;
import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.clienteplus.Pagamento;
import br.com.clienteplus.modulos.comum.Erro;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

// Eventos (campeonatos, seminários, aulões, confraternizações), inscrições
// com pagamento, resultados (medalhas) e filiações às federações.
//
// - Inscrição com valor vira cobrança avulsa no Cliente Plus.
// - Fase: inscrições abertas até "inscricoes_ate" (ou até a véspera) e se
//   houver vaga; depois da data do evento, "realizado".
@ApplicationScoped
public class Eventos {

    static final Set<String> TIPOS = Set.of("campeonato", "seminario", "aulao", "confraternizacao", "outro");
    static final Set<String> RESULTADOS = Set.of("ouro", "prata", "bronze", "participou");

    @Inject
    Graduacoes graduacoes;

    @Inject
    Matriculas matriculas;

    public EventoLuta evento(UUID storeId, UUID id) {
        EventoLuta e = id != null ? EventoLuta.findById(id) : null;
        if (e == null || !e.storeId.equals(storeId)) throw Erro.naoEncontrado("Evento não encontrado");
        return e;
    }

    static String fase(EventoLuta e, int inscritos) {
        if ("cancelado".equals(e.status)) return "cancelado";
        LocalDate hoje = hoje();
        if (e.data.isBefore(hoje)) return "realizado";
        LocalDate ate = e.inscricoesAte != null ? e.inscricoesAte : e.data.minusDays(1);
        if (hoje.isAfter(ate) || (e.vagas != null && inscritos >= e.vagas)) return "inscricoes_encerradas";
        return "inscricoes_abertas";
    }

    static EventoResumo resumo(EventoLuta e) {
        List<Inscricao> is = Inscricao.list("evento = ?1 and status = 'inscrito'", e);
        return new EventoResumo(e.id, e.tipo, e.nome, e.descricao, ref(e.modalidade), e.data,
                e.hora != null ? e.hora.toString() : null, e.local, e.organizador, numero(e.valorInscricao), e.vagas,
                e.inscricoesAte, e.participaIndicacoes, e.abertoNoApp, e.status, fase(e, is.size()), is.size(),
                (int) is.stream().filter(i -> i.pagamento != null && Pagamento.PAGO.equals(i.pagamento.status)).count(),
                medalhas(is));
    }

    static Medalhas medalhas(List<Inscricao> is) {
        return new Medalhas(
                (int) is.stream().filter(i -> "ouro".equals(i.resultado)).count(),
                (int) is.stream().filter(i -> "prata".equals(i.resultado)).count(),
                (int) is.stream().filter(i -> "bronze".equals(i.resultado)).count());
    }

    static InscricaoJson json(Inscricao i) {
        return new InscricaoJson(i.id, i.evento.id, i.evento.nome, i.evento.tipo, i.evento.data, ref(i.cliente),
                i.categoria, i.faixa, i.peso != null ? numero(i.peso) : null, Lutas.cobranca(i.pagamento), i.resultado,
                i.origem, i.status);
    }

    public List<EventoResumo> lista(UUID storeId) {
        return EventoLuta.<EventoLuta>list("storeId = ?1 order by data desc", storeId).stream()
                .map(Eventos::resumo)
                .toList();
    }

    public EventoDetalhe detalhe(UUID storeId, UUID id) {
        EventoLuta e = evento(storeId, id);
        List<InscricaoJson> is = Inscricao.<Inscricao>list("evento = ?1 and status = 'inscrito'", e).stream()
                .map(Eventos::json)
                .sorted(Comparator.comparing((InscricaoJson i) -> i.aluno().nome(), Lutas.ALFABETICA))
                .toList();
        return new EventoDetalhe(resumo(e), is);
    }

    public List<InscricaoJson> doAluno(Cliente aluno) {
        return Inscricao.<Inscricao>list("cliente = ?1 and status = 'inscrito' order by evento.data desc", aluno)
                .stream()
                .map(Eventos::json)
                .toList();
    }

    @Transactional
    public EventoLuta salvar(UUID storeId, UUID id, DadosEvento d) {
        if (d == null) throw Erro.invalido("Dados do evento");
        EventoLuta e;
        if (id == null) {
            e = new EventoLuta();
            e.storeId = storeId;
            e.status = "ativo";
        } else {
            e = evento(storeId, id);
        }
        if (d.tipo() == null || !TIPOS.contains(d.tipo())) throw Erro.invalido("Escolha o tipo do evento");
        if (d.data() == null) throw Erro.invalido("Escolha a data do evento");
        if (d.vagas() != null && d.vagas() < 1) throw Erro.invalido("Vagas: deixe vazio ou use 1 ou mais");
        if (d.inscricoesAte() != null && d.inscricoesAte().isAfter(d.data())) {
            throw Erro.invalido("As inscrições precisam terminar até o dia do evento");
        }
        e.tipo = d.tipo();
        e.nome = Lutas.obrigatorio(d.nome(), "Dê um nome para o evento");
        e.descricao = Lutas.texto(d.descricao());
        e.modalidade = d.modalidadeId() != null ? graduacoes.modalidade(storeId, d.modalidadeId()) : null;
        e.data = d.data();
        e.hora = Exames.hora(d.hora());
        e.local = Lutas.texto(d.local());
        e.organizador = Lutas.texto(d.organizador());
        e.valorInscricao = Lutas.dinheiro(d.valorInscricao());
        e.vagas = d.vagas();
        e.inscricoesAte = d.inscricoesAte();
        e.participaIndicacoes = Boolean.TRUE.equals(d.participaIndicacoes());
        e.abertoNoApp = !Boolean.FALSE.equals(d.abertoNoApp());
        e.persist();
        return e;
    }

    @Transactional
    public void cancelarEvento(UUID storeId, UUID id) {
        EventoLuta e = evento(storeId, id);
        for (Inscricao i : Inscricao.<Inscricao>list("evento", e)) {
            if (i.pagamento != null && Pagamento.PENDENTE.equals(i.pagamento.status)) i.pagamento.status = Pagamento.CANCELADO;
        }
        e.status = "cancelado";
    }

    // Categoria sugerida (padrão de campeonatos de Jiu-Jitsu): idade e faixa.
    String categoriaSugerida(UUID storeId, EventoLuta e, Cliente aluno) {
        Integer idade = Lutas.idade(aluno);
        String grupo = idade == null ? "Adulto"
                : idade < 16 ? "Infantil (" + idade + " anos)"
                : idade < 18 ? "Juvenil"
                : idade < 30 ? "Adulto"
                : "Master " + Math.min(7, (idade - 30) / 5 + 1);
        AlunoModalidade am = e.modalidade != null
                ? AlunoModalidade.<AlunoModalidade>find("cliente = ?1 and modalidade = ?2", aluno, e.modalidade).firstResult()
                : AlunoModalidade.<AlunoModalidade>find("cliente = ?1 and ativo = true", aluno).firstResult();
        return am != null ? grupo + " · " + am.faixa.nome : grupo;
    }

    @Transactional
    public Inscricao inscrever(UUID storeId, UUID eventoId, Cliente aluno, String categoria, BigDecimal peso,
            boolean pago, String forma, String origem) {
        EventoLuta e = evento(storeId, eventoId);
        int inscritos = (int) Inscricao.count("evento = ?1 and status = 'inscrito'", e);
        if (!"inscricoes_abertas".equals(fase(e, inscritos))) throw Erro.conflito("As inscrições deste evento estão fechadas");
        if (matriculas.matriculaAtiva(aluno) == null) throw Erro.conflito(aluno.nome + " não tem matrícula ativa");
        if (peso != null && (peso.signum() <= 0 || peso.compareTo(BigDecimal.valueOf(300)) > 0)) {
            throw Erro.invalido("Peso inválido");
        }
        Inscricao i = Inscricao.<Inscricao>find("evento = ?1 and cliente = ?2", e, aluno).firstResult();
        if (i != null && "inscrito".equals(i.status)) throw Erro.conflito(aluno.nome + " já está inscrito");
        if (i == null) {
            i = new Inscricao();
            i.storeId = storeId;
            i.evento = e;
            i.cliente = aluno;
        }
        AlunoModalidade am = e.modalidade != null
                ? AlunoModalidade.<AlunoModalidade>find("cliente = ?1 and modalidade = ?2", aluno, e.modalidade).firstResult()
                : null;
        i.faixa = am != null ? Lutas.faixaComGrau(am.faixa, am.grau) : "";
        i.categoria = categoria != null && !categoria.isBlank() ? categoria.trim() : categoriaSugerida(storeId, e, aluno);
        i.peso = peso != null ? peso.setScale(2, RoundingMode.HALF_UP) : null;
        i.resultado = null;
        i.origem = origem;
        i.status = "inscrito";
        i.pagamento = e.valorInscricao.signum() > 0
                ? Lutas.cobrar(storeId, aluno, e.valorInscricao, "Inscrição: " + e.nome, pago, forma,
                        e.inscricoesAte != null ? e.inscricoesAte : e.data)
                : null;
        i.persist();
        return i;
    }

    Inscricao inscricao(UUID storeId, UUID eventoId, UUID id) {
        Inscricao i = Inscricao.findById(id);
        if (i == null || !i.storeId.equals(storeId) || !i.evento.id.equals(eventoId)) {
            throw Erro.naoEncontrado("Inscrição não encontrada");
        }
        return i;
    }

    @Transactional
    public void cancelarInscricao(UUID storeId, UUID eventoId, UUID id) {
        Inscricao i = inscricao(storeId, eventoId, id);
        if (i.pagamento != null && Pagamento.PAGO.equals(i.pagamento.status)) {
            throw Erro.conflito("A inscrição já foi paga. Registre a devolução em Despesas antes de cancelar.");
        }
        if (i.pagamento != null) i.pagamento.status = Pagamento.CANCELADO;
        i.status = "cancelado";
    }

    @Transactional
    public void resultado(UUID storeId, UUID eventoId, UUID id, DadosResultado d) {
        Inscricao i = inscricao(storeId, eventoId, id);
        if (d == null) throw Erro.invalido("Dados do resultado");
        if (d.resultado() != null && !RESULTADOS.contains(d.resultado())) throw Erro.invalido("Resultado inválido");
        if (d.resultado() != null && i.evento.data.isAfter(hoje())) {
            throw Erro.conflito("O resultado entra no dia do evento ou depois");
        }
        i.resultado = d.resultado();
        if (d.categoria() != null) i.categoria = d.categoria().trim();
        if (d.peso() != null) i.peso = d.peso().setScale(2, RoundingMode.HALF_UP);
    }

    // Quadro de medalhas: 3 pontos o ouro, 2 a prata, 1 o bronze.
    public Ranking ranking(UUID storeId, int ano) {
        Map<UUID, int[]> por = new HashMap<>();
        Map<UUID, Cliente> alunos = new HashMap<>();
        for (Inscricao i : Inscricao.<Inscricao>list(
                "storeId = ?1 and status = 'inscrito' and evento.tipo = 'campeonato' and evento.data >= ?2 and evento.data <= ?3",
                storeId, LocalDate.of(ano, 1, 1), LocalDate.of(ano, 12, 31))) {
            if (i.resultado == null) continue;
            int[] m = por.computeIfAbsent(i.cliente.id, k -> new int[4]);
            alunos.put(i.cliente.id, i.cliente);
            switch (i.resultado) {
                case "ouro" -> m[0]++;
                case "prata" -> m[1]++;
                case "bronze" -> m[2]++;
                default -> { }
            }
            m[3]++;
        }
        List<LinhaRanking> linhas = por.entrySet().stream()
                .map(x -> {
                    int[] m = x.getValue();
                    return new LinhaRanking(ref(alunos.get(x.getKey())), m[0], m[1], m[2], m[3], m[0] * 3 + m[1] * 2 + m[2]);
                })
                .sorted(Comparator.comparingInt(LinhaRanking::pontos).reversed()
                        .thenComparing(Comparator.comparingInt(LinhaRanking::ouro).reversed())
                        .thenComparing(l -> l.aluno().nome(), Lutas.ALFABETICA))
                .toList();
        return new Ranking(linhas, new Medalhas(linhas.stream().mapToInt(LinhaRanking::ouro).sum(),
                linhas.stream().mapToInt(LinhaRanking::prata).sum(), linhas.stream().mapToInt(LinhaRanking::bronze).sum()));
    }

    // ---------- Filiações ----------

    static FiliacaoJson json(Filiacao f) {
        LocalDate hoje = hoje();
        String situacao = f.validade.isBefore(hoje) ? "vencida"
                : f.validade.isBefore(hoje.plusDays(31)) ? "vence_em_breve" : "valida";
        return new FiliacaoJson(f.id, ref(f.cliente), f.entidade, f.numero, f.validade, situacao, f.observacao);
    }

    public List<FiliacaoJson> filiacoes(UUID storeId) {
        return Filiacao.<Filiacao>list("storeId = ?1 order by validade", storeId).stream().map(Eventos::json).toList();
    }

    public List<FiliacaoJson> filiacoes(Cliente aluno) {
        return Filiacao.<Filiacao>list("cliente = ?1 order by validade desc", aluno).stream().map(Eventos::json).toList();
    }

    @Transactional
    public void salvarFiliacao(UUID storeId, UUID id, DadosFiliacao d) {
        if (d == null) throw Erro.invalido("Dados da filiação");
        Filiacao f;
        if (id == null) {
            if (d.alunoId() == null) throw Erro.invalido("Escolha o aluno");
            f = new Filiacao();
            f.storeId = storeId;
            f.cliente = matriculas.aluno(storeId, d.alunoId());
        } else {
            f = Filiacao.findById(id);
            if (f == null || !f.storeId.equals(storeId)) throw Erro.naoEncontrado("Filiação não encontrada");
        }
        if (d.validade() == null) throw Erro.invalido("Informe a validade da filiação");
        f.entidade = Lutas.obrigatorio(d.entidade(), "Informe a federação (ex.: CBJJ)");
        f.numero = Lutas.texto(d.numero());
        f.validade = d.validade();
        f.observacao = Lutas.texto(d.observacao());
        f.persist();
    }

    @Transactional
    public void excluirFiliacao(UUID storeId, UUID id) {
        Filiacao f = Filiacao.findById(id);
        if (f == null || !f.storeId.equals(storeId)) throw Erro.naoEncontrado("Filiação não encontrada");
        f.delete();
    }
}
