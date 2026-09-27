package br.com.clienteplus.modulos.grupovip;

import static br.com.clienteplus.modulos.comum.Formatos.numero;

import br.com.clienteplus.modulos.comum.Erro;
import com.fasterxml.jackson.databind.JsonNode;
import io.quarkus.narayana.jta.QuarkusTransaction;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;

// Configurações: dados do negócio, página de vendas, regras de acesso, Pix,
// robô do Telegram e cupons de desconto.
// Contrato com o frontend: frontend/src/lib/grupo-vip-config.ts
@Path("/grupo-vip/configuracoes")
@Produces(MediaType.APPLICATION_JSON)
public class ConfiguracoesResource {

    @ConfigProperty(name = "grupo-vip.store-id")
    UUID storeId;

    @Inject
    Membros membros;

    @Inject
    Telegram telegram;

    @Inject
    RoboTelegram robo;

    @Inject
    EnderecoPublico endereco;

    public record Robo(boolean conectado, String usuario, String erro, OffsetDateTime ultimaConsulta) {}

    public record CupomJson(UUID id, String codigo, String tipo, Number valor, LocalDate validade, Integer limiteUsos,
                            int usos, boolean ativo) {}

    public record ConfigJson(
            String nomeNegocio,
            String slug,
            String descricaoPagina,
            String beneficios,
            String fotoCapa,
            String gestorNome,
            String gestorSobrenome,
            String gestorCargo,
            String frase,
            String fraseDestaque,
            int toleranciaDias,
            String chavePix,
            String nomeRecebedor,
            String cidadeRecebedor,
            String whatsappSuporte,
            Robo robo,
            String paginaVendas,
            String enderecoPublico,
            List<CupomJson> cupons,
            List<RoboTelegram.GrupoDetectado> detectados) {}

    public record DadosConfig(
            String nomeNegocio,
            String slug,
            String descricaoPagina,
            String beneficios,
            String fotoCapa,
            String gestorNome,
            String gestorSobrenome,
            String gestorCargo,
            String frase,
            String fraseDestaque,
            Integer toleranciaDias,
            String chavePix,
            String nomeRecebedor,
            String cidadeRecebedor,
            String whatsappSuporte) {}

    public record ConectarRobo(String token) {}

    public record DadosCupom(String codigo, String tipo, BigDecimal valor, LocalDate validade, Integer limiteUsos,
                             Boolean ativo) {}

    @GET
    @Transactional
    public ConfigJson buscar() {
        Config c = membros.config(storeId);
        List<CupomJson> cupons = Cupom.<Cupom>list("storeId = ?1 order by createdAt desc", storeId).stream()
                .map(ConfiguracoesResource::cupom)
                .toList();
        return new ConfigJson(c.nomeNegocio, c.slug, c.descricaoPagina, c.beneficios, c.fotoCapa, c.gestorNome,
                c.gestorSobrenome, c.gestorCargo, c.frase, c.fraseDestaque, c.toleranciaDias, c.chavePix,
                c.nomeRecebedor, c.cidadeRecebedor, c.whatsappSuporte,
                new Robo(c.robo(), c.telegramBotUsuario, robo.erro(storeId), robo.ultimaConsulta(storeId)),
                endereco.paginaVendas(c.slug, null), endereco.base(), cupons, robo.detectados(storeId));
    }

    static CupomJson cupom(Cupom c) {
        return new CupomJson(c.id, c.codigo, c.tipo, numero(c.valor), c.validade, c.limiteUsos, c.usos, c.ativo);
    }

    @PUT
    @Transactional
    public ConfigJson salvar(DadosConfig d) {
        if (d == null) throw Erro.invalido("Preencha as configurações");
        Config c = membros.config(storeId);
        String nome = Membros.limpo(d.nomeNegocio());
        if (nome == null) throw Erro.invalido("Informe o nome do negócio");
        String slug = d.slug() != null ? d.slug().trim().toLowerCase() : "";
        if (!slug.matches("[a-z0-9](?:[a-z0-9-]{1,38})[a-z0-9]")) {
            throw Erro.invalido("Endereço da página: de 3 a 40 letras minúsculas, números ou hífen");
        }
        if (Config.count("slug = ?1 and storeId <> ?2", slug, storeId) > 0) {
            throw Erro.conflito("Este endereço de página já está em uso");
        }
        String gestor = Membros.limpo(d.gestorNome());
        if (gestor == null) throw Erro.invalido("Informe o nome do gestor");
        int tolerancia = d.toleranciaDias() != null ? d.toleranciaDias() : c.toleranciaDias;
        if (tolerancia < 0 || tolerancia > 60) throw Erro.invalido("Tolerância entre 0 e 60 dias");
        String zap = Membros.numeros(d.whatsappSuporte());
        if (zap != null && zap.startsWith("55") && zap.length() >= 12) zap = zap.substring(2);
        if (zap != null && (zap.length() < 10 || zap.length() > 11)) throw Erro.invalido("WhatsApp de suporte inválido");
        String chave = Membros.limpo(d.chavePix());
        if (chave != null && chave.length() > 77) throw Erro.invalido("Chave Pix muito longa");

        c.nomeNegocio = nome;
        c.slug = slug;
        c.descricaoPagina = texto(d.descricaoPagina());
        c.beneficios = texto(d.beneficios());
        c.fotoCapa = Membros.limpo(d.fotoCapa());
        c.gestorNome = gestor;
        c.gestorSobrenome = texto(d.gestorSobrenome());
        c.gestorCargo = d.gestorCargo() != null && !d.gestorCargo().isBlank() ? d.gestorCargo().trim() : "Administrador";
        c.frase = texto(d.frase());
        c.fraseDestaque = texto(d.fraseDestaque());
        c.toleranciaDias = tolerancia;
        c.chavePix = chave;
        c.nomeRecebedor = Membros.limpo(d.nomeRecebedor());
        c.cidadeRecebedor = Membros.limpo(d.cidadeRecebedor());
        c.whatsappSuporte = zap;
        return buscar();
    }

    private static String texto(String s) {
        return s == null ? "" : s.trim();
    }

    // Confere o token com o Telegram antes de guardar.
    @POST
    @Path("/robo")
    public ConfigJson conectar(ConectarRobo pedido) {
        String token = pedido != null && pedido.token() != null ? pedido.token().trim() : "";
        if (!token.matches("\\d{5,15}:[A-Za-z0-9_-]{30,}")) {
            throw Erro.invalido("Token inválido. Ele tem o formato 123456789:AAE... e é enviado pelo @BotFather.");
        }
        JsonNode eu;
        try {
            eu = telegram.quemSouEu(token);
            telegram.chamar(token, "deleteWebhook", Map.of("drop_pending_updates", false));
        } catch (Telegram.ErroTelegram e) {
            throw Erro.invalido(e.getMessage());
        }
        String usuario = eu.path("username").asText();
        QuarkusTransaction.requiringNew().run(() -> {
            Config c = membros.config(storeId);
            c.telegramBotToken = token;
            c.telegramBotUsuario = usuario;
            c.telegramUltimoUpdate = 0;
        });
        robo.esquecer(storeId);
        return QuarkusTransaction.requiringNew().call(this::buscar);
    }

    @DELETE
    @Path("/robo")
    @Transactional
    public ConfigJson desconectar() {
        Config c = membros.config(storeId);
        c.telegramBotToken = null;
        c.telegramBotUsuario = null;
        c.telegramUltimoUpdate = 0;
        robo.esquecer(storeId);
        return buscar();
    }

    // ---------- Cupons ----------

    @POST
    @Path("/cupons")
    @Transactional
    public ConfigJson criarCupom(DadosCupom dados) {
        Cupom c = new Cupom();
        c.storeId = storeId;
        preencher(c, dados);
        c.persist();
        return buscar();
    }

    @PUT
    @Path("/cupons/{id}")
    @Transactional
    public ConfigJson atualizarCupom(@PathParam("id") UUID id, DadosCupom dados) {
        preencher(cupom(id), dados);
        return buscar();
    }

    @DELETE
    @Path("/cupons/{id}")
    @Transactional
    public ConfigJson excluirCupom(@PathParam("id") UUID id) {
        Cupom c = cupom(id);
        if (c.usos > 0 || Checkout.count("cupom", c) > 0) {
            throw Erro.conflito("Este cupom já foi usado. Desative em vez de excluir.");
        }
        c.delete();
        return buscar();
    }

    private Cupom cupom(UUID id) {
        Cupom c = Cupom.findById(id);
        if (c == null || !c.storeId.equals(storeId)) throw Erro.naoEncontrado("Cupom não encontrado");
        return c;
    }

    private void preencher(Cupom c, DadosCupom d) {
        if (d == null) throw Erro.invalido("Preencha o cupom");
        String codigo = d.codigo() != null ? d.codigo().trim().toUpperCase() : "";
        if (!codigo.matches("[A-Z0-9_-]{3,20}")) throw Erro.invalido("Código: de 3 a 20 letras ou números, sem espaço");
        if (Cupom.count("storeId = ?1 and codigo = ?2 and id <> ?3", storeId, codigo,
                c.id != null ? c.id : new UUID(0, 0)) > 0) {
            throw Erro.conflito("Já existe um cupom com este código");
        }
        if (!Set.of("percentual", "valor").contains(d.tipo())) throw Erro.invalido("Escolha o tipo de desconto");
        if (d.valor() == null || d.valor().signum() <= 0) throw Erro.invalido("Informe o desconto");
        if ("percentual".equals(d.tipo()) && d.valor().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw Erro.invalido("Desconto de no máximo 100%");
        }
        if (d.limiteUsos() != null && d.limiteUsos() < 1) throw Erro.invalido("Limite de usos precisa ser 1 ou mais");
        c.codigo = codigo;
        c.tipo = d.tipo();
        c.valor = d.valor();
        c.validade = d.validade();
        c.limiteUsos = d.limiteUsos();
        c.ativo = d.ativo() == null || d.ativo();
    }
}
