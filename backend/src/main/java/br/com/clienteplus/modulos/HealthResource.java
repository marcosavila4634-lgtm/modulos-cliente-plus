package br.com.clienteplus.modulos;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.time.Instant;

@Path("/health")
@Produces(MediaType.APPLICATION_JSON)
public class HealthResource {

    public record Health(boolean ok, String horario) {}

    @GET
    public Health health() {
        return new Health(true, Instant.now().toString());
    }
}
