package br.com.clienteplus.modulos.academia;

import io.quarkus.vertx.http.runtime.CurrentVertxRequest;
import io.vertx.ext.web.RoutingContext;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;

// Qual loja a requisição está usando. O mesmo código do módulo Academia atende
// duas lojas de exemplo: a academia (musculação) e o dojo do módulo Artes
// Marciais, que usa tudo da Academia e acrescenta as partes de luta.
//
// O painel do Artes Marciais manda o cabeçalho "X-Modulo: artes-marciais"
// (ou ?modulo=artes-marciais em links de download). Sem ele, é a academia.
// No projeto principal a loja vem do login, e isto deixa de existir.
@ApplicationScoped
public class LojaAcademia {

    public static final String ARTES_MARCIAIS = "artes-marciais";

    @ConfigProperty(name = "academia.store-id")
    UUID academia;

    @ConfigProperty(name = "artes-marciais.store-id")
    UUID artesMarciais;

    @Inject
    CurrentVertxRequest requisicao;

    public UUID id() {
        return ehArtesMarciais() ? artesMarciais : academia;
    }

    public boolean ehArtesMarciais() {
        RoutingContext ctx = requisicao.getCurrent();
        if (ctx == null) return false;
        String modulo = ctx.request().getHeader("X-Modulo");
        if (modulo == null) modulo = ctx.request().getParam("modulo");
        return ARTES_MARCIAIS.equals(modulo);
    }
}
