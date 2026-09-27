package br.com.clienteplus.modulos.grupovip;

import static br.com.clienteplus.modulos.comum.Formatos.FUSO;

import br.com.clienteplus.modulos.comum.Erro;
import br.com.clienteplus.modulos.grupovip.TelegramContrato.*;
import com.fasterxml.jackson.databind.JsonNode;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.text.Normalizer;
import java.time.Instant;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

// Controle dos grupos do Telegram pelo painel (grupos automáticos: robô
// administrador + ID do grupo):
//
//   - proteger conteúdo: posts do robô não podem ser encaminhados nem salvos
//   - moderação: apaga links (de quem não é administrador) e palavras
//     proibidas, e pode silenciar a pessoa por alguns minutos
//   - boas-vindas no grupo e apagar os avisos "fulano entrou/saiu"
//   - travar o grupo (só administradores escrevem), na hora ou por horário
//   - nome, descrição e foto do grupo
//   - tópicos (grupo no modo fórum)
//
// A moderação e as boas-vindas acontecem quando o robô recebe a mensagem
// (RoboTelegram chama moderar/boasVindas).
@ApplicationScoped
public class GestaoTelegram {

    @Inject
    Membros membros;

    @Inject
    Telegram telegram;

    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");
    private static final Pattern LINK = Pattern.compile(
            "(?i)(https?://\\S+|www\\.\\S+|t\\.me/\\S+|telegram\\.me/\\S+|chat\\.whatsapp\\.com/\\S+|wa\\.me/\\S+)");

    // Administradores de cada grupo (consultados no Telegram a cada 10 minutos).
    private record Admins(Set<Long> ids, Instant quando) {}

    private final Map<String, Admins> admins = new ConcurrentHashMap<>();

    // ---------- Painel ----------

    public Painel painel(UUID storeId) {
        Config config = membros.config(storeId);
        List<GrupoTelegram> grupos = Grupo.<Grupo>list("storeId = ?1 and plataforma = ?2 order by nome", storeId, Grupo.TELEGRAM)
                .stream()
                .map(g -> json(config, g))
                .toList();
        return new Painel(config.robo(), config.telegramBotUsuario, grupos);
    }

    public Detalhes detalhes(UUID storeId, UUID grupoId) {
        Config config = membros.config(storeId);
        Grupo g = grupo(storeId, grupoId);
        InfoTelegram info = null;
        if (g.automatico(config)) {
            try {
                JsonNode chat = telegram.infoGrupo(config.telegramBotToken, g.telegramChatId);
                Integer total = null;
                try {
                    total = telegram.contarMembros(config.telegramBotToken, g.telegramChatId);
                } catch (Telegram.ErroTelegram ignorado) {
                    // sem a contagem, mostra o resto
                }
                JsonNode perm = chat.path("permissions");
                info = new InfoTelegram(chat.path("title").asText(g.nome), chat.path("description").asText(""), total,
                        chat.path("is_forum").asBoolean(false),
                        perm.has("can_send_messages") ? !perm.path("can_send_messages").asBoolean() : null, null);
            } catch (Telegram.ErroTelegram e) {
                info = new InfoTelegram(null, null, null, false, null, e.getMessage());
            }
        }
        List<ModeracaoJson> moderacao = Moderacao.<Moderacao>find("grupo = ?1 order by momento desc", g).page(0, 50).list()
                .stream()
                .map(GestaoTelegram::json)
                .toList();
        return new Detalhes(json(config, g), info, moderacao);
    }

    public List<ModeracaoJson> moderacao(UUID storeId) {
        return Moderacao.<Moderacao>find("storeId = ?1 order by momento desc", storeId).page(0, 200).list().stream()
                .map(GestaoTelegram::json)
                .toList();
    }

    static ModeracaoJson json(Moderacao m) {
        return new ModeracaoJson(m.id, m.grupo.id, m.grupo.nome, m.nome, m.motivo, m.detalhe, m.texto, m.silenciadoAte, m.momento);
    }

    private GrupoTelegram json(Config config, Grupo g) {
        List<TopicoJson> topicos = Topico.<Topico>list("grupo = ?1 order by nome", g).stream()
                .map(t -> new TopicoJson(t.id, t.nome, t.threadId))
                .toList();
        int moderadas = (int) Moderacao.count("grupo = ?1 and momento >= ?2", g, OffsetDateTime.now().minusDays(7));
        return new GrupoTelegram(g.id, g.nome, g.telegramChatId, g.automatico(config), g.protegerConteudo, g.moderarLinks,
                g.palavrasProibidas, g.silenciarMinutos, g.boasVindasGrupo, g.apagarAvisosEntrada, g.travado,
                g.travaInicio != null ? g.travaInicio.format(HORA) : null,
                g.travaFim != null ? g.travaFim.format(HORA) : null, topicos, moderadas);
    }

    Grupo grupo(UUID storeId, UUID id) {
        Grupo g = Grupo.findById(id);
        if (g == null || !g.storeId.equals(storeId) || !Grupo.TELEGRAM.equals(g.plataforma)) {
            throw Erro.naoEncontrado("Grupo do Telegram não encontrado");
        }
        return g;
    }

    // Grupo em que o robô pode agir agora.
    private Grupo automatico(Config config, UUID grupoId) {
        Grupo g = grupo(config.storeId, grupoId);
        if (!g.automatico(config)) {
            throw Erro.conflito("O robô ainda não cuida deste grupo: conecte o robô em Configurações e informe o ID do grupo");
        }
        return g;
    }

    // ---------- Regras (proteção, moderação, boas-vindas, horário) ----------

    public void salvarRegras(UUID storeId, UUID grupoId, DadosRegras d) {
        if (d == null) throw Erro.invalido("Preencha as regras");
        Grupo g = grupo(storeId, grupoId);
        int silenciar = d.silenciarMinutos() != null ? d.silenciarMinutos() : g.silenciarMinutos;
        if (silenciar < 0 || silenciar > 7 * 24 * 60) throw Erro.invalido("Silenciar por até 7 dias");
        String boasVindas = Membros.limpo(d.boasVindasGrupo());
        if (boasVindas != null && boasVindas.length() > 1000) throw Erro.invalido("Boas-vindas com até 1.000 letras");
        String palavras = d.palavrasProibidas() != null ? d.palavrasProibidas().trim() : "";
        if (palavras.length() > 3000) throw Erro.invalido("Lista de palavras muito longa");
        LocalTime inicio = hora(d.travaInicio());
        LocalTime fim = hora(d.travaFim());
        if ((inicio == null) != (fim == null)) throw Erro.invalido("Informe a hora de travar e a de liberar");
        if (inicio != null && inicio.equals(fim)) throw Erro.invalido("A hora de travar e a de liberar precisam ser diferentes");

        boolean mudouHorario = !Objects.equals(inicio, g.travaInicio) || !Objects.equals(fim, g.travaFim);
        if (d.protegerConteudo() != null) g.protegerConteudo = d.protegerConteudo();
        if (d.moderarLinks() != null) g.moderarLinks = d.moderarLinks();
        if (d.apagarAvisosEntrada() != null) g.apagarAvisosEntrada = d.apagarAvisosEntrada();
        g.palavrasProibidas = palavras;
        g.silenciarMinutos = silenciar;
        g.boasVindasGrupo = boasVindas;
        g.travaInicio = inicio;
        g.travaFim = fim;
        if (mudouHorario) {
            g.travaHorarioEstado = null; // aplica o horário novo já
            Config config = membros.config(storeId);
            if (inicio != null && g.automatico(config)) {
                String erro = aplicarHorario(config, g);
                if (erro != null) throw Erro.invalido(erro);
            }
        }
    }

    private static LocalTime hora(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return LocalTime.parse(s.trim().length() == 4 ? "0" + s.trim() : s.trim(), HORA);
        } catch (DateTimeParseException e) {
            throw Erro.invalido("Hora inválida (use 22:00)");
        }
    }

    // ---------- Travar / liberar ----------

    public void travar(UUID storeId, UUID grupoId, boolean travar) {
        Config config = membros.config(storeId);
        Grupo g = automatico(config, grupoId);
        try {
            telegram.liberarEscrita(config.telegramBotToken, g.telegramChatId, !travar);
        } catch (Telegram.ErroTelegram e) {
            throw Erro.invalido(e.getMessage());
        }
        g.travado = travar;
    }

    // Chamado a cada minuto: no início do horário trava, no fim libera. Só age
    // na virada (quem travou/liberou na mão continua assim até a próxima virada).
    public List<String> aplicarHorarios(Config config) {
        List<String> erros = new ArrayList<>();
        if (!config.robo()) return erros;
        for (Grupo g : Grupo.<Grupo>list("storeId = ?1 and travaInicio is not null and travaFim is not null", config.storeId)) {
            if (!g.automatico(config) || !g.ativo) continue;
            String erro = aplicarHorario(config, g);
            if (erro != null) erros.add(g.nome + ": " + erro);
        }
        return erros;
    }

    private String aplicarHorario(Config config, Grupo g) {
        boolean deveTravar = dentroDoHorario(LocalTime.now(FUSO), g.travaInicio, g.travaFim);
        if (g.travaHorarioEstado != null && g.travaHorarioEstado == deveTravar) return null;
        try {
            telegram.liberarEscrita(config.telegramBotToken, g.telegramChatId, !deveTravar);
            g.travado = deveTravar;
            g.travaHorarioEstado = deveTravar;
            return null;
        } catch (Telegram.ErroTelegram e) {
            return e.getMessage();
        }
    }

    // Horário que passa da meia-noite (ex.: 22:00 até 07:00) também vale.
    static boolean dentroDoHorario(LocalTime agora, LocalTime inicio, LocalTime fim) {
        if (inicio.isBefore(fim)) return !agora.isBefore(inicio) && agora.isBefore(fim);
        return !agora.isBefore(inicio) || agora.isBefore(fim);
    }

    // ---------- Nome, descrição e foto ----------

    public void mudarDados(UUID storeId, UUID grupoId, DadosGrupoTelegram d) {
        if (d == null) throw Erro.invalido("Nada para mudar");
        Config config = membros.config(storeId);
        Grupo g = automatico(config, grupoId);
        String token = config.telegramBotToken;
        try {
            String titulo = Membros.limpo(d.titulo());
            if (titulo != null) {
                if (titulo.length() > 128) throw Erro.invalido("Nome com até 128 letras");
                telegram.mudarNome(token, g.telegramChatId, titulo);
                g.nome = titulo;
            }
            if (d.descricao() != null) {
                String descricao = d.descricao().trim();
                if (descricao.length() > 255) throw Erro.invalido("Descrição com até 255 letras");
                telegram.mudarDescricao(token, g.telegramChatId, descricao);
            }
            String foto = Membros.limpo(d.foto());
            if (foto != null) telegram.mudarFoto(token, g.telegramChatId, foto);
        } catch (Telegram.ErroTelegram e) {
            throw Erro.invalido(e.getMessage());
        }
    }

    // ---------- Tópicos ----------

    public Topico criarTopico(UUID storeId, UUID grupoId, String nome) {
        Config config = membros.config(storeId);
        Grupo g = automatico(config, grupoId);
        String n = nomeTopico(nome);
        long thread;
        try {
            thread = telegram.criarTopico(config.telegramBotToken, g.telegramChatId, n);
        } catch (Telegram.ErroTelegram e) {
            throw Erro.invalido(e.getMessage());
        }
        return registrarTopico(g, thread, n);
    }

    public void renomearTopico(UUID storeId, UUID topicoId, String nome) {
        Topico t = topico(storeId, topicoId);
        Config config = membros.config(storeId);
        String n = nomeTopico(nome);
        if (t.grupo.automatico(config)) {
            try {
                telegram.renomearTopico(config.telegramBotToken, t.grupo.telegramChatId, t.threadId, n);
            } catch (Telegram.ErroTelegram e) {
                throw Erro.invalido(e.getMessage());
            }
        }
        t.nome = n;
    }

    // Apaga o tópico no Telegram (com todas as mensagens dele) e aqui.
    public void apagarTopico(UUID storeId, UUID topicoId) {
        Topico t = topico(storeId, topicoId);
        Config config = membros.config(storeId);
        if (t.grupo.automatico(config)) {
            try {
                telegram.apagarTopico(config.telegramBotToken, t.grupo.telegramChatId, t.threadId);
            } catch (Telegram.ErroTelegram e) {
                if (!e.getMessage().startsWith("O tópico não existe")) throw Erro.invalido(e.getMessage());
            }
        }
        t.delete();
    }

    // Tópico criado pelo painel ou encontrado pelo robô.
    Topico registrarTopico(Grupo g, long thread, String nome) {
        Topico t = Topico.<Topico>find("grupo = ?1 and threadId = ?2", g, thread).firstResult();
        if (t == null) {
            t = new Topico();
            t.storeId = g.storeId;
            t.grupo = g;
            t.threadId = thread;
            t.nome = nome;
            t.persist();
        } else {
            t.nome = nome;
        }
        return t;
    }

    private static String nomeTopico(String nome) {
        String n = Membros.limpo(nome);
        if (n == null) throw Erro.invalido("Informe o nome do tópico");
        if (n.length() > 128) throw Erro.invalido("Nome com até 128 letras");
        return n;
    }

    private static Topico topico(UUID storeId, UUID id) {
        Topico t = Topico.findById(id);
        if (t == null || !t.storeId.equals(storeId)) throw Erro.naoEncontrado("Tópico não encontrado");
        return t;
    }

    // ---------- Moderação (chamada pelo robô a cada mensagem no grupo) ----------

    // Devolve true se a mensagem foi apagada.
    boolean moderar(Config config, Grupo g, JsonNode msg) {
        List<String> palavras = palavras(g.palavrasProibidas);
        if (!g.moderarLinks && palavras.isEmpty()) return false;
        JsonNode chat = msg.path("chat");
        JsonNode de = msg.path("from");
        if (de.path("is_bot").asBoolean(false)) return false;
        // Admin anônimo (fala como o grupo) e posts do canal vinculado não passam pela moderação.
        JsonNode comoChat = msg.path("sender_chat");
        if (msg.path("is_automatic_forward").asBoolean(false)) return false;
        if (!comoChat.isMissingNode() && comoChat.path("id").asLong() == chat.path("id").asLong()) return false;
        boolean comoCanal = !comoChat.isMissingNode();
        long usuario = comoCanal ? comoChat.path("id").asLong() : de.path("id").asLong();
        if (!comoCanal && ehAdmin(config, g, usuario)) return false;

        String texto = msg.has("text") ? msg.path("text").asText("") : msg.path("caption").asText("");
        String motivo = null;
        String detalhe = "";
        if (g.moderarLinks) {
            String link = link(msg, texto);
            if (link != null) {
                motivo = "link";
                detalhe = link;
            }
        }
        if (motivo == null) {
            String palavra = palavraProibida(texto, palavras);
            if (palavra != null) {
                motivo = "palavra";
                detalhe = palavra;
            }
        }
        if (motivo == null) return false;

        String token = config.telegramBotToken;
        try {
            telegram.apagarMensagem(token, g.telegramChatId, msg.path("message_id").asLong());
        } catch (Telegram.ErroTelegram e) {
            Log.warnf("Moderação (%s): não deu para apagar: %s", g.nome, e.getMessage());
            return false;
        }
        OffsetDateTime silenciadoAte = null;
        if (g.silenciarMinutos > 0 && !comoCanal) {
            OffsetDateTime ate = OffsetDateTime.now().plusMinutes(g.silenciarMinutos);
            try {
                telegram.silenciar(token, g.telegramChatId, usuario, ate.toEpochSecond());
                silenciadoAte = ate;
            } catch (Telegram.ErroTelegram e) {
                Log.warnf("Moderação (%s): não deu para silenciar: %s", g.nome, e.getMessage());
            }
        }
        Moderacao m = new Moderacao();
        m.storeId = g.storeId;
        m.grupo = g;
        m.telegramUsuarioId = usuario;
        m.nome = comoCanal ? comoChat.path("title").asText("Canal") : nome(de);
        m.motivo = motivo;
        m.detalhe = detalhe.length() > 200 ? detalhe.substring(0, 200) : detalhe;
        m.texto = texto.length() > 500 ? texto.substring(0, 497) + "..." : texto;
        m.silenciadoAte = silenciadoAte;
        m.momento = OffsetDateTime.now();
        m.persist();
        return true;
    }

    private boolean ehAdmin(Config config, Grupo g, long usuario) {
        Admins a = admins.get(g.telegramChatId);
        if (a == null || a.quando().isBefore(Instant.now().minusSeconds(600))) {
            try {
                a = new Admins(new HashSet<>(telegram.administradores(config.telegramBotToken, g.telegramChatId)), Instant.now());
                admins.put(g.telegramChatId, a);
            } catch (Telegram.ErroTelegram e) {
                return false;
            }
        }
        return a.ids().contains(usuario);
    }

    // Alguém virou ou deixou de ser administrador: consulta de novo.
    void esquecerAdmins(String chatId) {
        admins.remove(chatId);
    }

    // Primeiro link da mensagem (entidades do Telegram ou texto com cara de link).
    private static String link(JsonNode msg, String texto) {
        for (String campo : List.of("entities", "caption_entities")) {
            for (JsonNode e : msg.path(campo)) {
                String tipo = e.path("type").asText();
                if ("text_link".equals(tipo)) return e.path("url").asText();
                if ("url".equals(tipo)) {
                    int ini = e.path("offset").asInt();
                    int fim = ini + e.path("length").asInt();
                    return fim <= texto.length() ? texto.substring(ini, fim) : "link";
                }
            }
        }
        Matcher m = LINK.matcher(texto);
        return m.find() ? m.group() : null;
    }

    static List<String> palavras(String lista) {
        if (lista == null || lista.isBlank()) return List.of();
        return Arrays.stream(lista.split("[\\n,;]")).map(String::trim).filter(p -> !p.isEmpty()).toList();
    }

    // Palavra (ou expressão) proibida no texto, sem ligar para acento e maiúscula.
    static String palavraProibida(String texto, List<String> palavras) {
        if (texto.isBlank()) return null;
        String t = normal(texto);
        for (String p : palavras) {
            Pattern padrao = Pattern.compile("(?<![\\p{L}\\p{N}])" + Pattern.quote(normal(p)) + "(?![\\p{L}\\p{N}])");
            if (padrao.matcher(t).find()) return p;
        }
        return null;
    }

    static String normal(String s) {
        return Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase();
    }

    // ---------- Entradas no grupo ----------

    // Mensagem de boas-vindas no grupo para quem acabou de entrar.
    void boasVindas(Config config, Grupo g, JsonNode usuario) {
        if (g.boasVindasGrupo == null || g.boasVindasGrupo.isBlank() || usuario.path("is_bot").asBoolean(false)) return;
        String mencao = "<a href=\"tg://user?id=" + usuario.path("id").asLong() + "\">"
                + Telegram.html(usuario.path("first_name").asText("")) + "</a>";
        String texto = Telegram.html(g.boasVindasGrupo)
                .replace("{nome}", mencao)
                .replace("{grupo}", Telegram.html(g.nome))
                .replace("{negocio}", Telegram.html(config.nomeNegocio));
        try {
            telegram.enviarTexto(config.telegramBotToken, g.telegramChatId, texto);
        } catch (Telegram.ErroTelegram e) {
            Log.warnf("Boas-vindas (%s): %s", g.nome, e.getMessage());
        }
    }

    // Aviso "fulano entrou/saiu": apaga se o dono pediu.
    boolean apagarAviso(Config config, Grupo g, JsonNode msg) {
        boolean aviso = msg.has("new_chat_members") || msg.has("left_chat_member");
        if (!aviso || !g.apagarAvisosEntrada) return aviso;
        try {
            telegram.apagarMensagem(config.telegramBotToken, g.telegramChatId, msg.path("message_id").asLong());
        } catch (Telegram.ErroTelegram e) {
            Log.warnf("Aviso de entrada (%s): %s", g.nome, e.getMessage());
        }
        return true;
    }

    static String nome(JsonNode usuario) {
        String n = (usuario.path("first_name").asText("") + " " + usuario.path("last_name").asText("")).trim();
        if (usuario.hasNonNull("username")) n += " (@" + usuario.path("username").asText() + ")";
        return n.isEmpty() ? "Sem nome" : n;
    }

}
