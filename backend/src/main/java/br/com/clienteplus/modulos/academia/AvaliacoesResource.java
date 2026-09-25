package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.academia.AvaliacoesContrato.*;
import br.com.clienteplus.modulos.clienteplus.Assinatura;
import br.com.clienteplus.modulos.clienteplus.Cliente;
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
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.eclipse.microprofile.config.inject.ConfigProperty;

// Avaliação física: painel (alunos x última avaliação), histórico do aluno e
// cadastro/edição de avaliações.
@Path("/academia/avaliacoes")
@Produces(MediaType.APPLICATION_JSON)
public class AvaliacoesResource {

    private static final Collator ALFABETICA = Collator.getInstance(Locale.of("pt", "BR"));

    @ConfigProperty(name = "academia.store-id")
    UUID storeId;

    @Inject
    Avaliacoes avaliacoes;

    @Inject
    Matriculas matriculas;

    @Inject
    Configuracoes configuracoes;

    // Alunos com matrícula ativa e a situação da avaliação de cada um.
    @GET
    public PainelAvaliacoes painel() {
        int dias = configuracoes.config(storeId).reavaliacaoDias;
        List<Avaliacao> todas = Avaliacao.list("storeId = ?1 order by data desc, createdAt desc", storeId);
        Map<UUID, List<Avaliacao>> porAluno = todas.stream().collect(Collectors.groupingBy(a -> a.cliente.id));

        List<AlunoAvaliacao> alunos = Assinatura.<Assinatura>list("storeId = ?1 and status = ?2", storeId, Assinatura.ATIVA)
                .stream()
                .map(m -> m.cliente)
                .collect(Collectors.toMap(c -> c.id, Function.identity(), (a, b) -> a))
                .values()
                .stream()
                .sorted(Comparator.comparing((Cliente c) -> c.nome, ALFABETICA))
                .map(c -> {
                    List<Avaliacao> lista = porAluno.getOrDefault(c.id, List.of());
                    Avaliacao ultima = lista.isEmpty() ? null : lista.get(0);
                    AvaliacaoJson j = ultima != null ? Avaliacoes.json(ultima) : null;
                    return new AlunoAvaliacao(
                            c.id,
                            c.nome,
                            avaliacoes.situacao(ultima != null ? ultima.data : null, dias),
                            ultima != null ? ultima.data : null,
                            ultima != null ? ultima.data.plusDays(dias) : null,
                            lista.size(),
                            j != null ? j.peso() : null,
                            j != null ? j.gorduraPct() : null);
                })
                .toList();

        Map<String, Long> porSituacao = alunos.stream()
                .collect(Collectors.groupingBy(AlunoAvaliacao::situacao, Collectors.counting()));
        YearMonth mes = YearMonth.from(Matriculas.hoje());
        int noMes = (int) todas.stream().filter(a -> YearMonth.from(a.data).equals(mes)).count();

        return new PainelAvaliacoes(
                dias,
                alunos,
                todas.stream().limit(8).map(Avaliacoes::json).toList(),
                new ContagemAvaliacoes(
                        alunos.size(),
                        porSituacao.getOrDefault("sem_avaliacao", 0L).intValue(),
                        porSituacao.getOrDefault("pendente", 0L).intValue(),
                        porSituacao.getOrDefault("em_dia", 0L).intValue(),
                        noMes));
    }

    @GET
    @Path("/aluno/{alunoId}")
    public HistoricoAvaliacoes historico(@PathParam("alunoId") UUID alunoId) {
        return avaliacoes.historico(storeId, matriculas.aluno(storeId, alunoId));
    }

    @GET
    @Path("/{id}")
    public AvaliacaoJson buscar(@PathParam("id") UUID id) {
        return Avaliacoes.json(avaliacoes.avaliacao(storeId, id));
    }

    @POST
    @Transactional
    public AvaliacaoJson cadastrar(DadosAvaliacao dados) {
        if (dados == null || dados.alunoId() == null) throw Erro.invalido("Escolha o aluno");
        Cliente aluno = matriculas.aluno(storeId, dados.alunoId());
        return Avaliacoes.json(avaliacoes.salvar(storeId, null, aluno, dados));
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public AvaliacaoJson atualizar(@PathParam("id") UUID id, DadosAvaliacao dados) {
        return Avaliacoes.json(avaliacoes.salvar(storeId, id, null, dados));
    }

    @POST
    @Path("/{id}/excluir")
    public void excluir(@PathParam("id") UUID id) {
        avaliacoes.excluir(storeId, id);
    }
}
