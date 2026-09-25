package br.com.clienteplus.modulos;

import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

// Avisa no terminal quando a API está pronta para uso.
@ApplicationScoped
public class Inicio {

    private static final Logger LOG = Logger.getLogger(Inicio.class);

    @ConfigProperty(name = "quarkus.http.port")
    int porta;

    void aoIniciar(@Observes StartupEvent evento) {
        LOG.infof("[backend] rodando em http://localhost:%d/api", porta);
    }
}
