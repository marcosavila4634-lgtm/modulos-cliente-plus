package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.Erro;
import br.com.clienteplus.modulos.grupovip.BibliotecaContrato.SugestaoJson;
import br.com.clienteplus.modulos.grupovip.Telegram.Tecla;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

// Sugestões de livros: o membro pede pelo robô um livro que não está na
// biblioteca. O dono vê a lista (juntada pelo título, com quantas pessoas
// pediram) e, quando o livro entra, o robô avisa quem pediu com um botão
// para receber. Se um envio em massa trouxer um livro com o mesmo título, a
// sugestão é atendida sozinha (Automações, a cada minuto).
@ApplicationScoped
public class Sugestoes {

    static final int POR_DIA = 5;

    @Inject
    Telegram telegram;

    @Inject
    Membros membros;

    // Registra a sugestão. Devolve a resposta para a pessoa.
    String criar(Config config, Membro m, String texto) {
        Vocabulario v = Vocabulario.de(config);
        String t = texto == null ? "" : texto.replaceAll("\\s+", " ").trim();
        String[] partes = t.split("\\s+[-–—]\\s+|^[-–—]\\s*", 2);
        String titulo = partes[0].trim();
        String autor = partes.length > 1 ? Membros.limpo(partes[1]) : null;
        if (titulo.isEmpty() && autor != null) titulo = "Livros de " + autor;
        if (titulo.length() < 2) {
            return config.materiais() ? "Escreva o nome do material que você quer. Ex.: Apostila de Excel avançado"
                    : "Escreva o título do livro que você quer. Ex.: Dom Casmurro - Machado de Assis";
        }
        if (titulo.length() > 150) titulo = titulo.substring(0, 150);
        if (autor != null && autor.length() > 100) autor = autor.substring(0, 100);

        long hoje = LivroSugestao.count("cliente = ?1 and createdAt >= ?2", m.cliente, Biblioteca.inicioDoDia());
        if (hoje >= POR_DIA) return "Você já mandou " + POR_DIA + " sugestões hoje. Amanhã você pode mandar mais 🙂";
        String chave = GestaoTelegram.normal(titulo);
        boolean repetida = LivroSugestao.<LivroSugestao>list("cliente = ?1 and status = ?2", m.cliente, LivroSugestao.PENDENTE)
                .stream()
                .anyMatch(s -> GestaoTelegram.normal(s.titulo).equals(chave));
        if (repetida) return "Você já pediu \"" + Telegram.html(titulo) + "\". Assim que chegar, eu te aviso por aqui 😉";

        LivroSugestao s = new LivroSugestao();
        s.storeId = config.storeId;
        s.cliente = m.cliente;
        s.titulo = titulo;
        s.autor = autor;
        s.status = LivroSugestao.PENDENTE;
        s.createdAt = OffsetDateTime.now();
        s.persist();
        return "💡 Anotado! Sua sugestão <b>" + Telegram.html(titulo) + "</b>" + (autor != null ? " (" + Telegram.html(autor) + ")" : "")
                + v.t(" foi para a equipe. Quando o livro chegar na biblioteca, eu te aviso por aqui.");
    }

    // ---------- Painel ----------

    // Pendentes juntadas pelo título (mais pedidas primeiro) e as respondidas
    // nos últimos 60 dias.
    public List<SugestaoJson> listar(UUID storeId) {
        List<SugestaoJson> r = new ArrayList<>();
        Map<String, List<LivroSugestao>> pendentes = new LinkedHashMap<>();
        for (LivroSugestao s : LivroSugestao.<LivroSugestao>list("storeId = ?1 and status = ?2 order by createdAt desc", storeId,
                LivroSugestao.PENDENTE)) {
            pendentes.computeIfAbsent(GestaoTelegram.normal(s.titulo), k -> new ArrayList<>()).add(s);
        }
        pendentes.values().stream()
                .sorted(Comparator.comparingInt((List<LivroSugestao> l) -> -l.size()))
                .forEach(l -> r.add(json(l)));
        for (LivroSugestao s : LivroSugestao.<LivroSugestao>list("storeId = ?1 and status <> ?2 and respondidaEm >= ?3"
                + " order by respondidaEm desc", storeId, LivroSugestao.PENDENTE, OffsetDateTime.now().minusDays(60))) {
            r.add(json(List.of(s)));
        }
        return r;
    }

    private static SugestaoJson json(List<LivroSugestao> l) {
        LivroSugestao s = l.get(0);
        String autor = l.stream().map(x -> x.autor).filter(a -> a != null).findFirst().orElse(null);
        return new SugestaoJson(l.stream().map(x -> x.id).toList(), s.titulo, autor, l.size(),
                l.stream().map(x -> x.cliente.nome).distinct().limit(5).toList(), s.status,
                s.livro != null ? s.livro.id : null, s.livro != null ? s.livro.titulo : null, s.createdAt, s.respondidaEm);
    }

    // acao: "adicionado" (livroId vazio = procura pelo título) ou "recusado".
    public void responder(UUID storeId, List<UUID> ids, String acao, UUID livroId) {
        if (ids == null || ids.isEmpty()) throw Erro.invalido("Escolha a sugestão");
        List<LivroSugestao> lista = new ArrayList<>();
        for (UUID id : ids) {
            LivroSugestao s = LivroSugestao.findById(id);
            if (s == null || !s.storeId.equals(storeId)) throw Erro.naoEncontrado("Sugestão não encontrada");
            lista.add(s);
        }
        Config config = membros.config(storeId);
        if (LivroSugestao.RECUSADO.equals(acao)) {
            for (LivroSugestao s : lista) fechar(config, s, LivroSugestao.RECUSADO, null);
            return;
        }
        if (!LivroSugestao.ADICIONADO.equals(acao)) throw Erro.invalido("Ação inválida");
        Livro livro;
        if (livroId != null) {
            livro = Livro.findById(livroId);
            if (livro == null || !livro.storeId.equals(storeId)) throw Erro.naoEncontrado("Livro não encontrado");
        } else {
            livro = procurar(storeId, lista.get(0), null);
            if (livro == null) {
                throw Erro.invalido("Não achei \"" + lista.get(0).titulo + "\" na biblioteca. Faça o envio do livro primeiro"
                        + " (ou confira se o título está igual).");
            }
        }
        for (LivroSugestao s : lista) fechar(config, s, LivroSugestao.ADICIONADO, livro);
    }

    // Automações: sugestões atendidas por livros que chegaram depois delas.
    public int conferir(Config config) {
        int atendidas = 0;
        for (LivroSugestao s : LivroSugestao.<LivroSugestao>list("storeId = ?1 and status = ?2", config.storeId,
                LivroSugestao.PENDENTE)) {
            Livro l = procurar(config.storeId, s, s.createdAt);
            if (l != null) {
                fechar(config, s, LivroSugestao.ADICIONADO, l);
                atendidas++;
            }
        }
        return atendidas;
    }

    // Livro com todas as palavras do título (e do autor, se veio). depois:
    // só livros que entraram depois dessa data.
    private static Livro procurar(UUID storeId, LivroSugestao s, OffsetDateTime depois) {
        List<String> titulo = Catalogador.palavras(s.titulo.startsWith("Livros de ") ? "" : s.titulo);
        List<String> autor = s.autor != null ? Catalogador.palavras(s.autor) : List.of();
        if (titulo.isEmpty() && autor.isEmpty()) return null;
        List<Livro> candidatos = depois != null
                ? Livro.list("storeId = ?1 and createdAt > ?2", storeId, depois)
                : Livro.list("storeId", storeId);
        return candidatos.stream()
                .filter(l -> {
                    String t = GestaoTelegram.normal(l.titulo + " " + l.arquivoNome);
                    String a = GestaoTelegram.normal((l.autor != null ? l.autor : "") + " " + l.arquivoNome);
                    return titulo.stream().allMatch(t::contains) && autor.stream().allMatch(a::contains);
                })
                .min(Comparator.comparingInt(l -> l.titulo.length()))
                .orElse(null);
    }

    private void fechar(Config config, LivroSugestao s, String status, Livro livro) {
        if (!LivroSugestao.PENDENTE.equals(s.status)) return;
        s.status = status;
        s.livro = livro;
        s.respondidaEm = OffsetDateTime.now();
        Membro m = Membro.<Membro>find("cliente", s.cliente).firstResult();
        if (!config.robo() || m == null || m.telegramId == null) return;
        try {
            if (LivroSugestao.ADICIONADO.equals(status)) {
                telegram.enviarMenu(config.telegramBotToken, m.telegramId,
                        Vocabulario.de(config).t("📚 Boa notícia! O livro que você pediu chegou na biblioteca:\n\n") + Biblioteca.legenda(livro),
                        List.of(List.of(Tecla.acao("📥 Receber agora", "livro:" + livro.id)),
                                List.of(Tecla.acao("📋 Menu", "m:menu"))));
            } else {
                telegram.enviarTexto(config.telegramBotToken, m.telegramId, "Sobre a sua sugestão <b>" + Telegram.html(s.titulo)
                        + Vocabulario.de(config).t("</b>: por enquanto não vamos conseguir adicionar este livro. Obrigado por sugerir! 💛"));
            }
        } catch (Telegram.ErroTelegram e) {
            Log.warnf("Sugestões: não deu para avisar %s: %s", s.cliente.nome, e.getMessage());
        }
    }
}
