package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.academia.AlunosContrato.*;
import br.com.clienteplus.modulos.clienteplus.Assinatura;
import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.clienteplus.Pagamento;
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
import org.eclipse.microprofile.config.inject.ConfigProperty;

// Alunos do módulo Academia (clientes do Cliente Plus) e suas matrículas.
@Path("/academia/alunos")
@Produces(MediaType.APPLICATION_JSON)
public class AlunosResource {

    private static final Collator ALFABETICA = Collator.getInstance(Locale.of("pt", "BR"));

    // Loja de exemplo, até existir login (application.properties).
    @ConfigProperty(name = "academia.store-id")
    UUID storeId;

    @Inject
    Matriculas matriculas;

    @Inject
    RegistrosTreino registros;

    // Lista completa com a situação de cada aluno; a busca e os filtros são
    // feitos na tela.
    @GET
    public ListaAlunos listar() {
        Map<UUID, Assinatura> ativaPorAluno = Assinatura.<Assinatura>list(
                        "storeId = ?1 and status = ?2", storeId, Assinatura.ATIVA)
                .stream()
                .collect(Collectors.toMap(a -> a.cliente.id, Function.identity(), (a, b) -> a));

        // A mensalidade em aberto mais antiga de cada matrícula.
        Map<UUID, Pagamento> proximaPorMatricula = Pagamento.<Pagamento>list(
                        "storeId = ?1 and status = ?2 and assinatura is not null order by vencimento", storeId, Pagamento.PENDENTE)
                .stream()
                .collect(Collectors.toMap(p -> p.assinatura.id, Function.identity(), (a, b) -> a));

        List<AlunoResumo> alunos = Cliente.<Cliente>list("storeId", storeId).stream()
                .sorted(Comparator.comparing((Cliente c) -> c.nome, ALFABETICA))
                .map(c -> {
                    Assinatura ativa = ativaPorAluno.get(c.id);
                    Pagamento proxima = ativa != null ? proximaPorMatricula.get(ativa.id) : null;
                    return new AlunoResumo(
                            c.id,
                            c.nome,
                            c.telefone,
                            c.email,
                            ativa != null ? ativa.plano.nome : null,
                            proxima != null ? proxima.vencimento : null,
                            Matriculas.situacao(ativa, proxima),
                            c.createdAt);
                })
                .toList();

        Map<String, Long> porSituacao = alunos.stream()
                .collect(Collectors.groupingBy(AlunoResumo::situacao, Collectors.counting()));
        Contagem contagem = new Contagem(
                alunos.size(),
                porSituacao.getOrDefault("ativo", 0L).intValue(),
                porSituacao.getOrDefault("em_atraso", 0L).intValue(),
                porSituacao.getOrDefault("sem_matricula", 0L).intValue());

        return new ListaAlunos(alunos, contagem);
    }

    @GET
    @Path("/{id}")
    public AlunoDetalhe buscar(@PathParam("id") UUID id) {
        return matriculas.detalhe(matriculas.aluno(storeId, id));
    }

    // Dias treinados (marcados pelo aluno na área do cliente) e evolução de carga.
    @GET
    @Path("/{id}/treinos-feitos")
    public TreinosContrato.TreinosFeitos treinosFeitos(@PathParam("id") UUID id) {
        return registros.treinosFeitos(matriculas.aluno(storeId, id));
    }

    @POST
    @Transactional
    public AlunoDetalhe cadastrar(DadosAluno dados) {
        return matriculas.detalhe(matriculas.cadastrar(storeId, dados));
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public AlunoDetalhe atualizar(@PathParam("id") UUID id, DadosAluno dados) {
        return matriculas.detalhe(matriculas.atualizar(storeId, id, dados));
    }

    @POST
    @Path("/{id}/matricula")
    @Transactional
    public AlunoDetalhe matricular(@PathParam("id") UUID id, NovaMatricula pedido) {
        matriculas.matricular(storeId, id, pedido);
        return matriculas.detalhe(matriculas.aluno(storeId, id));
    }

    @POST
    @Path("/{id}/matricula/cancelar")
    @Transactional
    public AlunoDetalhe cancelarMatricula(@PathParam("id") UUID id) {
        matriculas.cancelarMatricula(storeId, id);
        return matriculas.detalhe(matriculas.aluno(storeId, id));
    }
}
