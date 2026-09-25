package br.com.clienteplus.modulos.modulo;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.Map;

@Path("/modulos")
@Produces(MediaType.APPLICATION_JSON)
public class ModulosResource {

    @GET
    public List<Modulo> listar() {
        return Modulo.list("order by createdAt, nome");
    }

    @GET
    @Path("/{slug}")
    public Response buscar(@PathParam("slug") String slug) {
        return Modulo.<Modulo>find("slug", slug)
                .firstResultOptional()
                .map(m -> Response.ok(m).build())
                .orElseGet(() -> Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Módulo não encontrado"))
                        .build());
    }
}
