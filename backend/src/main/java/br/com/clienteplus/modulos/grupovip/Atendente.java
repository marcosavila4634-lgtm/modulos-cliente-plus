package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.clienteplus.Plano;
import br.com.clienteplus.modulos.clienteplus.ProgramaIndicacao;
import br.com.clienteplus.modulos.grupovip.Telegram.Tecla;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

// Conversa com o robô no privado: um menu com botões, e cada escolha abre o
// passo seguinte.
//
//   Menu (membro)       📚 Baixar um livro › pelo nome | pelo autor | por
//                       categoria | por gênero | novidades | mais pedidos
//                       💡 Sugerir um livro   🎲 Livro surpresa   🕘 Meus pedidos
//                       👥 Meus grupos   💳 Minha assinatura   🎁 Indique e ganhe
//                       💬 Falar com a equipe   ℹ️ Conhecer mais
//   Menu (visitante)    ℹ️ Conhecer   💳 Ver planos e assinar   ✅ Já sou membro
//
// Tocar num botão troca a própria mensagem (sem encher a conversa). Quando o
// robô pede para a pessoa escrever (ex.: o nome do livro), guarda o passo em
// grupo_vip_robo_conversas por alguns minutos. Mensagem sem passo e que não é
// um "oi" vai para o Suporte, como antes.
//
// Botões: callback_data "m:<ação>" (menu) e "livro:<id>" (entregar o livro).
// No projeto principal: mesma lógica dentro da Edge Function do robô.
@ApplicationScoped
public class Atendente {

    @Inject
    Telegram telegram;

    @Inject
    Membros membros;

    @Inject
    Biblioteca biblioteca;

    @Inject
    EnderecoPublico endereco;

    @Inject
    Suporte suporte;

    @Inject
    ControleAcesso controle;

    @Inject
    Indicacoes indicacoes;

    @Inject
    Sugestoes sugestoes;

    static final int POR_PAGINA = 8;
    static final int MINUTOS_PASSO = 15;
    static final String BUSCA_NOME = "busca_nome";
    static final String BUSCA_AUTOR = "busca_autor";
    static final String SUGESTAO = "sugestao";
    static final String SUPORTE = "suporte";

    private static final Set<String> SAUDACOES = Set.of("oi", "oii", "oie", "ola", "opa", "eai", "e ai", "salve", "hello", "hi",
            "bom dia", "boa tarde", "boa noite", "menu", "inicio", "ajuda", "opcoes", "comecar", "start", "voltar");
    private static final Random SORTE = new Random();

    record Tela(String texto, List<List<Tecla>> linhas) {}

    // ---------- Mensagem escrita no privado ----------

    void mensagem(Config config, JsonNode msg) {
        long usuario = msg.path("chat").path("id").asLong();
        String texto = msg.path("text").asText("").trim();
        String comando = texto.split("\\s+", 2)[0].replaceAll("@.*$", "").toLowerCase();
        String resto = texto.contains(" ") ? texto.substring(texto.indexOf(' ') + 1).trim() : "";
        Membro m = membro(config, usuario);
        Conversa conversa = conversa(config.storeId, usuario);

        if (comando.equals("/start") || comando.equals("/menu") || comando.equals("/ajuda")) {
            conversa.etapa = null;
            enviar(config, usuario, menu(config, m));
            return;
        }
        if (m == null) { // visitante: só o menu de quem ainda não é membro
            enviar(config, usuario, menu(config, null));
            return;
        }
        if (comando.equals("/grupos") || comando.equals("/links")) {
            enviar(config, usuario, grupos(config, m));
            return;
        }
        if (comando.equals("/livro") || comando.equals("/livros") || comando.equals("/material") || comando.equals("/materiais")
                || comando.equals("/buscar")) {
            if (resto.isEmpty()) enviar(config, usuario, livros(config, m));
            else buscarNome(config, m, conversa, usuario, resto);
            return;
        }
        if (comando.equals("/sugerir")) {
            if (resto.isEmpty()) {
                conversa.etapa = SUGESTAO;
                enviar(config, usuario, pedirSugestao(config));
            } else {
                enviar(config, usuario, sugerir(config, m, resto));
            }
            return;
        }
        if (texto.isEmpty() || texto.startsWith("/")) {
            enviar(config, usuario, new Tela(texto.isEmpty()
                    ? "Por enquanto eu só entendo texto 🙂 Escolha uma opção:"
                    : "Não conheço esse comando. Escolha uma opção:", menu(config, m).linhas()));
            return;
        }

        String etapa = passoAtivo(conversa);
        if (BUSCA_NOME.equals(etapa)) {
            buscarNome(config, m, conversa, usuario, texto);
        } else if (BUSCA_AUTOR.equals(etapa)) {
            buscarAutor(config, m, conversa, usuario, texto);
        } else if (SUGESTAO.equals(etapa)) {
            conversa.etapa = null;
            enviar(config, usuario, sugerir(config, m, texto));
        } else if (SUPORTE.equals(etapa)) {
            conversa.atualizadoEm = OffsetDateTime.now(); // continua na conversa com a equipe
            if (suporte.doTelegram(m.cliente, texto)) {
                telegram.enviarTexto(config.telegramBotToken, usuario, "Recebemos sua mensagem ✅ A equipe responde por aqui mesmo.");
            }
        } else if (SAUDACOES.contains(GestaoTelegram.normal(texto).replaceAll("[^\\p{L} ]", "").trim())) {
            enviar(config, usuario, menu(config, m));
        } else {
            // Sem passo: vai para o Suporte (como sempre foi)
            if (suporte.doTelegram(m.cliente, texto)) {
                enviar(config, usuario, new Tela(t(config, "Recebemos sua mensagem ✅ A equipe responde por aqui mesmo.\n\n"
                        + "Para pedir livros e ver outras opções, toque em Menu."),
                        List.of(List.of(Tecla.acao("📋 Menu", "m:menu")))));
            }
        }
    }

    // ---------- Botão tocado ----------

    void toque(Config config, JsonNode toque) {
        String dados = toque.path("data").asText("");
        long usuario = toque.path("from").path("id").asLong();
        Long mensagem = toque.path("message").hasNonNull("message_id") ? toque.path("message").path("message_id").asLong() : null;
        String token = config.telegramBotToken;
        Membro m = membro(config, usuario);

        if (dados.startsWith("livro:")) {
            telegram.responderToque(token, toque.path("id").asText(), m != null ? "Enviando..." : null);
            if (m == null) {
                enviar(config, usuario, menu(config, null));
                return;
            }
            try {
                pedirLivro(config, m, usuario, UUID.fromString(dados.substring("livro:".length())));
            } catch (IllegalArgumentException e) {
                // botão antigo ou inválido
            }
            return;
        }
        telegram.responderToque(token, toque.path("id").asText(), null);
        if (!dados.startsWith("m:")) return;
        Conversa conversa = conversa(config.storeId, usuario);
        Tela tela = tela(config, m, conversa, dados.substring(2));
        if (tela != null) mostrar(config, usuario, mensagem, tela);
    }

    // Cada ação do menu.
    private Tela tela(Config config, Membro m, Conversa conversa, String acao) {
        String[] a = acao.split(":", 2);
        String arg = a.length > 1 ? a[1] : null;
        if (!"sug".equals(a[0])) conversa.etapa = null;
        if (m == null) {
            return switch (a[0]) {
                case "conhecer" -> conhecer(config, null);
                case "membro" -> jaSouMembro(config);
                default -> menu(config, null);
            };
        }
        switch (a[0]) {
            case "grupos":
                return grupos(config, m);
            case "assinatura":
                return assinatura(config, m);
            case "indique":
                return indique(config, m);
            case "conhecer":
                return conhecer(config, m);
            case "suporte":
                conversa.etapa = SUPORTE;
                conversa.atualizadoEm = OffsetDateTime.now();
                return falarComEquipe(config);
            case "menu":
                return menu(config, m);
            default:
                break;
        }
        // Daqui para baixo: livros ou materiais (só quem tem acesso)
        List<UUID> grupos = gruposDoMembro(config, m);
        if (grupos == null) return semAcesso(config, m);
        switch (a[0]) {
            case "livros":
                return livros(config, m);
            case "nome":
                conversa.etapa = BUSCA_NOME;
                conversa.atualizadoEm = OffsetDateTime.now();
                return new Tela(t(config, "🔤 Escreva o <b>nome do livro</b> (ou só uma parte dele):"),
                        List.of(List.of(Tecla.acao("⬅️ Voltar", "m:livros"))));
            case "autor":
                conversa.etapa = BUSCA_AUTOR;
                conversa.atualizadoEm = OffsetDateTime.now();
                return new Tela("✍️ Escreva o <b>nome do autor</b> (ou só o sobrenome):",
                        List.of(List.of(Tecla.acao("⬅️ Voltar", "m:livros"))));
            case "cats":
                return opcoes(config, grupos, "cat", arg);
            case "gens":
                return opcoes(config, grupos, "gen", arg);
            case "cat", "gen", "aut": {
                String nome = pelaChave(acervo(grupos), a[0], arg);
                if (nome == null) return livros(config, m);
                return lista(config, m, conversa, grupos, a[0] + "|" + nome, 0);
            }
            case "novos", "top", "meus":
                return lista(config, m, conversa, grupos, a[0], 0);
            case "pg":
                if (conversa.lista == null) return livros(config, m);
                return lista(config, m, conversa, grupos, conversa.lista, arg != null ? Integer.parseInt(arg) : 0);
            case "surpresa":
                return surpresa(config, m, grupos);
            case "sugerir":
                conversa.etapa = SUGESTAO;
                conversa.atualizadoEm = OffsetDateTime.now();
                return pedirSugestao(config);
            case "sug": {
                // "Pedir este livro" depois de uma busca sem resultado
                String l = conversa.lista;
                if (l == null || !(l.startsWith("nome|") || l.startsWith("busca_autor|"))) {
                    conversa.etapa = SUGESTAO;
                    return pedirSugestao(config);
                }
                String termo = l.substring(l.indexOf('|') + 1);
                conversa.etapa = null;
                return sugerir(config, m, l.startsWith("nome|") ? termo : "- " + termo);
            }
            default:
                return menu(config, m);
        }
    }

    // ---------- Telas ----------

    Tela menu(Config config, Membro m) {
        String negocio = Telegram.html(config.nomeNegocio);
        List<List<Tecla>> linhas = new ArrayList<>();
        if (m == null) {
            linhas.add(List.of(Tecla.acao("ℹ️ Conhecer o " + config.nomeNegocio, "m:conhecer")));
            linhas.add(List.of(Tecla.link("💳 Ver planos e assinar", endereco.paginaVendas(config.slug, null))));
            linhas.add(List.of(Tecla.acao("✅ Já sou membro", "m:membro")));
            if (config.whatsappSuporte != null) {
                linhas.add(List.of(Tecla.link("💬 Falar com a equipe", "https://wa.me/55" + config.whatsappSuporte)));
            }
            return new Tela("Olá! 👋 Eu sou o assistente do <b>" + negocio + "</b>.\nO que você quer fazer?", linhas);
        }
        Membros.Estado e = membros.base(config.storeId).estado(m.cliente.id);
        StringBuilder texto = new StringBuilder("Olá, <b>").append(Telegram.html(Membros.primeiroNome(m.cliente.nome)))
                .append("</b>! 👋 O que você quer fazer?");
        boolean comLivros = e.temAcesso() && !e.gruposComDireito().isEmpty()
                && Livro.count("grupo.id in ?1", new ArrayList<>(e.gruposComDireito())) > 0;
        if (!e.temAcesso()) {
            texto.append("\n\n⚠️ Seu acesso aos grupos não está liberado agora. Veja em <b>Minha assinatura</b>.");
        }
        if (comLivros) {
            linhas.add(List.of(Tecla.acao(t(config, "📚 Baixar um livro"), "m:livros"), Tecla.acao(t(config, "💡 Sugerir um livro"), "m:sugerir")));
            linhas.add(List.of(Tecla.acao("🆕 Novidades", "m:novos"), Tecla.acao("🔥 Mais pedidos", "m:top")));
            linhas.add(List.of(Tecla.acao(t(config, "🎲 Livro surpresa"), "m:surpresa"), Tecla.acao("🕘 Meus pedidos", "m:meus")));
        }
        linhas.add(List.of(Tecla.acao("👥 Meus grupos", "m:grupos"), Tecla.acao("💳 Minha assinatura", "m:assinatura")));
        linhas.add(List.of(Tecla.acao("🎁 Indique e ganhe", "m:indique"), Tecla.acao("💬 Falar com a equipe", "m:suporte")));
        linhas.add(List.of(Tecla.acao("ℹ️ Conhecer mais", "m:conhecer")));
        return new Tela(texto.toString(), linhas);
    }

    private Tela livros(Config config, Membro m) {
        List<UUID> grupos = gruposDoMembro(config, m);
        if (grupos == null) return semAcesso(config, m);
        List<Livro> acervo = acervo(grupos);
        if (acervo.isEmpty()) {
            return new Tela(t(config, "Ainda não há livros disponíveis para você."), List.of(List.of(Tecla.acao("🏠 Menu", "m:menu"))));
        }
        List<List<Tecla>> linhas = new ArrayList<>();
        // materiais quase nunca têm autor: o botão só aparece se algum tiver
        boolean autores = !config.materiais() || acervo.stream().anyMatch(l -> l.autor != null);
        linhas.add(autores ? List.of(Tecla.acao("🔤 Pelo nome", "m:nome"), Tecla.acao("✍️ Pelo autor", "m:autor"))
                : List.of(Tecla.acao("🔤 Pelo nome", "m:nome")));
        boolean categorias = acervo.stream().anyMatch(l -> l.categoria != null);
        boolean generos = acervo.stream().anyMatch(l -> l.genero != null);
        List<Tecla> filtros = new ArrayList<>();
        if (categorias) filtros.add(Tecla.acao("🗂 Por categoria", "m:cats"));
        if (generos) filtros.add(Tecla.acao("🎭 Por gênero", "m:gens"));
        if (!filtros.isEmpty()) linhas.add(filtros);
        linhas.add(List.of(Tecla.acao("🆕 Novidades", "m:novos"), Tecla.acao("🔥 Mais pedidos", "m:top")));
        linhas.add(List.of(Tecla.acao("🏠 Menu", "m:menu")));
        return new Tela(t(config, "📚 <b>Biblioteca</b>\nTemos <b>" + acervo.size() + "</b> livros para você. Como você quer procurar?"), linhas);
    }

    private Tela semAcesso(Config config, Membro m) {
        return new Tela(t(config, "Seu acesso não está liberado agora, por isso os livros estão bloqueados. Veja sua situação e pague por aqui:"),
                List.of(List.of(Tecla.link("💳 Minha área", endereco.areaMembro(m.codigo))),
                        List.of(Tecla.acao("🏠 Menu", "m:menu"))));
    }

    // Lista de categorias ou gêneros (10 por página), com a quantidade de livros.
    private Tela opcoes(Config config, List<UUID> grupos, String tipo, String pagina) {
        Function<Livro, String> campo = "cat".equals(tipo) ? l -> l.categoria : l -> l.genero;
        Map<String, Long> contagem = acervo(grupos).stream()
                .filter(l -> campo.apply(l) != null)
                .collect(Collectors.groupingBy(campo, Collectors.counting()));
        List<String> nomes = contagem.keySet().stream().sorted(Comparator.comparing(GestaoTelegram::normal)).toList();
        int p = pagina != null ? Integer.parseInt(pagina) : 0;
        int total = Math.max(1, (int) Math.ceil(nomes.size() / 10.0));
        List<List<Tecla>> linhas = new ArrayList<>();
        for (String n : nomes.stream().skip(p * 10L).limit(10).toList()) {
            linhas.add(List.of(Tecla.acao(corta(n, 40) + " (" + contagem.get(n) + ")", "m:" + tipo + ":" + chave(n))));
        }
        List<Tecla> nav = new ArrayList<>();
        String volta = "cat".equals(tipo) ? "cats" : "gens";
        if (p > 0) nav.add(Tecla.acao("⬅️ Anterior", "m:" + volta + ":" + (p - 1)));
        if (p + 1 < total) nav.add(Tecla.acao("Próxima ➡️", "m:" + volta + ":" + (p + 1)));
        if (!nav.isEmpty()) linhas.add(nav);
        linhas.add(List.of(Tecla.acao("⬅️ Voltar", "m:livros"), Tecla.acao("🏠 Menu", "m:menu")));
        String titulo = "cat".equals(tipo) ? "🗂 <b>Categorias</b>" : "🎭 <b>Gêneros</b>";
        return new Tela(titulo + (total > 1 ? " · página " + (p + 1) + " de " + total : "") + "\nEscolha uma:", linhas);
    }

    // Uma lista de livros com páginas. lista: "nome|termo", "busca_autor|termo",
    // "aut|autor", "cat|categoria", "gen|gênero", "novos", "top" ou "meus".
    private Tela lista(Config config, Membro m, Conversa conversa, List<UUID> grupos, String lista, int pagina) {
        conversa.lista = lista;
        List<Livro> livros = livrosDa(m, grupos, lista);
        String tipo = lista.contains("|") ? lista.substring(0, lista.indexOf('|')) : lista;
        String valor = lista.contains("|") ? Telegram.html(lista.substring(lista.indexOf('|') + 1)) : "";
        String titulo = switch (tipo) {
            case "nome" -> t(config, "🔤 Livros com") + " \"" + valor + "\"";
            case "busca_autor" -> t(config, "✍️ Livros de") + " \"" + valor + "\"";
            case "aut" -> t(config, "✍️ Livros de") + " <b>" + valor + "</b>";
            case "cat" -> "🗂 <b>" + valor + "</b>";
            case "gen" -> "🎭 <b>" + valor + "</b>";
            case "novos" -> "🆕 <b>Novidades</b> (os que chegaram por último)";
            case "top" -> "🔥 <b>Mais pedidos</b>";
            default -> "🕘 <b>Seus últimos pedidos</b>";
        };
        if (livros.isEmpty()) {
            String vazio = t(config, switch (tipo) {
                case "top" -> "Ninguém pediu livros ainda. Seja o primeiro! 🙂";
                case "meus" -> "Você ainda não pediu nenhum livro.";
                default -> "Não encontrei nenhum livro aqui.";
            });
            return new Tela(titulo + "\n\n" + vazio, List.of(List.of(Tecla.acao("⬅️ Voltar", "m:livros"), Tecla.acao("🏠 Menu", "m:menu"))));
        }
        int total = (int) Math.ceil(livros.size() / (double) POR_PAGINA);
        int p = Math.max(0, Math.min(pagina, total - 1));
        List<List<Tecla>> linhas = new ArrayList<>();
        for (Livro l : livros.stream().skip((long) p * POR_PAGINA).limit(POR_PAGINA).toList()) {
            String autor = l.autor != null && !"aut".equals(tipo) ? " — " + l.autor : "";
            linhas.add(List.of(Tecla.acao(Vocabulario.de(config).icone() + " " + corta(l.titulo + autor, 58), "livro:" + l.id)));
        }
        List<Tecla> nav = new ArrayList<>();
        if (p > 0) nav.add(Tecla.acao("⬅️ Anterior", "m:pg:" + (p - 1)));
        if (p + 1 < total) nav.add(Tecla.acao("Próxima ➡️", "m:pg:" + (p + 1)));
        if (!nav.isEmpty()) linhas.add(nav);
        linhas.add(List.of(Tecla.acao("🔎 Procurar outro", "m:livros"), Tecla.acao("🏠 Menu", "m:menu")));
        return new Tela(titulo + "\n" + livros.size() + t(config, " livro(s)") + (total > 1 ? " · página " + (p + 1) + " de " + total : "")
                + t(config, "\n\nToque no livro que você quer:"), linhas);
    }

    private List<Livro> livrosDa(Membro m, List<UUID> grupos, String lista) {
        List<Livro> acervo = acervo(grupos);
        String tipo = lista.contains("|") ? lista.substring(0, lista.indexOf('|')) : lista;
        String valor = lista.contains("|") ? lista.substring(lista.indexOf('|') + 1) : "";
        Comparator<Livro> porTitulo = Comparator.comparing(l -> GestaoTelegram.normal(l.titulo));
        return switch (tipo) {
            case "nome" -> {
                List<String> termos = Biblioteca.termos(valor);
                yield acervo.stream().filter(l -> Biblioteca.combina(l, termos))
                        .sorted(Comparator.comparingInt((Livro l) -> l.titulo.length()).thenComparing(porTitulo))
                        .toList();
            }
            case "busca_autor" -> {
                List<String> termos = Biblioteca.termos(valor);
                yield acervo.stream().filter(l -> contemTodos((l.autor != null ? l.autor : "") + " " + l.arquivoNome, termos))
                        .sorted(porTitulo).toList();
            }
            case "aut" -> acervo.stream().filter(l -> valor.equalsIgnoreCase(l.autor)).sorted(porTitulo).toList();
            case "cat" -> acervo.stream().filter(l -> valor.equalsIgnoreCase(l.categoria)).sorted(porTitulo).toList();
            case "gen" -> acervo.stream().filter(l -> valor.equalsIgnoreCase(l.genero)).sorted(porTitulo).toList();
            case "novos" -> acervo.stream()
                    .sorted(Comparator.comparing((Livro l) -> l.createdAt, Comparator.nullsLast(Comparator.reverseOrder())))
                    .limit(40).toList();
            case "top" -> acervo.stream().filter(l -> l.pedidos > 0)
                    .sorted(Comparator.comparingInt((Livro l) -> -l.pedidos)).limit(40).toList();
            case "meus" -> {
                Set<String> permitidos = acervo.stream().map(Atendente::identidade).collect(Collectors.toSet());
                Map<String, Livro> vistos = new LinkedHashMap<>();
                for (LivroPedido p : LivroPedido.<LivroPedido>list("cliente = ?1 order by momento desc", m.cliente)) {
                    String id = identidade(p.livro);
                    if (permitidos.contains(id)) vistos.putIfAbsent(id, p.livro);
                    if (vistos.size() >= 40) break;
                }
                yield new ArrayList<>(vistos.values());
            }
            default -> List.of();
        };
    }

    // O membro escreveu o nome de um livro.
    private void buscarNome(Config config, Membro m, Conversa conversa, long chat, String termo) {
        List<UUID> grupos = gruposDoMembro(config, m);
        if (grupos == null) {
            enviar(config, chat, semAcesso(config, m));
            return;
        }
        conversa.etapa = BUSCA_NOME; // pode escrever outro nome em seguida
        conversa.atualizadoEm = OffsetDateTime.now();
        String lista = "nome|" + corta(termo.trim(), 60);
        List<Livro> achados = livrosDa(m, grupos, lista);
        conversa.lista = lista;
        if (achados.isEmpty()) {
            enviar(config, chat, naoEncontrei(config, termo));
        } else if (achados.size() == 1) {
            entregar(config, m, chat, achados.get(0));
        } else {
            enviar(config, chat, lista(config, m, conversa, grupos, lista, 0));
        }
    }

    // O membro escreveu o nome de um autor.
    private void buscarAutor(Config config, Membro m, Conversa conversa, long chat, String termo) {
        List<UUID> grupos = gruposDoMembro(config, m);
        if (grupos == null) {
            enviar(config, chat, semAcesso(config, m));
            return;
        }
        conversa.etapa = BUSCA_AUTOR;
        conversa.atualizadoEm = OffsetDateTime.now();
        List<String> termos = Biblioteca.termos(termo);
        List<Livro> acervo = acervo(grupos);
        Map<String, Long> autores = acervo.stream()
                .filter(l -> l.autor != null && contemTodos(l.autor, termos))
                .collect(Collectors.groupingBy(l -> l.autor, Collectors.counting()));
        if (autores.size() == 1) {
            enviar(config, chat, lista(config, m, conversa, grupos, "aut|" + autores.keySet().iterator().next(), 0));
            return;
        }
        if (autores.size() > 1) {
            List<List<Tecla>> linhas = new ArrayList<>();
            autores.keySet().stream().sorted(Comparator.comparing(GestaoTelegram::normal)).limit(10)
                    .forEach(a -> linhas.add(List.of(Tecla.acao("✍️ " + corta(a, 45) + " (" + autores.get(a) + ")", "m:aut:" + chave(a)))));
            linhas.add(List.of(Tecla.acao("⬅️ Voltar", "m:livros"), Tecla.acao("🏠 Menu", "m:menu")));
            enviar(config, chat, new Tela("Encontrei <b>" + autores.size() + "</b> autores. Qual deles?"
                    + (autores.size() > 10 ? "\n(mostrando 10; escreva o nome mais completo para achar mais rápido)" : ""), linhas));
            return;
        }
        // Livros sem autor cadastrado: procura no nome do arquivo
        String lista = "busca_autor|" + corta(termo.trim(), 60);
        conversa.lista = lista;
        if (livrosDa(m, grupos, lista).isEmpty()) enviar(config, chat, naoEncontrei(config, termo));
        else enviar(config, chat, lista(config, m, conversa, grupos, lista, 0));
    }

    private static Tela naoEncontrei(Config config, String termo) {
        return new Tela(t(config, "Não encontrei nenhum livro com") + " \"" + Telegram.html(corta(termo.trim(), 60)) + "\" 😕\n\n"
                + (config.materiais()
                        ? "Tente só uma parte do nome (uma palavra do título), ou peça para a gente adicionar:"
                        : "Tente só uma parte do nome (uma palavra do título ou o sobrenome do autor), ou peça para a gente adicionar:"),
                List.of(List.of(Tecla.acao(t(config, "💡 Pedir este livro"), "m:sug")),
                        List.of(Tecla.acao("🔤 Buscar outro nome", "m:nome"), Tecla.acao("✍️ Pelo autor", "m:autor")),
                        List.of(Tecla.acao("🏠 Menu", "m:menu"))));
    }

    // Tocou num livro da lista.
    private void pedirLivro(Config config, Membro m, long chat, UUID livroId) {
        Livro l = Livro.findById(livroId);
        if (l == null || !l.storeId.equals(config.storeId)) {
            telegram.enviarTexto(config.telegramBotToken, chat, t(config, "Este livro não está mais disponível."));
            return;
        }
        List<UUID> grupos = gruposDoMembro(config, m);
        if (grupos == null) {
            enviar(config, chat, semAcesso(config, m));
            return;
        }
        // o mesmo arquivo pode estar na biblioteca de outro grupo do plano
        Livro permitido = Biblioteca.doMembro(l, grupos);
        if (permitido == null) {
            telegram.enviarTexto(config.telegramBotToken, chat,
                    t(config, "Este livro é do grupo ") + Telegram.html(l.grupo.nome) + ", que não está no seu plano.");
            return;
        }
        entregar(config, m, chat, permitido);
    }

    private void entregar(Config config, Membro m, long chat, Livro l) {
        biblioteca.entregar(config, m, chat, l);
    }

    private Tela surpresa(Config config, Membro m, List<UUID> grupos) {
        List<Livro> acervo = acervo(grupos);
        Set<String> jaPediu = new HashSet<>();
        Set<String> gosta = new HashSet<>(); // categorias e gêneros que a pessoa já pediu
        for (LivroPedido p : LivroPedido.<LivroPedido>list("cliente", m.cliente)) {
            jaPediu.add(identidade(p.livro));
            if (p.livro.categoria != null) gosta.add(p.livro.categoria);
            if (p.livro.genero != null) gosta.add(p.livro.genero);
        }
        List<Livro> novos = acervo.stream().filter(l -> !jaPediu.contains(identidade(l))).toList();
        List<Livro> preferidos = novos.stream().filter(l -> gosta.contains(l.categoria) || gosta.contains(l.genero)).toList();
        List<Livro> sorteio = !preferidos.isEmpty() ? preferidos : !novos.isEmpty() ? novos : acervo;
        if (sorteio.isEmpty()) return livros(config, m);
        Livro l = sorteio.get(SORTE.nextInt(sorteio.size()));
        StringBuilder texto = new StringBuilder("🎲 <b>Que tal este?</b>\n\n").append(Biblioteca.legenda(l));
        if (l.sinopse != null) texto.append("\n\n").append(Telegram.html(corta(l.sinopse, 350)));
        return new Tela(texto.toString(), List.of(
                List.of(Tecla.acao("📥 Quero este!", "livro:" + l.id)),
                List.of(Tecla.acao("🎲 Outro", "m:surpresa"), Tecla.acao("🏠 Menu", "m:menu"))));
    }

    private static Tela pedirSugestao(Config config) {
        String texto = config.materiais()
                ? "💡 Qual material você quer que a gente adicione?\n\nEscreva o <b>nome</b> ou o assunto. Ex.:\n"
                        + "<code>Apostila de Excel avançado</code>"
                : "💡 Qual livro você quer que a gente adicione?\n\nEscreva o <b>título</b> e, se souber, o autor. Ex.:\n"
                        + "<code>Dom Casmurro - Machado de Assis</code>";
        return new Tela(texto, List.of(List.of(Tecla.acao("🏠 Menu", "m:menu"))));
    }

    private Tela sugerir(Config config, Membro m, String texto) {
        String resposta = sugestoes.criar(config, m, texto);
        return new Tela(resposta, List.of(List.of(Tecla.acao(t(config, "📚 Livros"), "m:livros"), Tecla.acao("🏠 Menu", "m:menu"))));
    }

    private Tela grupos(Config config, Membro m) {
        return new Tela(textoGrupos(config, m), List.of(List.of(Tecla.acao("🏠 Menu", "m:menu"))));
    }

    // Links de entrada dos grupos que o membro pagou (também no /start).
    String textoGrupos(Config config, Membro m) {
        Membros.Base base = membros.base(config.storeId);
        Membros.Estado e = base.estado(m.cliente.id);
        if (!e.temAcesso()) {
            return "Seu acesso ainda não está liberado. Veja sua situação e pague por aqui:\n" + endereco.areaMembro(m.codigo);
        }
        StringBuilder r = new StringBuilder("👥 <b>Seus grupos:</b>");
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
        return r.toString();
    }

    private Tela assinatura(Config config, Membro m) {
        Membros.Estado e = membros.base(config.storeId).estado(m.cliente.id);
        StringBuilder t = new StringBuilder("💳 <b>Minha assinatura</b>\n");
        Plano plano = e.plano();
        if (plano != null) {
            t.append("\nPlano: <b>").append(Telegram.html(plano.nome)).append("</b> (")
                    .append(Mensageiro.moeda(e.assinatura().valor)).append(" ").append(periodo(plano.duracaoMeses)).append(")");
        }
        t.append("\nSituação: ").append(switch (e.situacao()) {
            case "em_dia" -> "✅ Em dia";
            case "vencendo" -> "⏰ Vence em breve";
            case "atrasado" -> "⚠️ Atrasado há " + e.diasAtraso() + " dia(s). Você sai dos grupos depois de "
                    + config.toleranciaDias + " dias de atraso.";
            case "bloqueado" -> "⛔ Acesso bloqueado";
            case "aguardando_pagamento" -> "⏳ Esperando o 1º pagamento";
            case "cancelando" -> "Cancelada (acesso até " + Mensageiro.data(e.pagoAte()) + ")";
            default -> "Sem plano";
        });
        if (e.proxima() != null) {
            t.append("\nPróximo pagamento: <b>").append(Mensageiro.moeda(e.proxima().valor)).append("</b> em ")
                    .append(Mensageiro.data(e.proxima().vencimento));
        }
        if (e.pagoAte() != null && plano != null) t.append("\nPago até: ").append(Mensageiro.data(e.pagoAte()));
        List<List<Tecla>> linhas = new ArrayList<>();
        if (plano == null) linhas.add(List.of(Tecla.link("🛒 Ver planos", endereco.paginaVendas(config.slug, null))));
        else linhas.add(List.of(Tecla.link(e.proxima() != null ? "💳 Pagar / ver minha área" : "📲 Minha área",
                endereco.areaMembro(m.codigo))));
        linhas.add(List.of(Tecla.acao("🏠 Menu", "m:menu")));
        return new Tela(t.toString(), linhas);
    }

    private Tela indique(Config config, Membro m) {
        ProgramaIndicacao prog = ProgramaIndicacao.<ProgramaIndicacao>find("storeId", config.storeId).firstResult();
        BigDecimal[] pct = prog == null
                ? new BigDecimal[] {BigDecimal.TEN, BigDecimal.valueOf(5), BigDecimal.valueOf(2)}
                : new BigDecimal[] {prog.nivel1Pct, prog.nivel2Pct, prog.nivel3Pct};
        Indicacoes.Saldo saldo = indicacoes.saldo(config.storeId, m.cliente.id);
        String link = endereco.paginaVendas(config.slug, m.codigo);
        String texto = "🎁 <b>Indique e ganhe</b>\n\nMande o seu link para os amigos. Você ganha comissão <b>todo mês</b>, enquanto eles"
                + " continuarem pagando:\n\n" + link + "\n\n"
                + "• " + pct[0].stripTrailingZeros().toPlainString() + "% de quem você indicar\n"
                + "• " + pct[1].stripTrailingZeros().toPlainString() + "% de quem eles indicarem\n"
                + "• " + pct[2].stripTrailingZeros().toPlainString() + "% do nível seguinte\n\n"
                + "Saldo para saque: <b>" + Mensageiro.moeda(saldo.disponivel()) + "</b>";
        return new Tela(texto, List.of(List.of(Tecla.link("📲 Ver na minha área (sacar)", endereco.areaMembro(m.codigo))),
                List.of(Tecla.acao("🏠 Menu", "m:menu"))));
    }

    private Tela conhecer(Config config, Membro m) {
        StringBuilder t = new StringBuilder("ℹ️ <b>").append(Telegram.html(config.nomeNegocio)).append("</b>");
        if (config.descricaoPagina != null && !config.descricaoPagina.isBlank()) {
            t.append("\n\n").append(Telegram.html(corta(config.descricaoPagina.trim(), 700)));
        }
        List<String> beneficios = config.beneficios == null ? List.of()
                : config.beneficios.lines().map(String::trim).filter(s -> !s.isEmpty()).limit(8).toList();
        if (!beneficios.isEmpty()) {
            t.append("\n");
            beneficios.forEach(b -> t.append("\n✨ ").append(Telegram.html(b)));
        }
        Membros.Base base = membros.base(config.storeId);
        List<Plano> planos = Plano.<Plano>list("storeId = ?1 and ativo = true order by preco", config.storeId).stream()
                .filter(p -> !base.gruposDoPlano(p).isEmpty())
                .toList();
        if (!planos.isEmpty()) {
            t.append("\n\n<b>Planos</b>");
            for (Plano p : planos) {
                t.append("\n• <b>").append(Telegram.html(p.nome)).append("</b>: ").append(Mensageiro.moeda(p.preco)).append(" ")
                        .append(periodo(p.duracaoMeses)).append(" (")
                        .append(Telegram.html(String.join(", ", base.gruposDoPlano(p).stream().map(g -> g.nome).toList()))).append(")");
            }
        }
        List<List<Tecla>> linhas = new ArrayList<>();
        linhas.add(List.of(Tecla.link(m == null ? "🛒 Quero assinar" : "🛒 Ver a página", endereco.paginaVendas(config.slug, null))));
        linhas.add(List.of(Tecla.acao("🏠 Menu", "m:menu")));
        return new Tela(t.toString(), linhas);
    }

    private Tela jaSouMembro(Config config) {
        List<List<Tecla>> linhas = new ArrayList<>();
        if (config.whatsappSuporte != null) {
            linhas.add(List.of(Tecla.link("💬 Pedir ajuda no WhatsApp", "https://wa.me/55" + config.whatsappSuporte)));
        }
        linhas.add(List.of(Tecla.acao("🏠 Menu", "m:menu")));
        return new Tela("✅ Para eu te reconhecer, abra a sua <b>área de membro</b> (o link chegou quando você assinou) e toque em"
                + " <b>Conectar Telegram</b>. Pronto: eu te mando os links dos grupos e libero a biblioteca.", linhas);
    }

    private Tela falarComEquipe(Config config) {
        List<List<Tecla>> linhas = new ArrayList<>();
        if (config.whatsappSuporte != null) {
            linhas.add(List.of(Tecla.link("📱 Prefiro o WhatsApp", "https://wa.me/55" + config.whatsappSuporte)));
        }
        linhas.add(List.of(Tecla.acao("🏠 Menu", "m:menu")));
        return new Tela("💬 <b>Falar com a equipe</b>\n\nEscreva sua mensagem aqui embaixo. A equipe responde por aqui mesmo.", linhas);
    }

    // ---------- Apoio ----------

    private Membro membro(Config config, long usuario) {
        return Membro.<Membro>find("storeId = ?1 and telegramId = ?2", config.storeId, usuario).firstResult();
    }

    // Grupos que o membro pode usar agora. null = sem acesso.
    private List<UUID> gruposDoMembro(Config config, Membro m) {
        Membros.Estado e = membros.base(config.storeId).estado(m.cliente.id);
        return e.temAcesso() ? new ArrayList<>(e.gruposComDireito()) : null;
    }

    // Livros dos grupos, sem repetir o mesmo arquivo (cópias entre grupos).
    static List<Livro> acervo(List<UUID> grupos) {
        if (grupos.isEmpty()) return List.of();
        Map<String, Livro> unicos = new LinkedHashMap<>();
        for (Livro l : Livro.<Livro>list("grupo.id in ?1", grupos)) unicos.putIfAbsent(identidade(l), l);
        return new ArrayList<>(unicos.values());
    }

    private static String identidade(Livro l) {
        return l.md5 != null ? l.md5 : l.id.toString();
    }

    // Nome da categoria/gênero/autor pela chave curta do botão.
    private static String pelaChave(List<Livro> acervo, String tipo, String chave) {
        Set<String> nomes = new LinkedHashSet<>();
        for (Livro l : acervo) {
            String n = switch (tipo) {
                case "cat" -> l.categoria;
                case "gen" -> l.genero;
                default -> l.autor;
            };
            if (n != null) nomes.add(n);
        }
        return nomes.stream().filter(n -> chave(n).equals(chave)).findFirst().orElse(null);
    }

    // Chave curta (cabe no botão, que aceita só 64 letras).
    static String chave(String nome) {
        try {
            byte[] h = MessageDigest.getInstance("MD5").digest(GestaoTelegram.normal(nome).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(h).substring(0, 10);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static boolean contemTodos(String texto, List<String> termos) {
        String t = GestaoTelegram.normal(texto);
        return !termos.isEmpty() && termos.stream().allMatch(t::contains);
    }

    // Texto fixo com "livro" -> "material" quando a biblioteca é de materiais.
    private static String t(Config config, String texto) {
        return Vocabulario.de(config).t(texto);
    }

    static String corta(String s, int max) {
        return s.length() > max ? s.substring(0, max - 1) + "…" : s;
    }

    static String periodo(int meses) {
        return switch (meses) {
            case 1 -> "por mês";
            case 3 -> "por trimestre";
            case 6 -> "por semestre";
            case 12 -> "por ano";
            default -> "a cada " + meses + " meses";
        };
    }

    private Conversa conversa(java.util.UUID storeId, long usuario) {
        Conversa c = Conversa.<Conversa>find("storeId = ?1 and telegramId = ?2", storeId, usuario).firstResult();
        if (c == null) {
            c = new Conversa();
            c.storeId = storeId;
            c.telegramId = usuario;
            c.atualizadoEm = OffsetDateTime.now();
            c.persist();
        }
        return c;
    }

    private static String passoAtivo(Conversa c) {
        if (c.etapa == null) return null;
        if (c.atualizadoEm == null || c.atualizadoEm.isBefore(OffsetDateTime.now().minusMinutes(MINUTOS_PASSO))) {
            c.etapa = null;
            return null;
        }
        return c.etapa;
    }

    void enviar(Config config, long chat, Tela t) {
        telegram.enviarMenu(config.telegramBotToken, chat, t.texto(), t.linhas());
    }

    // Troca a mensagem do botão tocado; se não der (mensagem antiga), manda outra.
    private void mostrar(Config config, long chat, Long mensagem, Tela t) {
        if (mensagem != null) {
            try {
                telegram.editarMenu(config.telegramBotToken, chat, mensagem, t.texto(), t.linhas());
                return;
            } catch (Telegram.ErroTelegram e) {
                // segue e manda uma nova
            }
        }
        enviar(config, chat, t);
    }
}
