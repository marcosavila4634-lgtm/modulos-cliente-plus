package br.com.clienteplus.modulos.academia;

import static br.com.clienteplus.modulos.comum.Formatos.FUSO;

import br.com.clienteplus.modulos.academia.AcessoContrato.*;
import br.com.clienteplus.modulos.clienteplus.Assinatura;
import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.clienteplus.Pagamento;
import br.com.clienteplus.modulos.comum.Erro;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Set;
import java.util.UUID;

// Regras do controle de acesso (check-in na recepção, catracas e leitores).
//
// Um aluno é BLOQUEADO quando (nesta ordem):
//   1. tem bloqueio manual ativo;
//   2. não tem matrícula ativa;
//   3. a mensalidade mais antiga em aberto venceu há mais dias que a
//      tolerância (se "bloquear inadimplentes" estiver ligado);
//   4. a academia está fechada (se "bloquear fora do horário" estiver ligado).
// A recepção pode liberar mesmo assim (fica marcado como liberação manual).
// Entrada repetida dentro do intervalo configurado não conta de novo.
// Tentativas bloqueadas de dispositivos ficam no histórico; as da recepção
// não (a recepção vê o motivo na hora).
@ApplicationScoped
public class Acessos {

    // Quem entrou nos últimos 90 minutos ainda está na academia (estimativa).
    static final int MINUTOS_NA_ACADEMIA = 90;

    static final Set<String> MEIOS = Set.of("recepcao", "catraca", "leitor_facial", "leitor_biometrico", "totem_qr", "app");

    private static final DateTimeFormatter DATA = DateTimeFormatter.ofPattern("dd/MM");
    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");

    @Inject
    Configuracoes configuracoes;

    @Inject
    Matriculas matriculas;

    // motivo null = liberado
    public record Verificacao(String motivo, String mensagem) {}

    public Bloqueio bloqueioAtivo(Cliente aluno) {
        return Bloqueio.<Bloqueio>find("cliente = ?1 and removidoEm is null order by createdAt desc", aluno)
                .firstResult();
    }

    public Verificacao verificar(UUID storeId, Cliente aluno) {
        AcademiaConfig cfg = configuracoes.config(storeId);
        Bloqueio b = bloqueioAtivo(aluno);
        if (b != null) return new Verificacao("bloqueio_manual", "Acesso bloqueado pela academia: " + b.motivo);

        Assinatura m = matriculas.matriculaAtiva(aluno);
        if (m == null) return new Verificacao("sem_matricula", "Aluno sem matrícula ativa");

        if (cfg.bloquearInadimplentes) {
            Pagamento p = matriculas.proximaMensalidade(m);
            if (p != null) {
                long dias = ChronoUnit.DAYS.between(p.vencimento, Matriculas.hoje());
                if (dias > cfg.toleranciaAtrasoDias) {
                    return new Verificacao("inadimplente",
                            "Mensalidade vencida há " + dias + " dias (" + p.vencimento.format(DATA) + ")");
                }
            }
        }
        if (cfg.bloquearForaDoHorario && !configuracoes.abertoAgora(storeId)) {
            return new Verificacao("fora_do_horario", "A academia está fechada neste horário");
        }
        return new Verificacao(null, "Acesso liberado");
    }

    @Transactional
    public ResultadoAcesso registrar(
            UUID storeId, Cliente aluno, String meio, Dispositivo dispositivo, boolean liberarMesmoAssim, String observacao) {
        if (!MEIOS.contains(meio)) throw Erro.invalido("Meio de acesso inválido");
        AcademiaConfig cfg = configuracoes.config(storeId);
        Verificacao v = verificar(storeId, aluno);
        Assinatura m = matriculas.matriculaAtiva(aluno);
        String plano = m != null ? m.plano.nome : null;

        if (v.motivo() != null && !liberarMesmoAssim) {
            AcessoJson registro = null;
            if (!"recepcao".equals(meio)) {
                registro = json(novo(storeId, aluno, meio, dispositivo, Acesso.BLOQUEADO, v.motivo(), false, ""));
            }
            return new ResultadoAcesso("bloqueado", v.motivo(), v.mensagem(), aluno.id, aluno.nome, plano, registro);
        }

        if (cfg.intervaloCheckinMinutos > 0) {
            Acesso recente = Acesso.<Acesso>find(
                            "cliente = ?1 and resultado = ?2 and momento >= ?3 order by momento desc",
                            aluno, Acesso.LIBERADO, OffsetDateTime.now().minusMinutes(cfg.intervaloCheckinMinutos))
                    .firstResult();
            if (recente != null) {
                return new ResultadoAcesso("repetido", null,
                        "Entrada já registrada hoje às " + recente.momento.atZoneSameInstant(FUSO).format(HORA),
                        aluno.id, aluno.nome, plano, json(recente));
            }
        }

        boolean manual = v.motivo() != null;
        Acesso a = novo(storeId, aluno, meio, dispositivo, Acesso.LIBERADO, v.motivo(), manual,
                observacao != null ? observacao.trim() : "");
        return new ResultadoAcesso("liberado", v.motivo(),
                manual ? "Entrada liberada pela recepção" : "Entrada liberada. Bom treino!",
                aluno.id, aluno.nome, plano, json(a));
    }

    private static Acesso novo(UUID storeId, Cliente aluno, String meio, Dispositivo dispositivo, String resultado,
            String motivo, boolean manual, String observacao) {
        Acesso a = new Acesso();
        a.storeId = storeId;
        a.cliente = aluno;
        a.momento = OffsetDateTime.now();
        a.meio = meio;
        a.dispositivo = dispositivo;
        a.resultado = resultado;
        a.motivo = motivo;
        a.liberadoManual = manual;
        a.observacao = observacao;
        a.persist();
        return a;
    }

    public static AcessoJson json(Acesso a) {
        return new AcessoJson(
                a.id,
                a.cliente.id,
                a.cliente.nome,
                a.momento,
                a.meio,
                a.dispositivo != null ? a.dispositivo.nome : null,
                a.resultado,
                a.motivo,
                a.liberadoManual,
                a.observacao);
    }

    // Início e fim de um dia no fuso do Brasil.
    static OffsetDateTime inicioDo(LocalDate dia) {
        return dia.atStartOfDay(FUSO).toOffsetDateTime();
    }

    static LocalDate dia(OffsetDateTime instante) {
        return instante.atZoneSameInstant(FUSO).toLocalDate();
    }
}
