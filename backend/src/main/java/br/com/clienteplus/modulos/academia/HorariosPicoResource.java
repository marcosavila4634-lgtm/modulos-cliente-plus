package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.academia.AcessoContrato.PainelPico;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import java.util.UUID;

// Horários de pico: média de entradas por dia da semana e hora.
@Path("/academia/horarios-de-pico")
@Produces(MediaType.APPLICATION_JSON)
public class HorariosPicoResource {

    // Loja da requisição (academia ou artes marciais), até existir login.
    @Inject
    LojaAcademia lojaAtual;

    @Inject
    HorariosPico pico;

    // semanas: quantas semanas para trás entram na média (1 a 12; padrão 4)
    @GET
    public PainelPico painel(@QueryParam("semanas") Integer semanas) {
        int s = semanas == null ? 4 : Math.max(1, Math.min(12, semanas));
        return pico.painel(lojaAtual.id(), s);
    }
}
