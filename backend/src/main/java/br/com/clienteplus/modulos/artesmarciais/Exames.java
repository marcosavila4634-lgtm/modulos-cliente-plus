package br.com.clienteplus.modulos.artesmarciais;

import static br.com.clienteplus.modulos.artesmarciais.Lutas.hoje;
import static br.com.clienteplus.modulos.artesmarciais.Lutas.ref;

import br.com.clienteplus.modulos.artesmarciais.ArtesMarciaisContrato.*;
import br.com.clienteplus.modulos.clienteplus.Pagamento;
import br.com.clienteplus.modulos.comum.Erro;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

// Exames de faixa: data, banca, candidatos (com a taxa da faixa pretendida,
// que vira cobrança no Cliente Plus) e resultado. Ao concluir, cada aprovado
// ganha a graduação (e o certificado).
@ApplicationScoped
public class Exames {

    @Inject
    Graduacoes graduacoes;

    public Exame exame(UUID storeId, UUID id) {
        Exame e = id != null ? Exame.findById(id) : null;
        if (e == null || !e.storeId.equals(storeId)) throw Erro.naoEncontrado("Exame não encontrado");
        return e;
    }

    static ExameResumo resumo(Exame e) {
        List<ExameCandidato> cs = ExameCandidato.list("exame", e);
        return new ExameResumo(e.id, ref(e.modalidade), e.titulo, e.data, e.hora != null ? e.hora.toString() : null,
                e.local, e.banca, e.status, cs.size(),
                (int) cs.stream().filter(c -> "aprovado".equals(c.resultado)).count(),
                (int) cs.stream().filter(c -> c.pagamento != null && Pagamento.PAGO.equals(c.pagamento.status)).count());
    }

    public List<ExameResumo> lista(UUID storeId) {
        return Exame.<Exame>list("storeId = ?1 order by data desc", storeId).stream().map(Exames::resumo).toList();
    }

    public ExameDetalhe detalhe(UUID storeId, UUID id) {
        Exame e = exame(storeId, id);
        List<ExameCandidato> cs = ExameCandidato.list("exame", e);
        Set<UUID> ja = cs.stream().map(c -> c.cliente.id).collect(Collectors.toSet());
        List<CandidatoJson> candidatos = cs.stream()
                .map(c -> {
                    AlunoModalidade am = AlunoModalidade.<AlunoModalidade>find(
                            "cliente = ?1 and modalidade = ?2", c.cliente, e.modalidade).firstResult();
                    return new CandidatoJson(c.id, ref(c.cliente), am != null ? ref(am.faixa) : null,
                            am != null ? am.grau : 0, ref(c.faixa), c.grau, Lutas.cobranca(c.pagamento), c.resultado,
                            c.observacao, c.graduacao != null ? c.graduacao.codigo : null);
                })
                .sorted(Comparator.comparing((CandidatoJson c) -> c.aluno().nome(), Lutas.ALFABETICA))
                .toList();
        // Sugestões: quem está apto a mudar de faixa nesta modalidade e ainda não está no exame.
        List<Progresso> sugeridos = "agendado".equals(e.status)
                ? graduacoes.progressos(storeId).stream()
                        .filter(p -> p.modalidade().id().equals(e.modalidade.id))
                        .filter(p -> "apto_faixa".equals(p.situacao()) && p.matriculaAtiva())
                        .filter(p -> !ja.contains(p.aluno().id()))
                        .toList()
                : List.of();
        return new ExameDetalhe(resumo(e), candidatos, sugeridos);
    }

    @Transactional
    public Exame salvar(UUID storeId, UUID id, DadosExame d) {
        if (d == null) throw Erro.invalido("Dados do exame");
        Exame e;
        if (id == null) {
            e = new Exame();
            e.storeId = storeId;
            e.status = "agendado";
            e.modalidade = graduacoes.modalidade(storeId, d.modalidadeId());
        } else {
            e = exame(storeId, id);
            if (!"agendado".equals(e.status)) throw Erro.conflito("Este exame já foi concluído");
        }
        if (d.data() == null) throw Erro.invalido("Escolha a data do exame");
        e.data = d.data();
        e.titulo = d.titulo() != null && !d.titulo().isBlank() ? d.titulo().trim()
                : "Exame de faixa - " + e.modalidade.nome;
        e.hora = hora(d.hora());
        e.local = Lutas.texto(d.local());
        e.banca = Lutas.texto(d.banca());
        e.observacao = Lutas.texto(d.observacao());
        e.persist();
        return e;
    }

    static LocalTime hora(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return LocalTime.parse(s);
        } catch (DateTimeParseException ex) {
            throw Erro.invalido("Horário inválido: use HH:MM");
        }
    }

    @Transactional
    public void adicionarCandidato(UUID storeId, UUID exameId, NovoCandidato d) {
        Exame e = exame(storeId, exameId);
        if (!"agendado".equals(e.status)) throw Erro.conflito("Este exame já foi concluído");
        if (d == null || d.alunoModalidadeId() == null) throw Erro.invalido("Escolha o aluno");
        AlunoModalidade am = graduacoes.alunoModalidade(storeId, d.alunoModalidadeId());
        if (!am.modalidade.id.equals(e.modalidade.id)) throw Erro.invalido("O aluno não treina " + e.modalidade.nome);
        if (ExameCandidato.count("exame = ?1 and cliente = ?2", e, am.cliente) > 0) {
            throw Erro.conflito(am.cliente.nome + " já está neste exame");
        }
        Faixa alvo = d.faixaId() != null ? graduacoes.faixa(storeId, d.faixaId()) : null;
        if (alvo == null) {
            Integer idade = Lutas.idade(am.cliente);
            boolean infantil = idade != null && idade < graduacoes.config(storeId).idadeAdulto;
            alvo = Graduacoes.proximaFaixa(am.faixa, graduacoes.faixas(am.modalidade), infantil);
            if (alvo == null) throw Erro.conflito(am.cliente.nome + " já está na última faixa");
        }
        if (!alvo.modalidade.id.equals(e.modalidade.id)) throw Erro.invalido("A faixa é de outra modalidade");

        ExameCandidato c = new ExameCandidato();
        c.storeId = storeId;
        c.exame = e;
        c.cliente = am.cliente;
        c.faixa = alvo;
        c.grau = d.grau() != null ? d.grau() : 0;
        c.resultado = "pendente";
        c.observacao = "";
        if (!Boolean.FALSE.equals(d.cobrarTaxa()) && alvo.taxaExame.signum() > 0) {
            boolean pago = Boolean.TRUE.equals(d.pago());
            c.pagamento = Lutas.cobrar(storeId, am.cliente, alvo.taxaExame,
                    "Exame de faixa: " + alvo.nome + " (" + e.modalidade.nome + ")", pago, d.formaPagamento(), e.data);
        }
        c.persist();
    }

    ExameCandidato candidato(UUID storeId, UUID exameId, UUID id) {
        ExameCandidato c = ExameCandidato.findById(id);
        if (c == null || !c.storeId.equals(storeId) || !c.exame.id.equals(exameId)) {
            throw Erro.naoEncontrado("Candidato não encontrado");
        }
        return c;
    }

    @Transactional
    public void removerCandidato(UUID storeId, UUID exameId, UUID id) {
        ExameCandidato c = candidato(storeId, exameId, id);
        if (!"agendado".equals(c.exame.status)) throw Erro.conflito("Este exame já foi concluído");
        if (c.pagamento != null && Pagamento.PAGO.equals(c.pagamento.status)) {
            throw Erro.conflito("A taxa já foi paga. Registre a devolução em Despesas antes de tirar o aluno.");
        }
        if (c.pagamento != null) c.pagamento.status = Pagamento.CANCELADO;
        c.delete();
    }

    @Transactional
    public void resultado(UUID storeId, UUID exameId, UUID id, ResultadoCandidato d) {
        ExameCandidato c = candidato(storeId, exameId, id);
        if (!"agendado".equals(c.exame.status)) throw Erro.conflito("Este exame já foi concluído");
        if (d == null || !Set.of("pendente", "aprovado", "reprovado").contains(d.resultado())) {
            throw Erro.invalido("Resultado inválido");
        }
        c.resultado = d.resultado();
        if (d.observacao() != null) c.observacao = d.observacao().trim();
    }

    // Conclui o exame: cada aprovado recebe a faixa (com certificado).
    @Transactional
    public void concluir(UUID storeId, UUID exameId, ConcluirExame d) {
        Exame e = exame(storeId, exameId);
        if (!"agendado".equals(e.status)) throw Erro.conflito("Este exame já foi concluído");
        if (e.data.isAfter(hoje())) throw Erro.conflito("O exame é no dia " + e.data + ". Conclua no dia ou depois.");
        List<ExameCandidato> cs = ExameCandidato.list("exame", e);
        if (cs.stream().anyMatch(c -> "pendente".equals(c.resultado))) {
            throw Erro.conflito("Marque aprovado ou reprovado em todos os candidatos");
        }
        for (ExameCandidato c : cs) {
            if (!"aprovado".equals(c.resultado)) continue;
            AlunoModalidade am = AlunoModalidade.<AlunoModalidade>find("cliente = ?1 and modalidade = ?2", c.cliente,
                    e.modalidade).firstResult();
            if (am == null) continue;
            boolean mesmaFaixa = am.faixa.id.equals(c.faixa.id);
            c.graduacao = graduacoes.graduar(storeId, new DadosGraduacao(am.id, mesmaFaixa ? "grau" : "faixa",
                    c.faixa.id, c.grau, e.data, d != null ? d.professorId() : null, "Aprovado no exame"), e);
        }
        e.status = "realizado";
    }

    @Transactional
    public void cancelar(UUID storeId, UUID exameId) {
        Exame e = exame(storeId, exameId);
        if (!"agendado".equals(e.status)) throw Erro.conflito("Este exame já foi concluído");
        for (ExameCandidato c : ExameCandidato.<ExameCandidato>list("exame", e)) {
            if (c.pagamento != null && Pagamento.PENDENTE.equals(c.pagamento.status)) c.pagamento.status = Pagamento.CANCELADO;
        }
        e.status = "cancelado";
    }
}
