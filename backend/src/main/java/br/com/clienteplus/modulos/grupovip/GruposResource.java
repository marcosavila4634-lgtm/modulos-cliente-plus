package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.clienteplus.Assinatura;
import br.com.clienteplus.modulos.clienteplus.Plano;
import br.com.clienteplus.modulos.comum.Erro;
import br.com.clienteplus.modulos.grupovip.MembrosContrato.Opcao;
import br.com.clienteplus.modulos.grupovip.MembrosContrato.PlanoJson;
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
import java.time.OffsetDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.eclipse.microprofile.config.inject.ConfigProperty;

// Grupos (Telegram/WhatsApp) e planos que liberam cada grupo.
// Contrato com o frontend: frontend/src/lib/grupo-vip-grupos.ts
@Path("/grupo-vip")
@Produces(MediaType.APPLICATION_JSON)
public class GruposResource {

    @ConfigProperty(name = "grupo-vip.store-id")
    UUID storeId;

    @Inject
    Membros membros;

    @Inject
    RoboTelegram robo;

    @Inject
    EnderecoPublico endereco;

    @Inject
    Automacoes automacoes;

    static final Set<String> CORES = Set.of("blue", "sky", "violet", "indigo", "amber");

    public record GrupoJson(
            UUID id,
            String nome,
            String descricao,
            String plataforma,
            String cor,
            String linkConvite,
            String telegramChatId,
            boolean ativo,
            boolean automatico,
            int noGrupo,
            int comDireito,
            List<Opcao> planos,
            OffsetDateTime createdAt) {}

    public record Robo(boolean conectado, String usuario, String erro) {}

    public record Grupos(List<GrupoJson> grupos, List<PlanoJson> planos, String paginaVendas, Robo robo,
                         List<RoboTelegram.GrupoDetectado> detectados) {}

    public record DadosGrupo(String nome, String descricao, String plataforma, String cor, String linkConvite,
                             String telegramChatId, Boolean ativo) {}

    public record DadosPlano(String nome, String descricao, BigDecimal preco, Integer duracaoMeses,
                             Boolean participaIndicacoes, Boolean ativo, List<UUID> grupoIds) {}

    @GET
    @Path("/grupos")
    @Transactional
    public Grupos listar() {
        Membros.Base base = membros.base(storeId);
        Config config = base.config;
        Map<UUID, Long> dentro = Acesso.<Acesso>list("storeId = ?1 and status = ?2", storeId, Acesso.NO_GRUPO).stream()
                .collect(Collectors.groupingBy(a -> a.grupo.id, Collectors.counting()));
        Map<UUID, List<Opcao>> planosDoGrupo = PlanoGrupo.<PlanoGrupo>list("storeId", storeId).stream()
                .collect(Collectors.groupingBy(pg -> pg.grupo.id,
                        Collectors.mapping(pg -> new Opcao(pg.plano.id, pg.plano.nome), Collectors.toList())));

        List<GrupoJson> grupos = base.grupos.stream()
                .map(g -> new GrupoJson(g.id, g.nome, g.descricao, g.plataforma, g.cor, g.linkConvite, g.telegramChatId,
                        g.ativo, g.automatico(config), dentro.getOrDefault(g.id, 0L).intValue(),
                        Membros.comAcesso(base, g.id).size(), planosDoGrupo.getOrDefault(g.id, List.of()), g.createdAt))
                .toList();
        List<PlanoJson> planos = Plano.<Plano>list("storeId = ?1 order by preco", storeId).stream()
                .map(p -> Visoes.plano(p, base))
                .toList();
        return new Grupos(grupos, planos, endereco.paginaVendas(config.slug, null),
                new Robo(config.robo(), config.telegramBotUsuario, robo.erro(storeId)), robo.detectados(storeId));
    }

    @POST
    @Path("/grupos")
    @Transactional
    public Grupos criar(DadosGrupo dados) {
        Grupo g = new Grupo();
        g.storeId = storeId;
        g.protegerConteudo = true;
        g.palavrasProibidas = "";
        preencher(g, dados);
        g.persist();
        return listar();
    }

    @PUT
    @Path("/grupos/{id}")
    @Transactional
    public Grupos atualizar(@PathParam("id") UUID id, DadosGrupo dados) {
        preencher(grupo(id), dados);
        automacoes.rodar(storeId);
        return listar();
    }

    @DELETE
    @Path("/grupos/{id}")
    @Transactional
    public Grupos excluir(@PathParam("id") UUID id) {
        Grupo g = grupo(id);
        if (Acesso.count("grupo", g) > 0 || AcessoEvento.count("grupo", g) > 0) {
            throw Erro.conflito("Este grupo já tem histórico de membros. Desative em vez de excluir.");
        }
        g.delete();
        return listar();
    }

    private Grupo grupo(UUID id) {
        Grupo g = Grupo.findById(id);
        if (g == null || !g.storeId.equals(storeId)) throw Erro.naoEncontrado("Grupo não encontrado");
        return g;
    }

    private void preencher(Grupo g, DadosGrupo d) {
        if (d == null) throw Erro.invalido("Preencha os dados do grupo");
        String nome = Membros.limpo(d.nome());
        if (nome == null) throw Erro.invalido("Informe o nome do grupo");
        if (!Grupo.TELEGRAM.equals(d.plataforma()) && !Grupo.WHATSAPP.equals(d.plataforma())) {
            throw Erro.invalido("Escolha Telegram ou WhatsApp");
        }
        String link = Membros.limpo(d.linkConvite());
        if (link != null && !link.matches("https://\\S+")) throw Erro.invalido("O link do grupo precisa começar com https://");
        if (link != null && Grupo.WHATSAPP.equals(d.plataforma()) && !link.contains("chat.whatsapp.com")) {
            throw Erro.invalido("Link do WhatsApp inválido: copie o link de convite do grupo (chat.whatsapp.com/...)");
        }
        if (link != null && Grupo.TELEGRAM.equals(d.plataforma()) && !link.contains("t.me/")) {
            throw Erro.invalido("Link do Telegram inválido: use um link t.me/...");
        }
        String chat = Membros.limpo(d.telegramChatId());
        if (chat != null && !chat.matches("-?\\d{5,20}")) throw Erro.invalido("ID do grupo no Telegram inválido (ex.: -1001234567890)");
        if (chat != null && Grupo.count("storeId = ?1 and telegramChatId = ?2 and id <> ?3", storeId, chat,
                g.id != null ? g.id : new UUID(0, 0)) > 0) {
            throw Erro.conflito("Outro grupo já usa este ID do Telegram");
        }
        g.nome = nome;
        g.descricao = d.descricao() != null ? d.descricao().trim() : "";
        g.plataforma = d.plataforma();
        g.cor = d.cor() != null && CORES.contains(d.cor()) ? d.cor() : "blue";
        g.linkConvite = link;
        g.telegramChatId = Grupo.TELEGRAM.equals(d.plataforma()) ? chat : null;
        g.ativo = d.ativo() == null || d.ativo();
    }

    // ---------- Planos (do Cliente Plus) ----------
    // No projeto principal os planos são criados em "Produtos/Planos"; aqui o
    // módulo também cria, para funcionar sozinho. Mudar o preço vale para as
    // novas assinaturas (quem já assina continua com o valor dela).

    @POST
    @Path("/planos")
    @Transactional
    public Grupos criarPlano(DadosPlano dados) {
        Plano p = new Plano();
        p.storeId = storeId;
        preencher(p, dados);
        p.persistAndFlush();
        ligarGrupos(p, dados.grupoIds());
        return listar();
    }

    @PUT
    @Path("/planos/{id}")
    @Transactional
    public Grupos atualizarPlano(@PathParam("id") UUID id, DadosPlano dados) {
        Plano p = membros.plano(storeId, id);
        int duracaoAntes = p.duracaoMeses;
        preencher(p, dados);
        if (p.duracaoMeses != duracaoAntes && Assinatura.count("plano", p) > 0) {
            throw Erro.conflito("Não dá para mudar a periodicidade de um plano que já tem assinaturas. Crie um plano novo.");
        }
        ligarGrupos(p, dados.grupoIds());
        automacoes.rodar(storeId);
        return listar();
    }

    private static void preencher(Plano p, DadosPlano d) {
        if (d == null) throw Erro.invalido("Preencha os dados do plano");
        String nome = Membros.limpo(d.nome());
        if (nome == null) throw Erro.invalido("Informe o nome do plano");
        if (d.preco() == null || d.preco().signum() < 0) throw Erro.invalido("Informe o preço (0 para cortesia)");
        int duracao = d.duracaoMeses() != null ? d.duracaoMeses() : 1;
        if (duracao < 1 || duracao > 24) throw Erro.invalido("Periodicidade entre 1 e 24 meses");
        p.nome = nome;
        p.descricao = d.descricao() != null ? d.descricao().trim() : "";
        p.preco = d.preco();
        p.duracaoMeses = duracao;
        p.participaIndicacoes = d.participaIndicacoes() == null || d.participaIndicacoes();
        p.ativo = d.ativo() == null || d.ativo();
    }

    private void ligarGrupos(Plano p, List<UUID> grupoIds) {
        Set<UUID> ids = new LinkedHashSet<>(grupoIds != null ? grupoIds : List.of());
        if (ids.isEmpty()) throw Erro.invalido("Escolha pelo menos um grupo que o plano libera");
        PlanoGrupo.delete("plano", p);
        PlanoGrupo.flush();
        for (UUID gid : ids) {
            PlanoGrupo pg = new PlanoGrupo();
            pg.storeId = storeId;
            pg.plano = p;
            pg.grupo = grupo(gid);
            pg.persist();
        }
    }
}
