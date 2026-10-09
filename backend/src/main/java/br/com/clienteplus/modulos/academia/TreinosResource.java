package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.academia.TreinosContrato.*;
import br.com.clienteplus.modulos.clienteplus.Assinatura;
import br.com.clienteplus.modulos.clienteplus.Cliente;
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
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

// Treinos: painel (alunos x fichas, modelos) e fichas de treino.
@Path("/academia")
@Produces(MediaType.APPLICATION_JSON)
public class TreinosResource {

    private static final Collator ALFABETICA = Collator.getInstance(Locale.of("pt", "BR"));

    // Loja da requisição (academia ou artes marciais), até existir login.
    @Inject
    LojaAcademia lojaAtual;

    @Inject
    Treinos treinos;

    @Inject
    Matriculas matriculas;

    // Alunos com matrícula ativa e a situação da ficha de cada um, e os modelos.
    @GET
    @Path("/treinos")
    public PainelTreinos painel() {
        List<Ficha> fichas = Ficha.list("storeId = ?1 and status = ?2", lojaAtual.id(), Ficha.ATIVA);
        Map<UUID, Ficha> fichaPorAluno = fichas.stream()
                .filter(f -> !f.modelo())
                .collect(Collectors.toMap(f -> f.cliente.id, Function.identity(), (a, b) -> a));

        List<AlunoTreino> alunos = Assinatura.<Assinatura>list(
                        "storeId = ?1 and status = ?2", lojaAtual.id(), Assinatura.ATIVA)
                .stream()
                .map(m -> m.cliente)
                .distinct()
                .sorted(Comparator.comparing((Cliente c) -> c.nome, ALFABETICA))
                .map(c -> {
                    Ficha f = fichaPorAluno.get(c.id);
                    return f == null
                            ? new AlunoTreino(c.id, c.nome, "sem_ficha", null)
                            : new AlunoTreino(c.id, c.nome, Treinos.situacao(f), Treinos.resumo(f));
                })
                .toList();

        Map<UUID, Long> alunosPorModelo = fichas.stream()
                .filter(f -> !f.modelo() && f.modeloOrigemId != null)
                .collect(Collectors.groupingBy(f -> f.modeloOrigemId, Collectors.counting()));
        List<ModeloResumo> modelos = fichas.stream()
                .filter(Ficha::modelo)
                .sorted(Comparator.comparing((Ficha f) -> f.nome, ALFABETICA))
                .map(f -> new ModeloResumo(
                        f.id,
                        f.nome,
                        f.objetivo,
                        f.professor != null ? f.professor.nome : null,
                        Treinos.divisoes(f),
                        f.treinos.stream().mapToInt(t -> t.exercicios.size()).sum(),
                        alunosPorModelo.getOrDefault(f.id, 0L)))
                .toList();

        Map<String, Long> porSituacao = alunos.stream()
                .collect(Collectors.groupingBy(AlunoTreino::situacao, Collectors.counting()));
        ContagemTreinos contagem = new ContagemTreinos(
                alunos.size(),
                porSituacao.getOrDefault("sem_ficha", 0L).intValue(),
                porSituacao.getOrDefault("vencida", 0L).intValue(),
                porSituacao.getOrDefault("vence_em_breve", 0L).intValue(),
                porSituacao.getOrDefault("em_dia", 0L).intValue());

        return new PainelTreinos(alunos, modelos, contagem);
    }

    // Novo modelo (sem alunoId) ou nova ficha de aluno (vazia ou de um modelo).
    @POST
    @Path("/fichas")
    @Transactional
    public FichaJson criar(NovaFicha pedido) {
        Cliente aluno = pedido != null && pedido.alunoId() != null
                ? matriculas.aluno(lojaAtual.id(), pedido.alunoId())
                : null;
        return Treinos.json(treinos.criarFicha(lojaAtual.id(), pedido, aluno));
    }

    @GET
    @Path("/fichas/{id}")
    public FichaJson buscar(@PathParam("id") UUID id) {
        return Treinos.json(treinos.ficha(lojaAtual.id(), id));
    }

    @PUT
    @Path("/fichas/{id}")
    @Transactional
    public FichaJson salvar(@PathParam("id") UUID id, DadosFicha dados) {
        return Treinos.json(treinos.salvarFicha(lojaAtual.id(), id, dados));
    }

    // Modelo: exclui. Ficha de aluno: encerra.
    @POST
    @Path("/fichas/{id}/excluir")
    public void excluir(@PathParam("id") UUID id) {
        treinos.excluirFicha(lojaAtual.id(), id);
    }
}
