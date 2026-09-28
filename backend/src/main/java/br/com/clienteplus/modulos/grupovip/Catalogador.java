package br.com.clienteplus.modulos.grupovip;

import io.quarkus.logging.Log;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

// Dados dos livros da Biblioteca (autor, categoria, gênero, capa e resumo),
// para o robô buscar por autor, categoria e gênero.
//
//   1. Na hora em que o livro entra (preparar): a subpasta do Google Drive
//      vira a categoria e o nome do arquivo dá o título e, quando dá para
//      saber, o autor ("Machado de Assis - Dom Casmurro.pdf").
//   2. Em segundo plano (1 livro a cada 2 segundos): o Google Books completa
//      autor, gênero, capa, ano e resumo. Só aceita o resultado se o título
//      bater com o do arquivo (senão fica "não encontrado" e o dono completa
//      no painel, se quiser).
//
// O que o dono edita no painel (dados_status = "manual") nunca é trocado.
@ApplicationScoped
public class Catalogador {

    @Inject
    GoogleBooks books;

    // lojas cuja chave do Google não serve para a Books API (consulta sem chave)
    private final Set<UUID> semChave = ConcurrentHashMap.newKeySet();
    // o Google pediu para esperar
    private final Map<UUID, OffsetDateTime> pausa = new ConcurrentHashMap<>();

    private static final Set<String> LIGACOES = Set.of("de", "da", "do", "dos", "das", "e", "van", "von", "del", "della",
            "di", "du", "la", "le", "y");
    private static final Set<String> PALAVRAS_VAZIAS = Set.of("o", "a", "os", "as", "um", "uma", "de", "da", "do", "dos",
            "das", "e", "em", "no", "na", "the", "of", "and", "pdf", "epub", "mobi", "livro", "ebook");

    // ---------- 1. Quando o livro entra ----------

    // pasta: caminho da subpasta no Drive ("Romances / Machado") ou "" / null.
    // materiais: biblioteca de materiais (apostilas, vídeos...): o nome do
    // arquivo vira só o título ("Aula 1 - Introdução" não tem autor).
    static void preparar(Livro l, String pasta, boolean materiais) {
        if (pasta != null && !pasta.isBlank()) {
            String[] partes = pasta.split(" / ");
            l.categoria = limitar(partes[partes.length - 1].trim(), 80);
        }
        String[] tituloAutor = materiais ? new String[] {limpar(Biblioteca.titulo(l.arquivoNome)), null} : tituloEAutor(l.arquivoNome);
        l.titulo = tituloAutor[0];
        if (l.autor == null) l.autor = tituloAutor[1];
        l.dadosStatus = Livro.PENDENTE;
    }

    // [título, autor ou null] a partir do nome do arquivo.
    static String[] tituloEAutor(String arquivoNome) {
        String base = limpar(Biblioteca.titulo(arquivoNome));
        String[] partes = partes(base);
        if (partes.length == 2) {
            boolean a = pareceNome(partes[0]);
            boolean b = pareceNome(partes[1]);
            if (a && !b) return new String[] {partes[1], partes[0]};
            if (b && !a) return new String[] {partes[0], partes[1]};
        }
        return new String[] {base, null};
    }

    // Tira sobras comuns de nomes de arquivo: "(1)", "(cópia)", "[PDF]"...
    static String limpar(String nome) {
        String t = nome.replaceAll("(?i)\\s*[\\[(](\\d+|c[oó]pia|copy|pdf|epub|mobi|ebook)[\\])]\\s*$", "")
                .replaceAll("\\s+", " ")
                .trim();
        return t.isEmpty() ? nome : t;
    }

    private static String[] partes(String base) {
        String[] p = base.split("\\s+[-–—]\\s+");
        return p.length == 2 ? new String[] {p[0].trim(), p[1].trim()} : new String[] {base};
    }

    // "Machado de Assis", "J. R. R. Tolkien": de 2 a 5 palavras com
    // maiúscula (ou ligações como "de"), sem números.
    static boolean pareceNome(String s) {
        if (s.matches(".*\\d.*")) return false;
        String[] palavras = s.trim().split("\\s+");
        if (palavras.length < 2 || palavras.length > 5) return false;
        int maiusculas = 0;
        for (String p : palavras) {
            if (LIGACOES.contains(p)) continue;
            if (!Character.isUpperCase(p.codePointAt(0))) return false;
            maiusculas++;
        }
        return maiusculas >= 2;
    }

    // ---------- 2. Google Books, em segundo plano ----------

    private record Pedido(UUID livroId, UUID storeId, String titulo, String autor, String arquivoNome, String chave) {}

    @Scheduled(every = "2s", delayed = "25s", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void trabalhar() {
        OffsetDateTime agora = OffsetDateTime.now();
        Pedido p = QuarkusTransaction.requiringNew().call(() -> {
            for (Config c : Config.<Config>list("completarLivros = true and bibliotecaTipo = ?1", Config.LIVROS)) {
                OffsetDateTime ate = pausa.get(c.storeId);
                if (ate != null && ate.isAfter(agora)) continue;
                Livro l = Livro.<Livro>find("storeId = ?1 and dadosStatus = ?2 order by createdAt", c.storeId, Livro.PENDENTE)
                        .firstResult();
                if (l != null) {
                    return new Pedido(l.id, c.storeId, l.titulo, l.autor, l.arquivoNome,
                            semChave.contains(c.storeId) ? null : c.googleApiKey);
                }
            }
            return null;
        });
        if (p == null) return;

        GoogleBooks.Volume achado;
        try {
            achado = procurar(p);
        } catch (GoogleBooks.ErroBooks e) {
            if (e.chaveRecusada && p.chave() != null) {
                semChave.add(p.storeId()); // tenta de novo sem a chave no próximo ciclo
            } else if (e.tentarDepois) {
                pausa.put(p.storeId(), OffsetDateTime.now().plusMinutes(2));
            } else {
                Log.warnf("Biblioteca: Google Books não respondeu para %s: %s", p.titulo(), e.getMessage());
                QuarkusTransaction.requiringNew().run(() -> marcar(p.livroId(), null));
            }
            return;
        }
        QuarkusTransaction.requiringNew().run(() -> marcar(p.livroId(), achado));
    }

    // Tenta do jeito mais certeiro ao mais solto. Aceita o 1º resultado cujo
    // título bate (e o autor, quando a busca tem autor).
    private GoogleBooks.Volume procurar(Pedido p) {
        List<String[]> tentativas = new ArrayList<>(); // [título, autor ou null]
        if (p.autor() != null) tentativas.add(new String[] {p.titulo(), p.autor()});
        String[] partes = partes(limpar(Biblioteca.titulo(p.arquivoNome())));
        if (partes.length == 2) {
            tentativas.add(new String[] {partes[1], partes[0]});
            tentativas.add(new String[] {partes[0], partes[1]});
        }
        tentativas.add(new String[] {p.titulo(), null});
        for (String[] t : tentativas) {
            String q = "intitle:" + t[0] + (t[1] != null ? " inauthor:" + t[1] : "");
            for (GoogleBooks.Volume v : books.buscar(q, p.chave())) {
                if (tituloBate(t[0], v.titulo()) && (t[1] == null || autorBate(t[1], v.autores()))) return v;
            }
        }
        return null;
    }

    static boolean tituloBate(String nosso, String deles) {
        List<String> a = palavras(nosso);
        List<String> b = palavras(deles.split(":")[0]);
        if (a.isEmpty() || b.isEmpty()) return false;
        long emB = a.stream().filter(b::contains).count();
        long emA = b.stream().filter(a::contains).count();
        return emB >= Math.ceil(a.size() * 0.6) && emA >= Math.ceil(b.size() * 0.5);
    }

    static boolean autorBate(String nosso, List<String> autores) {
        List<String> deles = palavras(String.join(" ", autores));
        return palavras(nosso).stream().anyMatch(p -> p.length() >= 3 && deles.contains(p));
    }

    static List<String> palavras(String s) {
        return Arrays.stream(GestaoTelegram.normal(s == null ? "" : s).split("[^\\p{L}\\p{N}]+"))
                .filter(p -> !p.isEmpty() && !PALAVRAS_VAZIAS.contains(p))
                .toList();
    }

    // Grava o resultado no livro e nas cópias dele em outros grupos.
    private static void marcar(UUID livroId, GoogleBooks.Volume v) {
        Livro l = Livro.findById(livroId);
        if (l == null || !Livro.PENDENTE.equals(l.dadosStatus)) return;
        List<Livro> copias = l.md5 != null
                ? Livro.list("storeId = ?1 and md5 = ?2 and dadosStatus = ?3", l.storeId, l.md5, Livro.PENDENTE)
                : List.of(l);
        for (Livro c : copias) {
            if (v == null) {
                c.dadosStatus = Livro.NAO_ENCONTRADO;
                continue;
            }
            c.titulo = limitar(v.titulo(), 200);
            if (!v.autores().isEmpty()) c.autor = limitar(String.join(", ", v.autores()), 200);
            if (!v.categorias().isEmpty()) c.genero = genero(v.categorias().get(0));
            if (v.descricao() != null) c.sinopse = limitar(v.descricao().replaceAll("<[^>]+>", "").trim(), 1500);
            c.capaUrl = v.capa();
            c.ano = v.ano();
            c.dadosStatus = Livro.OK;
        }
    }

    static String limitar(String s, int max) {
        if (s == null) return null;
        return s.length() > max ? s.substring(0, max - 1) + "…" : s;
    }

    // Os gêneros do Google Books vêm em inglês ("Fiction / Romance / General"):
    // usa a 1ª parte, traduzida.
    private static final Map<String, String> GENEROS = new HashMap<>();

    static {
        String[][] pares = {
            {"fiction", "Ficção"}, {"juvenile fiction", "Infantojuvenil"}, {"juvenile nonfiction", "Infantojuvenil"},
            {"young adult fiction", "Jovem adulto"}, {"young adult nonfiction", "Jovem adulto"},
            {"biography & autobiography", "Biografia"}, {"history", "História"}, {"religion", "Religião"},
            {"bibles", "Religião"}, {"self-help", "Autoajuda"}, {"business & economics", "Negócios e economia"},
            {"science", "Ciência"}, {"philosophy", "Filosofia"}, {"psychology", "Psicologia"}, {"poetry", "Poesia"},
            {"drama", "Teatro"}, {"cooking", "Culinária"}, {"health & fitness", "Saúde"}, {"education", "Educação"},
            {"literary criticism", "Crítica literária"}, {"literary collections", "Coletâneas"}, {"computers", "Informática"},
            {"comics & graphic novels", "Quadrinhos"}, {"political science", "Política"}, {"social science", "Ciências sociais"},
            {"law", "Direito"}, {"medical", "Medicina"}, {"art", "Arte"}, {"music", "Música"},
            {"body, mind & spirit", "Espiritualidade"}, {"family & relationships", "Família e relacionamentos"},
            {"travel", "Viagem"}, {"sports & recreation", "Esportes"}, {"language arts & disciplines", "Linguagem"},
            {"foreign language study", "Idiomas"}, {"mathematics", "Matemática"}, {"technology & engineering", "Tecnologia"},
            {"true crime", "Crime real"}, {"humor", "Humor"}, {"nature", "Natureza"}, {"reference", "Referência"},
            {"performing arts", "Artes cênicas"}, {"games & activities", "Jogos"}, {"pets", "Animais"},
            {"photography", "Fotografia"}, {"architecture", "Arquitetura"}, {"gardening", "Jardinagem"},
            {"crafts & hobbies", "Artesanato"}, {"house & home", "Casa"}, {"study aids", "Estudos"},
            {"transportation", "Transportes"}, {"design", "Design"}, {"antiques & collectibles", "Colecionáveis"},
        };
        for (String[] p : pares) GENEROS.put(p[0], p[1]);
    }

    static String genero(String categoria) {
        String primeira = categoria.split("/")[0].trim();
        String traduzido = GENEROS.get(primeira.toLowerCase());
        return limitar(traduzido != null ? traduzido : primeira, 60);
    }
}
