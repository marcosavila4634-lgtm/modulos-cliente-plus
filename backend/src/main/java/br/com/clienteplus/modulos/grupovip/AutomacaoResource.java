package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.Erro;
import br.com.clienteplus.modulos.grupovip.MembrosContrato.MensagemJson;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;

// Automação: textos das mensagens automáticas e a caixa de saída.
// Contrato com o frontend: frontend/src/lib/grupo-vip-automacao.ts
@Path("/grupo-vip/automacao")
@Produces(MediaType.APPLICATION_JSON)
public class AutomacaoResource {

    @ConfigProperty(name = "grupo-vip.store-id")
    UUID storeId;

    @Inject
    Automacoes automacoes;

    @Inject
    Membros membros;

    @Inject
    Mensageiro mensageiro;

    public record AutomacaoJson(String tipo, String titulo, String descricao, boolean ativa, int dias, String texto,
                                boolean usaDias, int enviadas) {}

    // exemplo = valores de um membro de verdade, para a prévia do texto
    public record Painel(
            List<AutomacaoJson> automacoes,
            List<MensagemJson> pendentes,
            List<MensagemJson> recentes,
            Map<String, Integer> contagem,
            boolean roboConectado,
            String roboUsuario,
            Map<String, String> exemplo) {}

    public record DadosAutomacao(boolean ativa, Integer dias, String texto) {}

    private static final java.util.Set<String> USA_DIAS = java.util.Set.of("lembrete", "vencido", "reconquista");

    @GET
    @Transactional
    public Painel painel() {
        Config config = membros.config(storeId);
        Map<String, Automacao> auto = automacoes.garantir(storeId);
        Map<String, Integer> porTipo = new java.util.HashMap<>();
        for (Mensagem m : Mensagem.<Mensagem>list("storeId = ?1 and status = ?2", storeId, Mensagem.ENVIADA)) {
            porTipo.merge(m.tipo, 1, Integer::sum);
        }
        List<AutomacaoJson> lista = auto.values().stream()
                .map(a -> {
                    Automacoes.Padrao p = Automacoes.PADROES.get(a.tipo);
                    return new AutomacaoJson(a.tipo, p.titulo(), p.descricao(), a.ativa, a.dias, a.texto,
                            USA_DIAS.contains(a.tipo), porTipo.getOrDefault(a.tipo, 0));
                })
                .toList();

        List<MensagemJson> pendentes = Mensagem.<Mensagem>list(
                        "storeId = ?1 and status in (?2, ?3) order by criadaEm desc", storeId, Mensagem.PENDENTE, Mensagem.FALHOU)
                .stream()
                .map(Visoes::mensagem)
                .toList();
        List<MensagemJson> recentes = Mensagem.<Mensagem>find(
                        "storeId = ?1 and status in (?2, ?3) order by coalesce(enviadaEm, criadaEm) desc", storeId,
                        Mensagem.ENVIADA, Mensagem.DESCARTADA)
                .page(0, 60)
                .stream()
                .map(Visoes::mensagem)
                .toList();

        Map<String, Integer> contagem = new java.util.LinkedHashMap<>();
        contagem.put("pendentesWhatsapp", (int) pendentes.stream()
                .filter(m -> "pendente".equals(m.status()) && "whatsapp".equals(m.canal())).count());
        contagem.put("falhas", (int) pendentes.stream().filter(m -> "falhou".equals(m.status())).count());
        contagem.put("enviadasHoje", (int) Mensagem.count("storeId = ?1 and status = ?2 and enviadaEm >= ?3", storeId,
                Mensagem.ENVIADA, Membros.hoje().atStartOfDay(br.com.clienteplus.modulos.comum.Formatos.FUSO).toOffsetDateTime()));

        Membros.Base base = membros.base(storeId);
        Map<String, String> exemplo = base.estados.values().stream()
                .filter(Membros.Estado::temAcesso)
                .findFirst()
                .map(e -> mensageiro.variaveis(config, base, e))
                .orElse(Map.of("nome", "Maria", "negocio", config.nomeNegocio));
        return new Painel(lista, pendentes, recentes, contagem, config.robo(), config.telegramBotUsuario, exemplo);
    }

    @PUT
    @Path("/{tipo}")
    @Transactional
    public Painel salvar(@PathParam("tipo") String tipo, DadosAutomacao dados) {
        if (dados == null) throw Erro.invalido("Preencha a automação");
        automacoes.salvar(storeId, tipo, dados.ativa(), dados.dias(), dados.texto());
        return painel();
    }

    @POST
    @Path("/rodar")
    @Transactional
    public Automacoes.Resultado rodar() {
        return automacoes.rodar(storeId);
    }

    // O dono enviou pelo WhatsApp (tocou em "Enviar").
    @POST
    @Path("/mensagens/{id}/enviada")
    @Transactional
    public MensagemJson marcarEnviada(@PathParam("id") UUID id) {
        Mensagem m = mensagem(id);
        m.status = Mensagem.ENVIADA;
        m.enviadaEm = OffsetDateTime.now();
        m.erro = null;
        return Visoes.mensagem(m);
    }

    @POST
    @Path("/mensagens/{id}/descartar")
    @Transactional
    public MensagemJson descartar(@PathParam("id") UUID id) {
        Mensagem m = mensagem(id);
        if (Mensagem.ENVIADA.equals(m.status)) throw Erro.conflito("Esta mensagem já foi enviada");
        m.status = Mensagem.DESCARTADA;
        return Visoes.mensagem(m);
    }

    // Tenta de novo pelo robô (Telegram) ou volta para pendente (WhatsApp).
    @POST
    @Path("/mensagens/{id}/reenviar")
    @Transactional
    public MensagemJson reenviar(@PathParam("id") UUID id) {
        Mensagem m = mensagem(id);
        Config config = membros.config(storeId);
        String canal = Mensageiro.canal(config, m.cliente, Membro.<Membro>find("cliente", m.cliente).firstResult());
        if (canal == null) throw Erro.invalido("Este membro não tem WhatsApp nem Telegram conectado");
        m.canal = canal;
        m.status = Mensagem.PENDENTE;
        m.erro = null;
        if ("telegram".equals(canal) && !mensageiro.enviar(config, m)) throw Erro.invalido(m.erro);
        return Visoes.mensagem(m);
    }

    private Mensagem mensagem(UUID id) {
        Mensagem m = Mensagem.findById(id);
        if (m == null || !m.storeId.equals(storeId)) throw Erro.naoEncontrado("Mensagem não encontrada");
        return m;
    }
}
