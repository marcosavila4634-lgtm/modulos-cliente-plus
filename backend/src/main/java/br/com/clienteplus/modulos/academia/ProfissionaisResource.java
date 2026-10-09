package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.academia.TreinosContrato.*;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

// Professores e demais profissionais da academia.
@Path("/academia/profissionais")
@Produces(MediaType.APPLICATION_JSON)
public class ProfissionaisResource {

    // Loja da requisição (academia ou artes marciais), até existir login.
    @Inject
    LojaAcademia lojaAtual;

    @Inject
    Treinos treinos;

    // Ativos primeiro, com quantos alunos cada um acompanha (fichas ativas).
    @GET
    public List<ProfissionalJson> listar() {
        Map<UUID, Long> alunosPorProfessor = Ficha.<Ficha>list(
                        "storeId = ?1 and status = ?2 and cliente is not null", lojaAtual.id(), Ficha.ATIVA)
                .stream()
                .filter(f -> f.professor != null)
                .collect(Collectors.groupingBy(f -> f.professor.id, Collectors.counting()));
        return Profissional.<Profissional>list("storeId = ?1 order by ativo desc, nome", lojaAtual.id()).stream()
                .map(p -> json(p, alunosPorProfessor.getOrDefault(p.id, 0L)))
                .toList();
    }

    @POST
    public ProfissionalJson cadastrar(DadosProfissional dados) {
        return json(treinos.salvarProfissional(lojaAtual.id(), null, dados), 0);
    }

    @PUT
    @Path("/{id}")
    public ProfissionalJson atualizar(@PathParam("id") UUID id, DadosProfissional dados) {
        return json(treinos.salvarProfissional(lojaAtual.id(), id, dados), 0);
    }

    private static ProfissionalJson json(Profissional p, long alunos) {
        return new ProfissionalJson(p.id, p.nome, p.especialidade, p.telefone, p.email, p.registro, p.ativo, alunos);
    }
}
