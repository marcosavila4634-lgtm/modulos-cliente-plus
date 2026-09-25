package br.com.clienteplus.modulos.academia;

import static br.com.clienteplus.modulos.comum.Formatos.FUSO;
import static br.com.clienteplus.modulos.comum.Formatos.numero;

import br.com.clienteplus.modulos.academia.AlunosContrato.*;
import br.com.clienteplus.modulos.clienteplus.Pagamento;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;
import java.util.function.Predicate;
import org.eclipse.microprofile.config.inject.ConfigProperty;

// Faturamento: mensalidades (pagamentos do Cliente Plus) da academia.
@Path("/academia/cobrancas")
@Produces(MediaType.APPLICATION_JSON)
public class CobrancasResource {

    @ConfigProperty(name = "academia.store-id")
    UUID storeId;

    @Inject
    Matriculas matriculas;

    // Todas as mensalidades (menos as canceladas) e os totais do mês atual.
    // Os filtros (a receber, em atraso, pagas) são feitos na tela.
    @GET
    public Faturamento listar() {
        List<Cobranca> cobrancas = Pagamento.<Pagamento>list(
                        "storeId = ?1 and status <> ?2 order by vencimento desc", storeId, Pagamento.CANCELADO)
                .stream()
                .map(Matriculas::cobranca)
                .toList();

        LocalDate hoje = Matriculas.hoje();
        YearMonth mes = YearMonth.from(hoje);

        List<Cobranca> recebidas = filtrar(cobrancas, c -> "paga".equals(c.status())
                && YearMonth.from(c.pagoEm().atZoneSameInstant(FUSO)).equals(mes));
        List<Cobranca> aReceber = filtrar(cobrancas, c -> "pendente".equals(c.status())
                && YearMonth.from(c.vencimento()).equals(mes));
        List<Cobranca> atrasadas = filtrar(cobrancas, c -> "atrasada".equals(c.status()));

        return new Faturamento(
                new ResumoFaturamento(
                        soma(recebidas), recebidas.size(),
                        soma(aReceber), aReceber.size(),
                        soma(atrasadas), atrasadas.size()),
                cobrancas);
    }

    @POST
    @Path("/{id}/receber")
    @Transactional
    public Cobranca receber(@PathParam("id") UUID id, Receber pedido) {
        return Matriculas.cobranca(matriculas.receber(storeId, id, pedido));
    }

    private static List<Cobranca> filtrar(List<Cobranca> cobrancas, Predicate<Cobranca> filtro) {
        return cobrancas.stream().filter(filtro).toList();
    }

    private static Number soma(List<Cobranca> cobrancas) {
        return numero(cobrancas.stream()
                .map(c -> new BigDecimal(c.valor().toString()))
                .reduce(BigDecimal.ZERO, BigDecimal::add));
    }
}
