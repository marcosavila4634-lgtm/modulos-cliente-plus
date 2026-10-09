package br.com.clienteplus.modulos.academia;

import static br.com.clienteplus.modulos.comum.Formatos.FUSO;
import static br.com.clienteplus.modulos.comum.Formatos.numero;

import br.com.clienteplus.modulos.academia.AgendaContrato.*;
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
import java.math.BigDecimal;
import java.text.Collator;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

// Serviços avulsos e as vendas deles.
@Path("/academia")
@Produces(MediaType.APPLICATION_JSON)
public class ServicosResource {

    private static final Collator ALFABETICA = Collator.getInstance(Locale.of("pt", "BR"));

    // Loja da requisição (academia ou artes marciais), até existir login.
    @Inject
    LojaAcademia lojaAtual;

    @Inject
    Servicos servicos;

    @Inject
    Matriculas matriculas;

    // Serviços (ativos primeiro) com vendas do mês e as últimas 100 vendas.
    @GET
    @Path("/servicos")
    public PainelServicos painel() {
        YearMonth mes = YearMonth.from(Matriculas.hoje());
        List<Venda> vendas = Venda.list("storeId = ?1 order by createdAt desc", lojaAtual.id());
        List<Venda> doMes = vendas.stream()
                .filter(v -> !Pagamento.CANCELADO.equals(v.pagamento.status))
                .filter(v -> YearMonth.from(v.createdAt.atZoneSameInstant(FUSO)).equals(mes))
                .toList();
        Map<UUID, List<Venda>> porServico = doMes.stream().collect(Collectors.groupingBy(v -> v.servico.id));

        List<ServicoJson> lista = Servico.<Servico>list("storeId", lojaAtual.id()).stream()
                .sorted(Comparator.comparing((Servico s) -> !s.ativo).thenComparing(s -> s.nome, ALFABETICA))
                .map(s -> {
                    List<Venda> vs = porServico.getOrDefault(s.id, List.of());
                    return Servicos.json(s, vs.size(), soma(vs));
                })
                .toList();

        BigDecimal recebido = vendas.stream()
                .filter(v -> Pagamento.PAGO.equals(v.pagamento.status) && v.pagamento.pagoEm != null
                        && YearMonth.from(v.pagamento.pagoEm.atZoneSameInstant(FUSO)).equals(mes))
                .map(v -> v.valor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new PainelServicos(
                lista,
                vendas.stream().limit(100).map(Servicos::json).toList(),
                numero(soma(doMes)),
                numero(recebido));
    }

    private static BigDecimal soma(List<Venda> vendas) {
        return vendas.stream().map(v -> v.valor).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @POST
    @Path("/servicos")
    public ServicoJson cadastrar(DadosServico dados) {
        return Servicos.json(servicos.salvar(lojaAtual.id(), null, dados), 0, BigDecimal.ZERO);
    }

    @PUT
    @Path("/servicos/{id}")
    public ServicoJson atualizar(@PathParam("id") UUID id, DadosServico dados) {
        return Servicos.json(servicos.salvar(lojaAtual.id(), id, dados), 0, BigDecimal.ZERO);
    }

    @POST
    @Path("/vendas")
    @Transactional
    public VendaJson vender(NovaVenda pedido) {
        if (pedido == null || pedido.alunoId() == null) throw Erro.invalido("Escolha o aluno");
        return Servicos.json(servicos.vender(lojaAtual.id(), matriculas.aluno(lojaAtual.id(), pedido.alunoId()), pedido));
    }

    @POST
    @Path("/vendas/{id}/cancelar")
    public void cancelar(@PathParam("id") UUID id) {
        servicos.cancelar(lojaAtual.id(), id);
    }
}
