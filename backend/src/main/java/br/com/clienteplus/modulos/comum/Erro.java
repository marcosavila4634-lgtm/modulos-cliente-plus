package br.com.clienteplus.modulos.comum;

import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Map;

// Erros da API no formato {"error": "mensagem"}, que o frontend mostra na tela.
public final class Erro {

    private Erro() {}

    public static WebApplicationException invalido(String mensagem) {
        return com(Response.Status.BAD_REQUEST, mensagem);
    }

    public static WebApplicationException naoEncontrado(String mensagem) {
        return com(Response.Status.NOT_FOUND, mensagem);
    }

    public static WebApplicationException conflito(String mensagem) {
        return com(Response.Status.CONFLICT, mensagem);
    }

    private static WebApplicationException com(Response.Status status, String mensagem) {
        return new WebApplicationException(Response.status(status)
                .type(MediaType.APPLICATION_JSON)
                .entity(Map.of("error", mensagem))
                .build());
    }
}
