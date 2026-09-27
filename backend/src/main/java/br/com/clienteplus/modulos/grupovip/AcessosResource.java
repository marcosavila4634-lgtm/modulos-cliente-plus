package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.grupovip.AcessosContrato.*;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.eclipse.microprofile.config.inject.ConfigProperty;

// Controle de acesso: quem precisa entrar, quem precisa sair e o histórico.
@Path("/grupo-vip/acessos")
@Produces(MediaType.APPLICATION_JSON)
public class AcessosResource {

    @ConfigProperty(name = "grupo-vip.store-id")
    UUID storeId;

    @Inject
    Membros membros;

    @Inject
    ControleAcesso controle;

    @Inject
    RoboTelegram robo;

    @Inject
    Automacoes automacoes;

    @GET
    @Transactional
    public PainelAcessos painel() {
        Membros.Base base = membros.base(storeId);
        Config config = base.config;
        Map<UUID, Long> dentro = Acesso.<Acesso>list("storeId = ?1 and status = ?2", storeId, Acesso.NO_GRUPO).stream()
                .collect(Collectors.groupingBy(a -> a.grupo.id, Collectors.counting()));
        List<GrupoContagem> grupos = base.grupos.stream()
                .filter(g -> g.ativo)
                .map(g -> new GrupoContagem(g.id, g.nome, g.plataforma, g.automatico(config),
                        dentro.getOrDefault(g.id, 0L).intValue(), Membros.comAcesso(base, g.id).size()))
                .toList();
        List<EventoAcesso> historico = AcessoEvento.<AcessoEvento>find("storeId = ?1 order by momento desc", storeId)
                .page(0, 150)
                .stream()
                .map(Visoes::evento)
                .toList();
        return new PainelAcessos(controle.pendencias(base), historico,
                new Robo(config.robo(), config.telegramBotUsuario, robo.erro(storeId), robo.ultimaConsulta(storeId)),
                grupos, config.toleranciaDias);
    }

    // Roda tudo agora (robô + mensagens), em vez de esperar o próximo minuto.
    @POST
    @Path("/sincronizar")
    @Transactional
    public Automacoes.Resultado sincronizar() {
        return automacoes.rodar(storeId);
    }

    @POST
    @Path("/{grupoId}/{clienteId}/convidar")
    @Transactional
    public Convite convidar(@PathParam("grupoId") UUID grupoId, @PathParam("clienteId") UUID clienteId) {
        try {
            return controle.convidar(storeId, grupoId, clienteId);
        } catch (Telegram.ErroTelegram e) {
            throw br.com.clienteplus.modulos.comum.Erro.invalido(e.getMessage());
        }
    }

    @POST
    @Path("/{grupoId}/{clienteId}/entrou")
    @Transactional
    public void entrou(@PathParam("grupoId") UUID grupoId, @PathParam("clienteId") UUID clienteId) {
        controle.marcarEntrou(storeId, grupoId, clienteId);
    }

    @POST
    @Path("/{grupoId}/{clienteId}/removido")
    @Transactional
    public void removido(@PathParam("grupoId") UUID grupoId, @PathParam("clienteId") UUID clienteId) {
        controle.marcarRemovido(storeId, grupoId, clienteId);
    }

    @POST
    @Path("/{grupoId}/{clienteId}/remover")
    @Transactional
    public void remover(@PathParam("grupoId") UUID grupoId, @PathParam("clienteId") UUID clienteId) {
        controle.removerAgora(storeId, grupoId, clienteId);
    }
}
