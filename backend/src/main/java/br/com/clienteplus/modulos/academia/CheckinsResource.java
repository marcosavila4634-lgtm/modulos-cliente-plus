package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.academia.AcessoContrato.*;
import br.com.clienteplus.modulos.comum.Erro;
import br.com.clienteplus.modulos.comum.Formatos;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.eclipse.microprofile.config.inject.ConfigProperty;

// Check-in feito pela recepção e lista de entradas do dia.
@Path("/academia/checkins")
@Produces(MediaType.APPLICATION_JSON)
public class CheckinsResource {

    @ConfigProperty(name = "academia.store-id")
    UUID storeId;

    @Inject
    Acessos acessos;

    @Inject
    Matriculas matriculas;

    // Entradas de um dia (padrão: hoje), da mais recente para a mais antiga.
    @GET
    public PainelCheckins painel(@QueryParam("data") String data) {
        LocalDate hoje = Matriculas.hoje();
        LocalDate dia;
        try {
            dia = data == null || data.isBlank() ? hoje : LocalDate.parse(data);
        } catch (DateTimeParseException e) {
            throw Erro.invalido("Data inválida");
        }
        boolean ehHoje = dia.equals(hoje);

        List<Acesso> doDia = Acesso.list("storeId = ?1 and momento >= ?2 and momento < ?3 order by momento desc",
                storeId, Acessos.inicioDo(dia), Acessos.inicioDo(dia.plusDays(1)));
        List<Acesso> liberados = doDia.stream().filter(a -> Acesso.LIBERADO.equals(a.resultado)).toList();

        // Comparação com o mesmo dia da semana anterior (hoje: até a mesma hora).
        OffsetDateTime inicioAnterior = Acessos.inicioDo(dia.minusWeeks(1));
        OffsetDateTime fimAnterior = ehHoje ? OffsetDateTime.now().minusWeeks(1) : Acessos.inicioDo(dia.minusWeeks(1).plusDays(1));
        long anterior = Acesso.count("storeId = ?1 and resultado = ?2 and momento >= ?3 and momento < ?4",
                storeId, Acesso.LIBERADO, inicioAnterior, fimAnterior);

        OffsetDateTime limiteAgora = OffsetDateTime.now().minusMinutes(Acessos.MINUTOS_NA_ACADEMIA);
        int agora = ehHoje
                ? liberados.stream()
                        .filter(a -> !a.momento.isBefore(limiteAgora))
                        .map(a -> a.cliente.id)
                        .collect(Collectors.toSet())
                        .size()
                : 0;

        String ultimo = liberados.isEmpty() ? null
                : ehHoje ? Formatos.haQuanto(liberados.get(0).momento) : Formatos.diaEHora(liberados.get(0).momento);

        ResumoCheckins resumo = new ResumoCheckins(
                liberados.size(),
                variacao(liberados.size(), anterior),
                agora,
                (int) doDia.stream().filter(a -> Acesso.BLOQUEADO.equals(a.resultado)).count(),
                (int) liberados.stream().filter(a -> a.liberadoManual).count(),
                ultimo);
        return new PainelCheckins(dia, ehHoje, resumo, doDia.stream().map(Acessos::json).toList());
    }

    @POST
    public ResultadoAcesso registrar(NovoCheckin pedido) {
        if (pedido == null || pedido.alunoId() == null) throw Erro.invalido("Escolha o aluno");
        return acessos.registrar(storeId, matriculas.aluno(storeId, pedido.alunoId()), "recepcao", null,
                Boolean.TRUE.equals(pedido.liberarMesmoAssim()), pedido.observacao());
    }

    static long variacao(double atual, double anterior) {
        if (anterior == 0) return atual > 0 ? 100 : 0;
        return Math.round((atual - anterior) * 100 / anterior);
    }
}
