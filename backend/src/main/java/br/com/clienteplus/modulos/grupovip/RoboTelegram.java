package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import com.fasterxml.jackson.databind.JsonNode;
import io.quarkus.logging.Log;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

// O robô do Telegram "escutando": a cada 3 segundos pergunta ao Telegram o que
// aconteceu (getUpdates) e reage:
//
//   /start <codigo>   no privado: liga a conta do Telegram ao membro e manda
//                     os links de entrada dos grupos que ele pagou
//   /grupos           no privado: manda os links de novo
//   /livro <nome>     no privado: robô bibliotecário (Biblioteca.java); tocar
//                     num livro da lista (callback_query) manda o arquivo
//   outra mensagem    no privado: vai para o Suporte (conversa com a equipe)
//   pedido de entrada aprova quem tem acesso, recusa quem não tem
//   saiu / entrou     atualiza a situação do membro no grupo e manda as
//                     boas-vindas no grupo (se configuradas)
//   robô adicionado   o grupo aparece em "Grupos encontrados pelo robô"
//   /id               no grupo: o robô responde o ID do grupo
//   mensagem no grupo moderação (links e palavras proibidas), apaga avisos de
//                     entrada/saída e registra tópicos criados no Telegram
//   votos             atualiza o resultado das enquetes
//
// No projeto principal: webhook numa Edge Function (sem ficar perguntando).
@ApplicationScoped
public class RoboTelegram {

    @Inject
    Telegram telegram;

    @Inject
    Membros membros;

    @Inject
    ControleAcesso controle;

    @Inject
    EnderecoPublico endereco;

    @Inject
    GestaoTelegram gestao;

    @Inject
    Enquetes enquetes;

    @Inject
    Suporte suporte;

    @Inject
    Biblioteca biblioteca;

    public record GrupoDetectado(String chatId, String titulo, boolean administrador, OffsetDateTime visto) {}

    private final Map<UUID, Map<String, GrupoDetectado>> detectados = new ConcurrentHashMap<>();
    private final Map<UUID, String> ultimoErro = new ConcurrentHashMap<>();
    private final Map<UUID, OffsetDateTime> ultimaConsulta = new ConcurrentHashMap<>();

    private static final Set<String> DENTRO = Set.of("member", "administrator", "creator", "restricted");

    @Scheduled(every = "3s", delayed = "10s", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void consultar() {
        List<UUID> lojas = QuarkusTransaction.requiringNew().call(() -> Config.<Config>list("telegramBotToken is not null")
                .stream()
                .filter(Config::robo)
                .map(c -> c.storeId)
                .toList());
        for (UUID loja : lojas) consultarLoja(loja);
    }

    public void consultarLoja(UUID storeId) {
        record Dados(String token, long ultimo) {}
        Dados dados = QuarkusTransaction.requiringNew().call(() -> {
            Config c = membros.config(storeId);
            return new Dados(c.telegramBotToken, c.telegramUltimoUpdate);
        });
        JsonNode novidades;
        try {
            novidades = telegram.novidades(dados.token(), dados.ultimo() + 1);
            ultimoErro.remove(storeId);
            ultimaConsulta.put(storeId, OffsetDateTime.now());
        } catch (Telegram.ErroTelegram e) {
            ultimoErro.put(storeId, e.getMessage());
            return;
        }
        for (JsonNode u : novidades) {
            long id = u.path("update_id").asLong();
            try {
                // Pedido de livro pode baixar e subir um arquivo grande: mais tempo.
                QuarkusTransaction.requiringNew().timeout(600).run(() -> processar(storeId, u));
            } catch (Exception e) {
                Log.warnf("Robô do Telegram: erro ao tratar a novidade %d: %s", id, e.getMessage());
            }
            QuarkusTransaction.requiringNew().run(() -> membros.config(storeId).telegramUltimoUpdate = id);
        }
    }

    public List<GrupoDetectado> detectados(UUID storeId) {
        return detectados.getOrDefault(storeId, Map.of()).values().stream()
                .sorted(Comparator.comparing(GrupoDetectado::titulo))
                .toList();
    }

    public String erro(UUID storeId) {
        return ultimoErro.get(storeId);
    }

    public OffsetDateTime ultimaConsulta(UUID storeId) {
        return ultimaConsulta.get(storeId);
    }

    public void esquecer(UUID storeId) {
        detectados.remove(storeId);
        ultimoErro.remove(storeId);
        ultimaConsulta.remove(storeId);
    }

    // ---------- Tratamento de cada novidade ----------

    void processar(UUID storeId, JsonNode u) {
        Config config = membros.config(storeId);
        if (u.has("message")) mensagem(config, u.path("message"));
        if (u.has("my_chat_member")) roboNoGrupo(config, u.path("my_chat_member"));
        if (u.has("chat_join_request")) pedidoDeEntrada(config, u.path("chat_join_request"));
        if (u.has("chat_member")) mudancaNoGrupo(config, u.path("chat_member"));
        if (u.has("poll")) enquetes.atualizarVotos(storeId, u.path("poll"));
        if (u.has("callback_query")) biblioteca.tocou(config, u.path("callback_query"));
    }

    private void mensagem(Config config, JsonNode msg) {
        JsonNode chat = msg.path("chat");
        String tipo = chat.path("type").asText();
        String texto = msg.path("text").asText("").trim();
        if ("group".equals(tipo) || "supergroup".equals(tipo)) {
            registrarGrupo(config.storeId, chat, null);
            Grupo g = Grupo.<Grupo>find("storeId = ?1 and telegramChatId = ?2", config.storeId, chat.path("id").asText())
                    .firstResult();
            if (g != null && g.automatico(config)) {
                if (gestao.apagarAviso(config, g, msg)) return;
                JsonNode topico = msg.has("forum_topic_created") ? msg.path("forum_topic_created") : msg.path("forum_topic_edited");
                if (topico.hasNonNull("name") && msg.has("message_thread_id")) {
                    gestao.registrarTopico(g, msg.path("message_thread_id").asLong(), topico.path("name").asText());
                    return;
                }
                if (gestao.moderar(config, g, msg)) return;
            }
            if (texto.equals("/id") || texto.startsWith("/id@")) {
                telegram.enviarTexto(config.telegramBotToken, chat.path("id").asText(),
                        "ID deste grupo: <code>" + chat.path("id").asText() + "</code>");
            }
            return;
        }
        if (!"private".equals(tipo)) return;
        long usuario = chat.path("id").asLong();
        if (texto.startsWith("/start dono_")) {
            boolean certo = config.telegramDonoCodigo != null && texto.equals("/start dono_" + config.telegramDonoCodigo);
            if (certo) config.telegramDonoId = usuario;
            telegram.enviarTexto(config.telegramBotToken, usuario, certo
                    ? "✅ Pronto! Este é o Telegram do dono do <b>" + Telegram.html(config.nomeNegocio) + "</b>.\n\n"
                            + "Quando você copiar o acervo de um grupo, eu uso esta conversa para ler as mensagens: elas"
                            + " aparecem e somem rapidinho, pode ignorar."
                    : "Este link de dono não vale mais. Abra a Biblioteca no painel e toque de novo em Conectar meu Telegram.");
            return;
        }
        if (texto.startsWith("/start")) {
            String codigo = texto.substring("/start".length()).trim();
            iniciar(config, msg.path("from"), codigo);
            return;
        }
        if (texto.equals("/grupos") || texto.equals("/links")) {
            iniciar(config, msg.path("from"), "");
            return;
        }
        Membro m = Membro.<Membro>find("storeId = ?1 and telegramId = ?2", config.storeId, usuario).firstResult();
        if (m == null) {
            telegram.enviarTexto(config.telegramBotToken, usuario,
                    "Olá! Eu cuido do acesso aos grupos do <b>" + Telegram.html(config.nomeNegocio) + "</b>.\n"
                            + "Para eu te reconhecer, abra sua área de membro e toque em <b>Conectar Telegram</b>.");
            return;
        }
        String comando = texto.split("\\s+", 2)[0].replaceAll("@.*$", "").toLowerCase();
        if (comando.equals("/livro") || comando.equals("/livros") || comando.equals("/buscar")) {
            biblioteca.pedir(config, m, usuario, texto.contains(" ") ? texto.substring(texto.indexOf(' ') + 1) : "");
            return;
        }
        if (texto.isEmpty() || texto.startsWith("/")) {
            telegram.enviarTexto(config.telegramBotToken, usuario, "Para falar com a equipe, é só escrever sua mensagem aqui"
                    + " (por enquanto eu só entendo texto).\n\n/grupos — receber os links dos seus grupos"
                    + (Livro.count("storeId", config.storeId) > 0 ? "\n/livro nome — pedir um livro da biblioteca" : ""));
            return;
        }
        // Mensagem de texto: vai para o Suporte.
        if (suporte.doTelegram(m.cliente, texto)) {
            telegram.enviarTexto(config.telegramBotToken, usuario,
                    "Recebemos sua mensagem ✅ A equipe responde por aqui mesmo, é só aguardar.");
        }
    }

    // /start <codigo>: liga o Telegram ao membro e manda os links.
    private void iniciar(Config config, JsonNode de, String codigo) {
        long usuario = de.path("id").asLong();
        String token = config.telegramBotToken;
        Membro m = codigo.isEmpty()
                ? Membro.<Membro>find("storeId = ?1 and telegramId = ?2", config.storeId, usuario).firstResult()
                : Membro.<Membro>find("storeId = ?1 and codigo = ?2", config.storeId, codigo.toUpperCase()).firstResult();
        if (m == null) {
            telegram.enviarTexto(token, usuario, "Olá! Não encontrei seu cadastro. Abra sua área de membro e toque em "
                    + "<b>Conectar Telegram</b>.");
            return;
        }
        // Esta conta do Telegram estava ligada a outro membro? Desliga.
        Membro.update("telegramId = null where storeId = ?1 and telegramId = ?2 and id <> ?3", config.storeId, usuario, m.id);
        m.telegramId = usuario;
        if (de.hasNonNull("username")) m.telegramUsuario = de.path("username").asText();

        Membros.Base base = membros.base(config.storeId);
        Membros.Estado e = base.estado(m.cliente.id);
        StringBuilder r = new StringBuilder("Olá, <b>")
                .append(Telegram.html(Membros.primeiroNome(m.cliente.nome)))
                .append("</b>! Seu Telegram está conectado ao <b>")
                .append(Telegram.html(config.nomeNegocio))
                .append("</b>. Por aqui você recebe seus links e avisos.");
        if (!e.temAcesso()) {
            r.append("\n\nSeu acesso ainda não está liberado. Veja sua situação e pague por aqui:\n")
                    .append(endereco.areaMembro(m.codigo));
        } else {
            r.append("\n\n<b>Seus grupos:</b>");
            for (UUID grupoId : e.gruposComDireito()) {
                Grupo g = base.grupoPorId.get(grupoId);
                r.append("\n\n• <b>").append(Telegram.html(g.nome)).append("</b>\n");
                if (g.automatico(config)) {
                    Acesso a = Acesso.<Acesso>find("grupo = ?1 and cliente = ?2", g, m.cliente).firstResult();
                    if (a != null && Acesso.NO_GRUPO.equals(a.status)) {
                        r.append("Você já está no grupo ✅");
                    } else {
                        String link = a != null && Acesso.CONVIDADO.equals(a.status) && a.conviteLink != null
                                ? a.conviteLink
                                : controle.convidarNoTelegram(config, g, m.cliente, m, true, false);
                        r.append("Entre por aqui: ").append(link);
                    }
                } else if (g.linkConvite != null) {
                    r.append("Entre por aqui: ").append(g.linkConvite);
                } else {
                    r.append("A equipe vai te adicionar em breve.");
                }
            }
        }
        if (e.temAcesso() && Livro.count("storeId", config.storeId) > 0) {
            r.append("\n\n📚 Para pedir um livro da biblioteca, escreva <b>/livro</b> e o nome. Ex.: <code>/livro dom casmurro</code>");
        }
        telegram.enviarTexto(token, usuario, r.toString());
    }

    private void roboNoGrupo(Config config, JsonNode mudanca) {
        JsonNode chat = mudanca.path("chat");
        String status = mudanca.path("new_chat_member").path("status").asText();
        if ("left".equals(status) || "kicked".equals(status)) {
            detectados.getOrDefault(config.storeId, new ConcurrentHashMap<>()).remove(chat.path("id").asText());
            return;
        }
        registrarGrupo(config.storeId, chat, "administrator".equals(status));
    }

    private void registrarGrupo(UUID storeId, JsonNode chat, Boolean administrador) {
        String id = chat.path("id").asText();
        Map<String, GrupoDetectado> daLoja = detectados.computeIfAbsent(storeId, k -> new ConcurrentHashMap<>());
        GrupoDetectado antes = daLoja.get(id);
        boolean admin = administrador != null ? administrador : antes != null && antes.administrador();
        daLoja.put(id, new GrupoDetectado(id, chat.path("title").asText("Grupo"), admin, OffsetDateTime.now()));
    }

    // Alguém tocou no link de entrada e pediu para entrar.
    private void pedidoDeEntrada(Config config, JsonNode pedido) {
        String chatId = pedido.path("chat").path("id").asText();
        long usuario = pedido.path("from").path("id").asLong();
        String link = pedido.path("invite_link").path("invite_link").asText(null);
        Grupo g = Grupo.<Grupo>find("storeId = ?1 and telegramChatId = ?2", config.storeId, chatId).firstResult();
        if (g == null) return; // grupo que o módulo não controla

        Acesso a = link != null
                ? Acesso.<Acesso>find("grupo = ?1 and conviteLink = ?2", g, link).firstResult()
                : null;
        Membro m;
        if (a != null) {
            m = membros.membro(a.cliente);
            if (m.telegramId != null && m.telegramId != usuario) {
                telegram.recusarEntrada(config.telegramBotToken, chatId, usuario);
                ControleAcesso.registrar(g, a.cliente, "recusado", true, "Link usado por outra conta do Telegram");
                return;
            }
        } else {
            m = Membro.<Membro>find("storeId = ?1 and telegramId = ?2", config.storeId, usuario).firstResult();
            if (m == null) {
                telegram.recusarEntrada(config.telegramBotToken, chatId, usuario);
                return;
            }
        }

        Cliente c = m.cliente;
        Membros.Base base = membros.base(config.storeId);
        Membros.Estado e = base.estado(c.id);
        if (!e.gruposComDireito().contains(g.id)) {
            telegram.recusarEntrada(config.telegramBotToken, chatId, usuario);
            ControleAcesso.registrar(g, c, "recusado", true,
                    "Sem acesso: " + ControleAcesso.motivoRemocao(base, e, g));
            return;
        }
        telegram.aprovarEntrada(config.telegramBotToken, chatId, usuario);
        m.telegramId = usuario;
        JsonNode de = pedido.path("from");
        if (de.hasNonNull("username")) m.telegramUsuario = de.path("username").asText();
        Acesso acesso = ControleAcesso.acesso(g, c);
        ControleAcesso.marcar(acesso, Acesso.NO_GRUPO);
        acesso.entrouEm = OffsetDateTime.now();
        ControleAcesso.registrar(g, c, "entrou", true, "Entrada aprovada pelo robô");
    }

    // Alguém saiu, foi tirado ou entrou no grupo.
    private void mudancaNoGrupo(Config config, JsonNode mudanca) {
        String chatId = mudanca.path("chat").path("id").asText();
        Grupo g = Grupo.<Grupo>find("storeId = ?1 and telegramChatId = ?2", config.storeId, chatId).firstResult();
        if (g == null) return;
        JsonNode pessoa = mudanca.path("new_chat_member").path("user");
        long usuario = pessoa.path("id").asLong();
        String novo = mudanca.path("new_chat_member").path("status").asText();
        String antigo = mudanca.path("old_chat_member").path("status").asText();
        if ("administrator".equals(novo) || "administrator".equals(antigo)) gestao.esquecerAdmins(chatId);
        if (DENTRO.contains(novo) && !DENTRO.contains(antigo) && g.automatico(config)) gestao.boasVindas(config, g, pessoa);
        Membro m = Membro.<Membro>find("storeId = ?1 and telegramId = ?2", config.storeId, usuario).firstResult();
        if (m == null) return;

        Acesso a = ControleAcesso.acesso(g, m.cliente);
        boolean saiu = ("left".equals(novo) || "kicked".equals(novo)) && DENTRO.contains(antigo);
        boolean entrou = DENTRO.contains(novo) && !DENTRO.contains(antigo);
        if (saiu && !Acesso.REMOVIDO.equals(a.status)) {
            ControleAcesso.marcar(a, Acesso.REMOVIDO);
            ControleAcesso.registrar(g, m.cliente, "removido", true,
                    "kicked".equals(novo) ? "Removido por um administrador do grupo" : "Saiu do grupo");
        } else if (entrou && !Acesso.NO_GRUPO.equals(a.status)) {
            ControleAcesso.marcar(a, Acesso.NO_GRUPO);
            a.entrouEm = OffsetDateTime.now();
            ControleAcesso.registrar(g, m.cliente, "entrou", true, "Entrou no grupo");
        }
    }
}
