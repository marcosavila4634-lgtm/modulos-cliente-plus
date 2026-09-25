package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.academia.AcessoContrato.*;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;

// Dados da academia, horário de funcionamento e regras gerais.
@Path("/academia/configuracoes")
@Produces(MediaType.APPLICATION_JSON)
public class ConfiguracoesResource {

    @ConfigProperty(name = "academia.store-id")
    UUID storeId;

    @Inject
    Configuracoes configuracoes;

    @GET
    public ConfiguracoesJson buscar() {
        return configuracoes.tela(storeId).json();
    }

    @PUT
    @Transactional
    public ConfiguracoesJson salvar(DadosConfiguracoes dados) {
        configuracoes.salvar(storeId, dados);
        return configuracoes.tela(storeId).json();
    }
}
