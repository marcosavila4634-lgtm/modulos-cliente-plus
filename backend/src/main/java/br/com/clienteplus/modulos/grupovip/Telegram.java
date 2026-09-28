package br.com.clienteplus.modulos.grupovip;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;

// Chamadas à API oficial de robôs do Telegram (https://core.telegram.org/bots/api).
//
// O dono cria o robô no @BotFather, cola o token em Configurações e coloca o
// robô como ADMINISTRADOR do grupo (com permissão de convidar e banir). A
// partir daí o robô: cria um link de entrada por membro, aprova só quem pagou,
// tira quem ficou sem acesso, publica conteúdos e manda mensagens no privado
// (para quem já conversou com o robô). Também controla o grupo: fixa, edita e
// apaga posts, envia enquetes, apaga mensagens e silencia (moderação), trava o
// grupo, muda nome/foto/descrição e cria tópicos.
//
// No projeto principal: Edge Function do Supabase com o token guardado como
// segredo, recebendo as novidades por webhook em vez de consultar
// (getUpdates) de tempo em tempo.
@ApplicationScoped
public class Telegram {

    public static class ErroTelegram extends RuntimeException {
        // texto original do Telegram (em inglês), para decidir o que fazer
        public final String original;
        // "muitos envios": segundos para esperar antes de tentar de novo (0 = não é isso)
        public final int esperarSegundos;

        public ErroTelegram(String mensagem) {
            this(mensagem, mensagem, 0);
        }

        public ErroTelegram(String mensagem, String original, int esperarSegundos) {
            super(mensagem);
            this.original = original;
            this.esperarSegundos = esperarSegundos;
        }
    }

    // Botão com link embaixo da mensagem.
    public record Botao(String texto, String url) {}

    // Onde e como enviar: tópico do grupo (modo fórum), proteção contra
    // encaminhar/salvar e botões.
    public record Opcoes(Long topico, boolean proteger, List<Botao> botoes) {
        public static final Opcoes NENHUMA = new Opcoes(null, false, List.of());

        public Opcoes semBotoes() {
            return new Opcoes(topico, proteger, List.of());
        }
    }

    private static final HttpClient HTTP = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    @Inject
    ObjectMapper json;

    @ConfigProperty(name = "modulos.uploads-dir")
    String pastaUploads;

    // Endereço da API de robôs. Com um servidor próprio (telegram-bot-api) o
    // limite de arquivo sobe de 50 MB para 2 GB; no laboratório também serve
    // para testar com um Telegram de mentira.
    @ConfigProperty(name = "grupo-vip.telegram-api", defaultValue = "https://api.telegram.org")
    String api;

    public JsonNode chamar(String token, String metodo, Map<String, Object> parametros) {
        try {
            String corpo = json.writeValueAsString(parametros);
            HttpRequest req = HttpRequest.newBuilder(URI.create(api + "/bot" + token + "/" + metodo))
                    .timeout(Duration.ofSeconds(20))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(corpo, StandardCharsets.UTF_8))
                    .build();
            return resposta(HTTP.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)));
        } catch (IOException e) {
            throw new ErroTelegram("Sem conexão com o Telegram: " + e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ErroTelegram("Envio interrompido");
        }
    }

    private JsonNode resposta(HttpResponse<String> res) throws IOException {
        JsonNode r = json.readTree(res.body());
        if (!r.path("ok").asBoolean(false)) {
            if (res.statusCode() == 401 || res.statusCode() == 404) {
                throw new ErroTelegram("Token do robô inválido: confira o token enviado pelo @BotFather");
            }
            String d = r.path("description").asText("erro " + res.statusCode());
            // Pediu para mudar algo que já estava igual: não é erro.
            if (d.toLowerCase().contains("not modified")) return json.createObjectNode();
            int esperar = r.path("parameters").path("retry_after").asInt(0);
            if (esperar > 0) throw new ErroTelegram("O Telegram pediu para esperar " + esperar + " segundos (muitos envios)", d, esperar);
            throw new ErroTelegram(traduzir(d), d, 0);
        }
        return r.path("result");
    }

    // Mensagens de erro mais comuns, em português.
    private static String traduzir(String d) {
        String t = d.toLowerCase();
        if (t.contains("user is an administrator") || t.contains("can't remove chat owner")
                || t.contains("can't restrict self")) {
            return "Não dá para silenciar ou remover um administrador do grupo";
        }
        if (t.contains("not enough rights") || t.contains("administrator")) {
            return "O robô precisa ser administrador do grupo com as permissões de convidar, banir, apagar, fixar"
                    + " e (se usar tópicos) gerenciar tópicos";
        }
        if (t.contains("message to edit not found") || t.contains("message to delete not found")
                || t.contains("message to pin not found") || t.contains("message to unpin not found")) {
            return "O post não existe mais no grupo (foi apagado no Telegram)";
        }
        if (t.contains("message can't be deleted")) {
            return "O robô não pode apagar esta mensagem (precisa ser administrador com permissão de apagar)";
        }
        if (t.contains("message can't be edited")) return "Esta mensagem não pode mais ser editada";
        if (t.contains("not a forum")) {
            return "Este grupo não usa tópicos: no Telegram, abra o grupo › Editar › ligue \"Tópicos\"";
        }
        if (t.contains("thread not found") || t.contains("topic_deleted") || t.contains("topic_closed")) {
            return "O tópico não existe mais ou está fechado";
        }
        if (t.contains("supergroup")) return "Esta função só existe em supergrupos (grupos com ID começando em -100)";
        if (t.contains("poll has already been closed")) return "Esta enquete já foi encerrada";
        if (t.contains("button_url_invalid") || t.contains("wrong http url")) return "Link do botão inválido";
        if (t.contains("chat not found")) return "Grupo não encontrado: confira o ID do grupo e se o robô está nele";
        if (t.contains("bot was blocked")) return "A pessoa bloqueou o robô";
        if (t.contains("can't initiate") || t.contains("bot can't initiate")) {
            return "A pessoa ainda não iniciou conversa com o robô";
        }
        if (t.contains("user not found") || t.contains("participant_id_invalid")) return "Pessoa não encontrada no grupo";
        return "Telegram: " + d;
    }

    // ---------- Métodos usados ----------

    public JsonNode quemSouEu(String token) {
        return chamar(token, "getMe", Map.of());
    }

    // Link de entrada exclusivo: a pessoa pede para entrar e o robô aprova se
    // ela tiver acesso (creates_join_request). O nome do link identifica o membro.
    public String criarConvite(String token, String chatId, String nome) {
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("chat_id", chatId);
        p.put("name", nome.length() > 32 ? nome.substring(0, 32) : nome);
        p.put("creates_join_request", true);
        return chamar(token, "createChatInviteLink", p).path("invite_link").asText();
    }

    public void revogarConvite(String token, String chatId, String link) {
        chamar(token, "revokeChatInviteLink", Map.of("chat_id", chatId, "invite_link", link));
    }

    public void aprovarEntrada(String token, String chatId, long usuario) {
        chamar(token, "approveChatJoinRequest", Map.of("chat_id", chatId, "user_id", usuario));
    }

    public void recusarEntrada(String token, String chatId, long usuario) {
        chamar(token, "declineChatJoinRequest", Map.of("chat_id", chatId, "user_id", usuario));
    }

    // Tira do grupo sem banir para sempre (banir e desbanir em seguida):
    // se voltar a pagar, recebe um link novo e consegue entrar.
    public void removerDoGrupo(String token, String chatId, long usuario) {
        chamar(token, "banChatMember", Map.of("chat_id", chatId, "user_id", usuario));
        chamar(token, "unbanChatMember", Map.of("chat_id", chatId, "user_id", usuario, "only_if_banned", true));
    }

    public long enviarTexto(String token, Object chatId, String textoHtml) {
        return enviarTexto(token, chatId, textoHtml, Opcoes.NENHUMA);
    }

    // Devolve o id da mensagem no chat (para editar, fixar ou apagar depois).
    public long enviarTexto(String token, Object chatId, String textoHtml, Opcoes o) {
        return comBotoes(o, op -> {
            Map<String, Object> p = new LinkedHashMap<>();
            p.put("chat_id", chatId);
            p.put("text", textoHtml);
            p.put("parse_mode", "HTML");
            p.put("link_preview_options", Map.of("is_disabled", false));
            aplicar(p, op);
            return chamar(token, "sendMessage", p);
        }).path("message_id").asLong();
    }

    // Foto ou vídeo com legenda. Arquivos enviados ao laboratório
    // (/api/arquivos/...) vão como upload; links de fora vão como URL.
    public long enviarMidia(String token, Object chatId, String tipo, String url, String legendaHtml, Opcoes o) {
        String metodo = "video".equals(tipo) ? "sendVideo" : "sendPhoto";
        String campo = "video".equals(tipo) ? "video" : "photo";
        String legenda = legenda(legendaHtml);
        return comBotoes(o, op -> {
            Map<String, Object> p = new LinkedHashMap<>();
            p.put("chat_id", chatId);
            p.put("caption", legenda);
            p.put("parse_mode", "HTML");
            aplicar(p, op);
            if (url.startsWith("/api/arquivos/")) {
                Path arquivo = arquivoLocal(url);
                return enviarArquivo(token, metodo, p, campo, arquivo, arquivo.getFileName().toString());
            }
            p.put(campo, url);
            return chamar(token, metodo, p);
        }).path("message_id").asLong();
    }

    static String legenda(String html) {
        return html.length() > 1024 ? html.substring(0, 1020) + "…" : html;
    }

    // Se o Telegram recusar o link do botão (ex.: endereço local do
    // laboratório), manda de novo sem os botões: o link continua no texto.
    private JsonNode comBotoes(Opcoes o, Function<Opcoes, JsonNode> envio) {
        try {
            return envio.apply(o);
        } catch (ErroTelegram e) {
            String t = e.original.toLowerCase();
            if (o.botoes().isEmpty() || !(t.contains("button") || t.contains("http url") || t.contains("reply markup"))) {
                throw e;
            }
            return envio.apply(o.semBotoes());
        }
    }

    private static void aplicar(Map<String, Object> p, Opcoes o) {
        if (o.topico() != null) p.put("message_thread_id", o.topico());
        if (o.proteger()) p.put("protect_content", true);
        if (!o.botoes().isEmpty()) p.put("reply_markup", teclado(o.botoes()));
    }

    private static Map<String, Object> teclado(List<Botao> botoes) {
        return Map.of("inline_keyboard", botoes.stream()
                .map(b -> List.of(Map.of("text", b.texto(), "url", b.url())))
                .toList());
    }

    private Path arquivoLocal(String url) {
        Path pasta = Paths.get(pastaUploads).toAbsolutePath().normalize();
        Path arquivo = pasta.resolve(url.substring("/api/arquivos/".length())).normalize();
        if (!arquivo.startsWith(pasta) || !Files.isRegularFile(arquivo)) {
            throw new ErroTelegram("Arquivo não encontrado");
        }
        return arquivo;
    }

    // Envio com arquivo (multipart). Campos que não são texto vão como JSON.
    private JsonNode enviarArquivo(String token, String metodo, Map<String, Object> campos, String campo, Path arquivo,
                                   String nomeArquivo) {
        try {
            String limite = "----gv" + UUID.randomUUID();
            ByteArrayOutputStream corpo = new ByteArrayOutputStream();
            for (Map.Entry<String, Object> c : campos.entrySet()) {
                Object v = c.getValue();
                parte(corpo, limite, c.getKey(), v instanceof String || v instanceof Number || v instanceof Boolean
                        ? String.valueOf(v)
                        : json.writeValueAsString(v));
            }
            corpo.write(("--" + limite + "\r\nContent-Disposition: form-data; name=\"" + campo + "\"; filename=\""
                    + nomeArquivo.replace("\"", "'").replace("\r", "").replace("\n", "") + "\"\r\nContent-Type: application/octet-stream\r\n\r\n")
                    .getBytes(StandardCharsets.UTF_8));
            corpo.write(Files.readAllBytes(arquivo));
            corpo.write(("\r\n--" + limite + "--\r\n").getBytes(StandardCharsets.UTF_8));

            HttpRequest req = HttpRequest.newBuilder(URI.create(api + "/bot" + token + "/" + metodo))
                    .timeout(Duration.ofSeconds(120))
                    .header("Content-Type", "multipart/form-data; boundary=" + limite)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(corpo.toByteArray()))
                    .build();
            return resposta(HTTP.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)));
        } catch (IOException e) {
            throw new ErroTelegram("Não foi possível enviar o arquivo: " + e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ErroTelegram("Envio interrompido");
        }
    }

    private static void parte(ByteArrayOutputStream corpo, String limite, String nome, String valor) throws IOException {
        corpo.write(("--" + limite + "\r\nContent-Disposition: form-data; name=\"" + nome + "\"\r\n\r\n" + valor + "\r\n")
                .getBytes(StandardCharsets.UTF_8));
    }

    // ---------- Documentos (livros da Biblioteca) ----------

    // Até 50 MB (limite da API de robôs). Devolve a mensagem (message_id e document.file_id).
    public JsonNode enviarDocumento(String token, Object chatId, Path arquivo, String nomeArquivo, String legendaHtml, Opcoes o) {
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("chat_id", chatId);
        p.put("caption", legenda(legendaHtml));
        p.put("parse_mode", "HTML");
        // vídeo, foto e áudio também vão como arquivo (o file_id fica em "document")
        p.put("disable_content_type_detection", true);
        aplicar(p, o);
        return enviarArquivo(token, "sendDocument", p, "document", arquivo, nomeArquivo);
    }

    // Reenvia um arquivo que já está no Telegram (sem subir de novo).
    public JsonNode enviarDocumentoPorId(String token, Object chatId, String fileId, String legendaHtml, Opcoes o) {
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("chat_id", chatId);
        p.put("document", fileId);
        p.put("caption", legenda(legendaHtml));
        p.put("parse_mode", "HTML");
        aplicar(p, o);
        return chamar(token, "sendDocument", p);
    }

    // Encaminha uma mensagem (sem notificar). Devolve a mensagem encaminhada
    // inteira: é o único jeito de um robô "ver" o que há numa mensagem antiga.
    public JsonNode encaminhar(String token, Object deChat, long mensagem, Object paraChat) {
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("chat_id", paraChat);
        p.put("from_chat_id", deChat);
        p.put("message_id", mensagem);
        p.put("disable_notification", true);
        return chamar(token, "forwardMessage", p);
    }

    // Copia uma mensagem (arquivo + legenda) para outro chat, sem o "encaminhado de".
    public long copiar(String token, Object deChat, long mensagem, Object paraChat, Opcoes o) {
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("chat_id", paraChat);
        p.put("from_chat_id", deChat);
        p.put("message_id", mensagem);
        aplicar(p, o);
        return chamar(token, "copyMessage", p).path("message_id").asLong();
    }

    // Botão que, ao ser tocado, avisa o robô (callback_query) em vez de abrir um link.
    public record Escolha(String texto, String dados) {}

    public void enviarEscolhas(String token, Object chatId, String textoHtml, List<Escolha> escolhas) {
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("chat_id", chatId);
        p.put("text", textoHtml);
        p.put("parse_mode", "HTML");
        p.put("reply_markup", Map.of("inline_keyboard", escolhas.stream()
                .map(e -> List.of(Map.of("text", e.texto(), "callback_data", e.dados())))
                .toList()));
        chamar(token, "sendMessage", p);
    }

    // ---------- Menus do robô (Atendente) ----------

    // Botão de um menu: avisa o robô (dados) ou abre um link (url).
    public record Tecla(String texto, String dados, String url) {
        public static Tecla acao(String texto, String dados) {
            return new Tecla(texto, dados, null);
        }

        public static Tecla link(String texto, String url) {
            return new Tecla(texto, null, url);
        }
    }

    // Mensagem com botões em linhas. Devolve o id da mensagem.
    public long enviarMenu(String token, Object chatId, String textoHtml, List<List<Tecla>> linhas) {
        return comLinks(textoHtml, linhas, (texto, teclas) -> {
            Map<String, Object> p = new LinkedHashMap<>();
            p.put("chat_id", chatId);
            p.put("text", texto);
            p.put("parse_mode", "HTML");
            p.put("link_preview_options", Map.of("is_disabled", true));
            if (!teclas.isEmpty()) p.put("reply_markup", Map.of("inline_keyboard", tecladoMenu(teclas)));
            return chamar(token, "sendMessage", p);
        }).path("message_id").asLong();
    }

    // Troca o texto e os botões de uma mensagem do robô (navegar no menu sem
    // encher a conversa de mensagens).
    public void editarMenu(String token, Object chatId, long mensagem, String textoHtml, List<List<Tecla>> linhas) {
        comLinks(textoHtml, linhas, (texto, teclas) -> {
            Map<String, Object> p = new LinkedHashMap<>();
            p.put("chat_id", chatId);
            p.put("message_id", mensagem);
            p.put("text", texto);
            p.put("parse_mode", "HTML");
            p.put("link_preview_options", Map.of("is_disabled", true));
            p.put("reply_markup", Map.of("inline_keyboard", tecladoMenu(teclas)));
            return chamar(token, "editMessageText", p);
        });
    }

    // Se o Telegram recusar um botão de link (ex.: endereço local do
    // laboratório), manda sem os botões de link e com os links no texto.
    private JsonNode comLinks(String textoHtml, List<List<Tecla>> linhas,
                              java.util.function.BiFunction<String, List<List<Tecla>>, JsonNode> envio) {
        try {
            return envio.apply(textoHtml, linhas);
        } catch (ErroTelegram e) {
            String t = e.original.toLowerCase();
            boolean temLink = linhas.stream().flatMap(List::stream).anyMatch(k -> k.url() != null);
            if (!temLink || !(t.contains("button") || t.contains("http url") || t.contains("reply markup"))) throw e;
            StringBuilder texto = new StringBuilder(textoHtml);
            List<List<Tecla>> semLinks = new ArrayList<>();
            for (List<Tecla> linha : linhas) {
                List<Tecla> resto = new ArrayList<>();
                for (Tecla k : linha) {
                    if (k.url() != null) texto.append("\n\n").append(html(k.texto())).append(": ").append(k.url());
                    else resto.add(k);
                }
                if (!resto.isEmpty()) semLinks.add(resto);
            }
            return envio.apply(texto.toString(), semLinks);
        }
    }

    private static List<List<Map<String, String>>> tecladoMenu(List<List<Tecla>> linhas) {
        return linhas.stream()
                .map(linha -> linha.stream()
                        .map(k -> k.url() != null
                                ? Map.of("text", k.texto(), "url", k.url())
                                : Map.of("text", k.texto(), "callback_data", k.dados()))
                        .toList())
                .toList();
    }

    // Comandos que aparecem no botão "Menu" da conversa com o robô.
    public void definirComandos(String token, Map<String, String> comandos) {
        chamar(token, "setMyCommands", Map.of("commands", comandos.entrySet().stream()
                .map(c -> Map.of("command", c.getKey(), "description", c.getValue()))
                .toList()));
    }

    // Tira o "carregando" do botão tocado (e mostra um aviso rápido, se houver).
    public void responderToque(String token, String toqueId, String aviso) {
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("callback_query_id", toqueId);
        if (aviso != null) p.put("text", aviso);
        chamar(token, "answerCallbackQuery", p);
    }

    // ---------- Posts já enviados ----------

    public void editarTexto(String token, Object chatId, long mensagem, String textoHtml, List<Botao> botoes) {
        comBotoes(new Opcoes(null, false, botoes), op -> {
            Map<String, Object> p = new LinkedHashMap<>();
            p.put("chat_id", chatId);
            p.put("message_id", mensagem);
            p.put("text", textoHtml);
            p.put("parse_mode", "HTML");
            aplicar(p, op);
            return chamar(token, "editMessageText", p);
        });
    }

    public void editarLegenda(String token, Object chatId, long mensagem, String legendaHtml, List<Botao> botoes) {
        comBotoes(new Opcoes(null, false, botoes), op -> {
            Map<String, Object> p = new LinkedHashMap<>();
            p.put("chat_id", chatId);
            p.put("message_id", mensagem);
            p.put("caption", legenda(legendaHtml));
            p.put("parse_mode", "HTML");
            aplicar(p, op);
            return chamar(token, "editMessageCaption", p);
        });
    }

    public void apagarMensagem(String token, Object chatId, long mensagem) {
        chamar(token, "deleteMessage", Map.of("chat_id", chatId, "message_id", mensagem));
    }

    // Fixa sem notificar todo mundo de novo (o post já notificou).
    public void fixar(String token, Object chatId, long mensagem) {
        chamar(token, "pinChatMessage", Map.of("chat_id", chatId, "message_id", mensagem, "disable_notification", true));
    }

    public void desafixar(String token, Object chatId, long mensagem) {
        chamar(token, "unpinChatMessage", Map.of("chat_id", chatId, "message_id", mensagem));
    }

    // ---------- Enquetes ----------

    // tipo: "enquete" | "quiz". Devolve a mensagem enviada (message_id e poll.id).
    public JsonNode enviarEnquete(String token, Object chatId, String pergunta, List<String> opcoes, String tipo,
                                  Integer correta, String explicacao, boolean anonima, boolean multipla, Opcoes o) {
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("chat_id", chatId);
        p.put("question", pergunta);
        p.put("options", opcoes.stream().map(t -> Map.of("text", t)).toList());
        p.put("is_anonymous", anonima);
        if ("quiz".equals(tipo)) {
            p.put("type", "quiz");
            p.put("correct_option_id", correta);
            if (explicacao != null && !explicacao.isBlank()) p.put("explanation", explicacao);
        } else {
            p.put("type", "regular");
            p.put("allows_multiple_answers", multipla);
        }
        aplicar(p, o);
        return chamar(token, "sendPoll", p);
    }

    // Encerra a votação. Devolve a enquete com o resultado final.
    public JsonNode encerrarEnquete(String token, Object chatId, long mensagem) {
        return chamar(token, "stopPoll", Map.of("chat_id", chatId, "message_id", mensagem));
    }

    // ---------- Membros e permissões ----------

    // Tira a permissão de escrever até "ate" (segundos desde 1970).
    public void silenciar(String token, Object chatId, long usuario, long ate) {
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("chat_id", chatId);
        p.put("user_id", usuario);
        p.put("permissions", permissoesDeEnvio(false));
        p.put("use_independent_chat_permissions", true);
        p.put("until_date", ate);
        chamar(token, "restrictChatMember", p);
    }

    // Trava (só administradores escrevem) ou libera o grupo. As outras
    // permissões (convidar, mudar dados, fixar...) ficam como o dono deixou.
    public void liberarEscrita(String token, Object chatId, boolean liberar) {
        JsonNode atuais = infoGrupo(token, chatId).path("permissions");
        Map<String, Object> permissoes = new LinkedHashMap<>();
        for (String outra : List.of("can_change_info", "can_invite_users", "can_pin_messages", "can_manage_topics")) {
            if (atuais.has(outra)) permissoes.put(outra, atuais.path(outra).asBoolean());
        }
        permissoes.putAll(permissoesDeEnvio(liberar));
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("chat_id", chatId);
        p.put("permissions", permissoes);
        p.put("use_independent_chat_permissions", true);
        chamar(token, "setChatPermissions", p);
    }

    // Permissões de um membro (restrictChatMember). "Tudo liberado" é
    // limitado pelo que o grupo permite a todos.
    //   completo: tudo | sem_midia: só texto | leitura: só lê
    public void restringir(String token, Object chatId, long usuario, String nivel) {
        Map<String, Object> permissoes = new LinkedHashMap<>(permissoesDeEnvio(!"leitura".equals(nivel)));
        if ("sem_midia".equals(nivel)) {
            for (String k : List.of("can_send_audios", "can_send_documents", "can_send_photos", "can_send_videos",
                    "can_send_video_notes", "can_send_voice_notes", "can_send_polls", "can_send_other_messages",
                    "can_add_web_page_previews")) {
                permissoes.put(k, false);
            }
        }
        boolean outras = !"leitura".equals(nivel);
        for (String k : List.of("can_invite_users", "can_pin_messages", "can_change_info", "can_manage_topics")) {
            permissoes.put(k, outras);
        }
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("chat_id", chatId);
        p.put("user_id", usuario);
        p.put("permissions", permissoes);
        p.put("use_independent_chat_permissions", true);
        chamar(token, "restrictChatMember", p);
    }

    // Torna administrador com os direitos escolhidos (nomes da API, ex.:
    // can_delete_messages). Sem direitos = deixa de ser administrador.
    public void promover(String token, Object chatId, long usuario, java.util.Collection<String> direitos) {
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("chat_id", chatId);
        p.put("user_id", usuario);
        for (String d : List.of("can_manage_chat", "can_delete_messages", "can_restrict_members", "can_pin_messages",
                "can_invite_users", "can_change_info", "can_manage_topics", "can_manage_video_chats", "can_promote_members")) {
            p.put(d, !direitos.isEmpty() && ("can_manage_chat".equals(d) || direitos.contains(d)));
        }
        chamar(token, "promoteChatMember", p);
    }

    // Título que aparece ao lado do nome do administrador (até 16 letras, sem emoji).
    public void tituloAdministrador(String token, Object chatId, long usuario, String titulo) {
        chamar(token, "setChatAdministratorCustomTitle",
                Map.of("chat_id", chatId, "user_id", usuario, "custom_title", titulo == null ? "" : titulo));
    }

    private static Map<String, Object> permissoesDeEnvio(boolean pode) {
        Map<String, Object> m = new LinkedHashMap<>();
        for (String k : List.of("can_send_messages", "can_send_audios", "can_send_documents", "can_send_photos",
                "can_send_videos", "can_send_video_notes", "can_send_voice_notes", "can_send_polls",
                "can_send_other_messages", "can_add_web_page_previews")) {
            m.put(k, pode);
        }
        return m;
    }

    public List<Long> administradores(String token, Object chatId) {
        List<Long> ids = new ArrayList<>();
        for (JsonNode a : chamar(token, "getChatAdministrators", Map.of("chat_id", chatId))) {
            ids.add(a.path("user").path("id").asLong());
        }
        return ids;
    }

    // ---------- Dados do grupo ----------

    public JsonNode infoGrupo(String token, Object chatId) {
        return chamar(token, "getChat", Map.of("chat_id", chatId));
    }

    public int contarMembros(String token, Object chatId) {
        return chamar(token, "getChatMemberCount", Map.of("chat_id", chatId)).asInt();
    }

    public void mudarNome(String token, Object chatId, String nome) {
        chamar(token, "setChatTitle", Map.of("chat_id", chatId, "title", nome));
    }

    public void mudarDescricao(String token, Object chatId, String descricao) {
        chamar(token, "setChatDescription", Map.of("chat_id", chatId, "description", descricao));
    }

    // Só arquivos enviados ao laboratório (o Telegram não aceita link para a foto do grupo).
    public void mudarFoto(String token, Object chatId, String url) {
        if (!url.startsWith("/api/arquivos/")) throw new ErroTelegram("Envie a foto pelo botão de enviar arquivo");
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("chat_id", chatId);
        Path arquivo = arquivoLocal(url);
        enviarArquivo(token, "setChatPhoto", p, "photo", arquivo, arquivo.getFileName().toString());
    }

    // ---------- Tópicos (grupo no modo fórum) ----------

    public long criarTopico(String token, Object chatId, String nome) {
        return chamar(token, "createForumTopic", Map.of("chat_id", chatId, "name", nome)).path("message_thread_id").asLong();
    }

    public void renomearTopico(String token, Object chatId, long topico, String nome) {
        chamar(token, "editForumTopic", Map.of("chat_id", chatId, "message_thread_id", topico, "name", nome));
    }

    public void apagarTopico(String token, Object chatId, long topico) {
        chamar(token, "deleteForumTopic", Map.of("chat_id", chatId, "message_thread_id", topico));
    }

    public JsonNode novidades(String token, long aPartirDe) {
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("offset", aPartirDe);
        p.put("timeout", 0);
        p.put("allowed_updates", new String[] {"message", "chat_join_request", "chat_member", "my_chat_member", "poll", "callback_query"});
        return chamar(token, "getUpdates", p);
    }

    // Link que abre a conversa com o robô já mandando "/start <codigo>".
    public static String linkRobo(String usuarioRobo, String codigo) {
        if (usuarioRobo == null) return null;
        return "https://t.me/" + usuarioRobo + "?start=" + URLEncoder.encode(codigo, StandardCharsets.UTF_8);
    }

    // Texto seguro para parse_mode HTML.
    public static String html(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
