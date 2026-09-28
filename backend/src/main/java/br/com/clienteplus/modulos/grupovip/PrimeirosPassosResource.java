package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.clienteplus.Plano;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;

// "Primeiros passos" do Dashboard: o que ainda falta configurar para o módulo
// funcionar (robô, grupos, planos, Pix...), calculado dos dados. Cada passo
// aponta para a tela e para o passo a passo (guia) do frontend.
// Contrato com o frontend: frontend/src/lib/grupo-vip-guias.tsx (PrimeiroPasso)
@Path("/grupo-vip/primeiros-passos")
@Produces(MediaType.APPLICATION_JSON)
public class PrimeirosPassosResource {

    @ConfigProperty(name = "grupo-vip.store-id")
    UUID storeId;

    @Inject
    Membros membros;

    // guia: id do passo a passo no frontend; para: rota da tela
    public record Passo(String id, String titulo, String descricao, boolean feito, boolean opcional, String guia, String para) {}

    @GET
    @Transactional
    public List<Passo> listar() {
        Config c = membros.config(storeId);
        List<Grupo> grupos = Grupo.list("storeId = ?1 and ativo = true", storeId);
        List<Grupo> telegram = grupos.stream().filter(g -> Grupo.TELEGRAM.equals(g.plataforma)).toList();
        List<Grupo> whatsapp = grupos.stream().filter(g -> Grupo.WHATSAPP.equals(g.plataforma)).toList();
        boolean planoComGrupo = Plano.<Plano>list("storeId = ?1 and ativo = true", storeId).stream()
                .anyMatch(p -> PlanoGrupo.count("plano", p) > 0);

        List<Passo> passos = new ArrayList<>();
        passos.add(new Passo("negocio", "Dados do negócio e página de vendas",
                "Nome, descrição, benefícios e foto de capa que aparecem para quem vai assinar.",
                c.descricaoPagina != null && !c.descricaoPagina.isBlank() && c.fotoCapa != null, false, "pagina",
                "/grupo-vip/configuracoes"));
        passos.add(new Passo("grupos", "Cadastre seus grupos", "Os grupos do Telegram e do WhatsApp que você vende.",
                !grupos.isEmpty(), false, "grupo", "/grupo-vip/grupos"));
        if (!telegram.isEmpty() || grupos.isEmpty()) {
            passos.add(new Passo("robo", "Conecte o robô do Telegram",
                    "Ele coloca quem pagou e tira quem parou de pagar sozinho.", c.robo(), false, "robo",
                    "/grupo-vip/configuracoes"));
            passos.add(new Passo("robo-grupos", "Coloque o robô como administrador dos grupos",
                    "E informe o ID de cada grupo do Telegram.",
                    !telegram.isEmpty() && telegram.stream().allMatch(g -> g.automatico(c)), false, "robo-admin",
                    "/grupo-vip/grupos"));
        }
        if (!whatsapp.isEmpty()) {
            passos.add(new Passo("whatsapp", "Link de convite dos grupos do WhatsApp",
                    "Para mandar o acesso com um toque para quem pagou.",
                    whatsapp.stream().allMatch(g -> g.linkConvite != null), false, "grupo-whatsapp", "/grupo-vip/grupos"));
        }
        passos.add(new Passo("planos", "Crie os planos", "Preço, cobrança (mensal, anual...) e quais grupos cada plano libera.",
                planoComGrupo, false, "plano", "/grupo-vip/grupos"));
        passos.add(new Passo("pix", "Configure o Pix", "Para os membros pagarem direto na sua conta, com o valor certo.",
                c.chavePix != null && c.nomeRecebedor != null && c.cidadeRecebedor != null, false, "pix",
                "/grupo-vip/configuracoes"));
        passos.add(new Passo("membros", "Primeiro membro", "Cadastre um membro ou divulgue a página de vendas.",
                Membro.count("storeId", storeId) > 0, false, "membro", "/grupo-vip/membros"));
        passos.add(new Passo("suporte", "WhatsApp de atendimento", "Aparece para os membros e para quem ainda vai assinar.",
                c.whatsappSuporte != null, true, "suporte-whatsapp", "/grupo-vip/configuracoes"));
        passos.add(new Passo("biblioteca", "Biblioteca de arquivos", "Livros, apostilas, vídeos, áudios... entregues pelo robô a quem paga.",
                GoogleDrive.configurado(c) || Livro.count("storeId", storeId) > 0, true, "conta-servico",
                "/grupo-vip/biblioteca"));
        return passos;
    }
}
