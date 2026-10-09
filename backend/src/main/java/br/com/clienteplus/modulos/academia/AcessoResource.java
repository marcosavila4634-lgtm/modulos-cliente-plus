package br.com.clienteplus.modulos.academia;

import static br.com.clienteplus.modulos.comum.Formatos.FUSO;

import br.com.clienteplus.modulos.academia.AcessoContrato.*;
import br.com.clienteplus.modulos.clienteplus.Assinatura;
import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.clienteplus.Pagamento;
import br.com.clienteplus.modulos.comum.Erro;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.text.Collator;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

// Controle de acesso: regras, alunos bloqueados, dispositivos (catracas e
// leitores) e histórico de entradas.
@Path("/academia/acesso")
@Produces(MediaType.APPLICATION_JSON)
public class AcessoResource {

    private static final Collator ALFABETICA = Collator.getInstance(Locale.of("pt", "BR"));
    private static final Set<String> TIPOS = Set.of("catraca", "leitor_facial", "leitor_biometrico", "totem_qr");

    // Loja da requisição (academia ou artes marciais), até existir login.
    @Inject
    LojaAcademia lojaAtual;

    @Inject
    Configuracoes configuracoes;

    @Inject
    Acessos acessos;

    @Inject
    Matriculas matriculas;

    @GET
    public PainelAcesso painel() {
        AcademiaConfig cfg = configuracoes.config(lojaAtual.id());
        LocalDate hoje = Matriculas.hoje();

        Map<UUID, Long> acessosHojePorDispositivo = Acesso.<Acesso>list(
                        "storeId = ?1 and momento >= ?2 and dispositivo is not null", lojaAtual.id(), Acessos.inicioDo(hoje))
                .stream()
                .collect(Collectors.groupingBy(a -> a.dispositivo.id, Collectors.counting()));
        List<DispositivoJson> dispositivos = Dispositivo.<Dispositivo>list("storeId = ?1 order by createdAt", lojaAtual.id())
                .stream()
                .map(d -> json(d, acessosHojePorDispositivo.getOrDefault(d.id, 0L).intValue()))
                .toList();

        List<AcessoJson> historico = Acesso.<Acesso>find("storeId = ?1 order by momento desc", lojaAtual.id())
                .page(0, 200)
                .list()
                .stream()
                .map(Acessos::json)
                .toList();

        return new PainelAcesso(
                regras(cfg),
                configuracoes.horarios(lojaAtual.id()).stream().map(Configuracoes::json).toList(),
                configuracoes.abertoAgora(lojaAtual.id()),
                bloqueados(cfg, hoje),
                dispositivos,
                historico);
    }

    // Bloqueios manuais + alunos que a catraca barraria por inadimplência.
    private List<AlunoBloqueado> bloqueados(AcademiaConfig cfg, LocalDate hoje) {
        Map<UUID, AlunoBloqueado> porAluno = new HashMap<>();
        if (cfg.bloquearInadimplentes) {
            Map<UUID, Pagamento> maisAntigaPorMatricula = Pagamento.<Pagamento>list(
                            "storeId = ?1 and status = ?2 and assinatura is not null order by vencimento",
                            lojaAtual.id(), Pagamento.PENDENTE)
                    .stream()
                    .collect(Collectors.toMap(p -> p.assinatura.id, Function.identity(), (a, b) -> a));
            for (Assinatura m : Assinatura.<Assinatura>list("storeId = ?1 and status = ?2", lojaAtual.id(), Assinatura.ATIVA)) {
                Pagamento p = maisAntigaPorMatricula.get(m.id);
                if (p == null) continue;
                long dias = ChronoUnit.DAYS.between(p.vencimento, hoje);
                if (dias > cfg.toleranciaAtrasoDias) {
                    porAluno.put(m.cliente.id, new AlunoBloqueado(m.cliente.id, m.cliente.nome, "inadimplente",
                            "Mensalidade vencida há " + dias + " dias", p.vencimento.plusDays(cfg.toleranciaAtrasoDias + 1),
                            false, null));
                }
            }
        }
        for (Bloqueio b : Bloqueio.<Bloqueio>list("storeId = ?1 and removidoEm is null", lojaAtual.id())) {
            porAluno.put(b.cliente.id, new AlunoBloqueado(b.cliente.id, b.cliente.nome, "bloqueio_manual", b.motivo,
                    Acessos.dia(b.createdAt), true, b.id));
        }
        List<AlunoBloqueado> lista = new ArrayList<>(porAluno.values());
        lista.sort(Comparator.comparing(AlunoBloqueado::nome, ALFABETICA));
        return lista;
    }

    private static Regras regras(AcademiaConfig c) {
        return new Regras(c.bloquearInadimplentes, c.toleranciaAtrasoDias, c.bloquearForaDoHorario,
                c.intervaloCheckinMinutos);
    }

    @PUT
    @Path("/regras")
    @Transactional
    public Regras salvarRegras(DadosRegras d) {
        if (d == null) throw Erro.invalido("Preencha as regras");
        AcademiaConfig c = configuracoes.config(lojaAtual.id());
        if (d.toleranciaAtrasoDias() != null) {
            if (d.toleranciaAtrasoDias() < 0 || d.toleranciaAtrasoDias() > 60) {
                throw Erro.invalido("Tolerância: de 0 a 60 dias");
            }
            c.toleranciaAtrasoDias = d.toleranciaAtrasoDias();
        }
        if (d.intervaloCheckinMinutos() != null) {
            if (d.intervaloCheckinMinutos() < 0 || d.intervaloCheckinMinutos() > 720) {
                throw Erro.invalido("Intervalo entre check-ins: de 0 a 720 minutos");
            }
            c.intervaloCheckinMinutos = d.intervaloCheckinMinutos();
        }
        if (d.bloquearInadimplentes() != null) c.bloquearInadimplentes = d.bloquearInadimplentes();
        if (d.bloquearForaDoHorario() != null) c.bloquearForaDoHorario = d.bloquearForaDoHorario();
        return regras(c);
    }

    // ---------- Bloqueio manual ----------

    @POST
    @Path("/bloqueios")
    @Transactional
    public void bloquear(NovoBloqueio pedido) {
        if (pedido == null || pedido.alunoId() == null) throw Erro.invalido("Escolha o aluno");
        String motivo = pedido.motivo() != null ? pedido.motivo().trim() : "";
        if (motivo.length() < 3) throw Erro.invalido("Informe o motivo do bloqueio");
        Cliente aluno = matriculas.aluno(lojaAtual.id(), pedido.alunoId());
        if (acessos.bloqueioAtivo(aluno) != null) throw Erro.conflito("Este aluno já está bloqueado");
        Bloqueio b = new Bloqueio();
        b.storeId = lojaAtual.id();
        b.cliente = aluno;
        b.motivo = motivo;
        b.persist();
    }

    @POST
    @Path("/bloqueios/{id}/remover")
    @Transactional
    public void desbloquear(@PathParam("id") UUID id) {
        Bloqueio b = Bloqueio.findById(id);
        if (b == null || !b.storeId.equals(lojaAtual.id())) throw Erro.naoEncontrado("Bloqueio não encontrado");
        if (b.removidoEm == null) b.removidoEm = OffsetDateTime.now();
    }

    // ---------- Dispositivos ----------

    @POST
    @Path("/dispositivos")
    @Transactional
    public DispositivoJson cadastrarDispositivo(DadosDispositivo d) {
        Dispositivo disp = new Dispositivo();
        disp.storeId = lojaAtual.id();
        disp.token = UUID.randomUUID().toString().replace("-", "");
        disp.ativo = true;
        preencher(disp, d);
        disp.persist();
        return json(disp, 0);
    }

    @PUT
    @Path("/dispositivos/{id}")
    @Transactional
    public DispositivoJson atualizarDispositivo(@PathParam("id") UUID id, DadosDispositivo d) {
        Dispositivo disp = Dispositivo.findById(id);
        if (disp == null || !disp.storeId.equals(lojaAtual.id())) throw Erro.naoEncontrado("Dispositivo não encontrado");
        preencher(disp, d);
        return json(disp, 0);
    }

    private static void preencher(Dispositivo disp, DadosDispositivo d) {
        if (d == null || d.nome() == null || d.nome().isBlank()) throw Erro.invalido("Dê um nome ao dispositivo");
        if (d.tipo() == null || !TIPOS.contains(d.tipo())) throw Erro.invalido("Escolha o tipo do dispositivo");
        disp.nome = d.nome().trim();
        disp.tipo = d.tipo();
        disp.fabricante = d.fabricante() != null ? d.fabricante().trim() : "";
        disp.identificador = d.identificador() != null ? d.identificador().trim() : "";
        if (d.ativo() != null) disp.ativo = d.ativo();
    }

    // Chamada feita pela catraca/leitor (ou pelo "Testar entrada" da tela).
    // O dispositivo se identifica pelo token; o aluno, pelo CPF ou id.
    // Resposta: resultado "liberado" (ou "repetido") = abrir a catraca.
    @POST
    @Path("/dispositivos/entrada")
    @Transactional
    public ResultadoAcesso entrada(EntradaDispositivo pedido) {
        if (pedido == null || pedido.token() == null) throw Erro.invalido("Informe o token do dispositivo");
        Dispositivo disp = Dispositivo.<Dispositivo>find("token", pedido.token()).firstResult();
        if (disp == null) throw Erro.naoEncontrado("Dispositivo não encontrado");
        if (!disp.ativo) throw Erro.conflito("Este dispositivo está desativado");
        disp.ultimoContato = OffsetDateTime.now();

        Cliente aluno;
        if (pedido.alunoId() != null) {
            aluno = matriculas.aluno(disp.storeId, pedido.alunoId());
        } else {
            String cpf = pedido.documento() != null ? pedido.documento().replaceAll("\\D", "") : "";
            if (cpf.length() != 11) throw Erro.invalido("Informe o CPF do aluno (11 números)");
            aluno = Cliente.<Cliente>find("storeId = ?1 and cpf = ?2", disp.storeId, cpf).firstResult();
            if (aluno == null) throw Erro.naoEncontrado("Nenhum aluno com este CPF");
        }
        return acessos.registrar(disp.storeId, aluno, disp.tipo, disp, false, "");
    }

    private static DispositivoJson json(Dispositivo d, int acessosHoje) {
        return new DispositivoJson(d.id, d.nome, d.tipo, d.fabricante, d.identificador, d.token, d.ativo,
                d.ultimoContato != null ? d.ultimoContato.atZoneSameInstant(FUSO).toOffsetDateTime() : null,
                acessosHoje);
    }
}
