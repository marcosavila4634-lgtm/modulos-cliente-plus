package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.academia.AgendaContrato.*;
import br.com.clienteplus.modulos.academia.TreinosContrato.TreinoDoAluno;
import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.Erro;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

// O que o aluno vê na área do cliente do Cliente Plus (abas "Meu treino" e
// "Aulas"). No projeto principal o aluno está logado; aqui ele é escolhido
// pelo id.
@Path("/area-cliente")
@Produces(MediaType.APPLICATION_JSON)
public class AreaClienteResource {

    // Loja da requisição (academia ou artes marciais), até existir login.
    @Inject
    LojaAcademia lojaAtual;

    @Inject
    Matriculas matriculas;

    @Inject
    Treinos treinos;

    @Inject
    Aulas aulas;

    @Inject
    Configuracoes configuracoes;

    @Inject
    Beneficios beneficios;

    @Inject
    RegistrosTreino registros;

    @GET
    @Path("/{clienteId}/treino")
    public TreinoDoAluno treino(@PathParam("clienteId") UUID clienteId) {
        Cliente aluno = matriculas.aluno(lojaAtual.id(), clienteId);
        Ficha ficha = treinos.fichaAtiva(aluno);
        return new TreinoDoAluno(nomeAcademia(), aluno.nome, ficha != null ? Treinos.json(ficha) : null,
                registros.deHoje(aluno), registros.ultimasCargas(aluno), registros.diasTreinadosNoMes(aluno));
    }

    // Marcar um exercício de hoje como feito (e anotar a carga).
    @POST
    @Path("/{clienteId}/treino/registro")
    public TreinoDoAluno registrar(@PathParam("clienteId") UUID clienteId, TreinosContrato.DadosRegistro dados) {
        registros.registrar(lojaAtual.id(), matriculas.aluno(lojaAtual.id(), clienteId), dados);
        return treino(clienteId);
    }

    // Aulas de hoje e dos próximos 6 dias que ainda não acabaram.
    @GET
    @Path("/{clienteId}/aulas")
    public AulasDoAluno aulas(@PathParam("clienteId") UUID clienteId) {
        Cliente aluno = matriculas.aluno(lojaAtual.id(), clienteId);
        LocalDate hoje = Matriculas.hoje();
        boolean matriculado = matriculas.matriculaAtiva(aluno) != null;

        Set<UUID> fixoEm = new HashSet<>();
        for (TurmaAluno t : TurmaAluno.<TurmaAluno>list("cliente = ?1 and ativo = true", aluno)) fixoEm.add(t.horario.id);
        Map<String, String> minhas = new HashMap<>();
        for (Presenca p : Presenca.<Presenca>list("cliente = ?1 and data >= ?2", aluno, hoje)) {
            minhas.put(p.horario.id + "|" + p.data, p.status);
        }

        OffsetDateTime agora = OffsetDateTime.now();
        List<AulaDoAluno> lista = aulas.entre(lojaAtual.id(), hoje, hoje.plusDays(6), null).stream()
                .filter(a -> a.fim().isAfter(agora))
                .map(a -> {
                    String p = minhas.get(a.horarioId() + "|" + a.data());
                    String situacao;
                    if (fixoEm.contains(a.horarioId())) situacao = Presenca.CANCELADO.equals(p) ? null : "fixo";
                    else situacao = p == null || Presenca.CANCELADO.equals(p) ? null : p;
                    boolean lotada = a.ocupados() >= a.capacidade();
                    String motivo = !matriculado ? "Sem matrícula ativa" : lotada ? "Lotada" : null;
                    return new AulaDoAluno(a, situacao, situacao == null && motivo == null, motivo);
                })
                .toList();
        return new AulasDoAluno(nomeAcademia(), aluno.nome, lista);
    }

    @POST
    @Path("/{clienteId}/aulas/reservar")
    public void reservar(@PathParam("clienteId") UUID clienteId, ReservaAluno r) {
        if (r == null || r.horarioId() == null) throw Erro.invalido("Escolha a aula");
        aulas.reservar(lojaAtual.id(), r.horarioId(), matriculas.aluno(lojaAtual.id(), clienteId), r.data(), "area_cliente");
    }

    @POST
    @Path("/{clienteId}/aulas/cancelar")
    public void cancelar(@PathParam("clienteId") UUID clienteId, ReservaAluno r) {
        if (r == null || r.horarioId() == null) throw Erro.invalido("Escolha a aula");
        aulas.cancelarReserva(lojaAtual.id(), r.horarioId(), matriculas.aluno(lojaAtual.id(), clienteId), r.data());
    }

    public record ReservaAluno(UUID horarioId, LocalDate data) {}

    @GET
    @Path("/{clienteId}/beneficios")
    public FinanceiroContrato.BeneficiosDoAluno beneficios(@PathParam("clienteId") UUID clienteId) {
        return beneficios.doAluno(lojaAtual.id(), matriculas.aluno(lojaAtual.id(), clienteId), nomeAcademia());
    }

    @POST
    @Path("/{clienteId}/beneficios/{beneficioId}/resgatar")
    public void resgatar(@PathParam("clienteId") UUID clienteId, @PathParam("beneficioId") UUID beneficioId) {
        beneficios.resgatar(lojaAtual.id(), beneficioId, matriculas.aluno(lojaAtual.id(), clienteId), "area_cliente");
    }

    private String nomeAcademia() {
        return configuracoes.painel(lojaAtual.id()).nomeAcademia;
    }
}
