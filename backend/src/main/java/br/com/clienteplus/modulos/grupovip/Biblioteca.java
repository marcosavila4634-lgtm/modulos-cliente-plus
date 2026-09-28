package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.Erro;
import br.com.clienteplus.modulos.grupovip.BibliotecaContrato.*;
import com.fasterxml.jackson.databind.JsonNode;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.resteasy.reactive.multipart.FileUpload;

// Biblioteca de livros (ou de outros materiais: apostilas, vídeos, áudios...,
// ver Config.bibliotecaTipo e Vocabulario.java) dos grupos do Telegram. No
// código, cada arquivo da biblioteca é um "Livro".
//
//   Envio em massa: o dono escolhe uma pasta PÚBLICA do Google Drive (ou envia
//   os arquivos do computador) e um grupo. Os livros entram no catálogo e,
//   se ele quiser, o robô posta um por um no grupo (EnvioEmMassa.java, no
//   ritmo que o Telegram aceita). O mesmo livro não entra duas vezes (md5).
//
//   Cópia entre grupos (origem "telegram"): o acervo de um grupo do dono vai
//   para outro (ex.: o grupo lotou). Livros que o robô já postou vão pelo
//   file_id; o resto o robô descobre lendo as mensagens do grupo de origem
//   uma por uma (EnvioEmMassa.varrer) e copia com copyMessage.
//
//   Robô bibliotecário: no privado, o membro procura pelo menu do robô
//   (Atendente.java) por nome, autor, categoria ou gênero; se ele tem acesso
//   ao grupo do livro, o robô manda o arquivo (até LIMITE_POR_DIA por dia).
//   Depois do 1º envio o Telegram guarda o arquivo (file_id) e os próximos
//   pedidos saem na hora. Livros do Drive acima de 50 MB (limite do robô) não
//   vão para o grupo, mas ficam na biblioteca: o robô entrega um link
//   temporário do sistema (LinksDeLivro.java), nunca o endereço do Drive.
//
//   Dados dos livros: Catalogador.java (subpasta = categoria, nome do arquivo
//   e Google Books).
@ApplicationScoped
public class Biblioteca {

    @Inject
    Membros membros;

    @Inject
    Telegram telegram;

    @Inject
    GoogleDrive drive;

    @Inject
    Conteudos conteudos;

    @Inject
    EnderecoPublico endereco;

    @Inject
    LinksDeLivro links;

    @Inject
    ContaServicoGoogle contaServico;

    @ConfigProperty(name = "grupo-vip.livros-dir", defaultValue = "data/livros")
    String pastaLivros;

    static final long MB = 1024 * 1024;
    // limite de arquivo da API de robôs do Telegram
    static final long TAMANHO_MAXIMO = 50 * MB;
    static final int LIMITE_POR_DIA = 30;
    static final int MAX_ARQUIVOS = 20000;
    // ~20 arquivos por minuto no mesmo grupo
    static final int INTERVALO_SEGUNDOS = 3;
    static final List<String> EXTENSOES = List.of("pdf", "epub", "mobi", "azw", "azw3", "djvu", "fb2", "txt", "rtf", "doc",
            "docx", "odt", "cbz", "cbr", "zip", "rar", "mp3", "m4b");
    // Biblioteca de materiais (Config.bibliotecaTipo): também vídeos, imagens,
    // planilhas, apresentações e mais formatos de áudio.
    static final List<String> EXTENSOES_MATERIAIS = java.util.stream.Stream.concat(EXTENSOES.stream(), java.util.stream.Stream.of(
            "mp4", "mov", "m4v", "webm", "mkv", "avi", "jpg", "jpeg", "png", "webp", "gif", "xls", "xlsx", "ods", "csv", "ppt",
            "pptx", "odp", "m4a", "wav", "ogg", "aac", "7z")).toList();
    private static final int POR_PAGINA = 50;

    static List<String> extensoes(Config c) {
        return c.materiais() ? EXTENSOES_MATERIAIS : EXTENSOES;
    }

    // ---------- Painel ----------

    public PainelBiblioteca painel(UUID storeId) {
        Config config = membros.config(storeId);
        List<ImportacaoJson> importacoes = Importacao.<Importacao>list("storeId = ?1 order by createdAt desc", storeId).stream()
                .map(this::json)
                .toList();
        Map<UUID, Long> porGrupo = Livro.<Livro>list("storeId", storeId).stream()
                .collect(Collectors.groupingBy(l -> l.grupo.id, Collectors.counting()));
        List<ResumoGrupo> resumo = Grupo.<Grupo>list("storeId = ?1 and plataforma = ?2 order by nome", storeId, Grupo.TELEGRAM)
                .stream()
                .filter(g -> porGrupo.containsKey(g.id))
                .map(g -> new ResumoGrupo(g.id, g.nome, porGrupo.get(g.id).intValue()))
                .toList();

        OffsetDateTime mes = OffsetDateTime.now().minusDays(30);
        Map<UUID, Long> noMes = LivroPedido.<LivroPedido>list("storeId = ?1 and momento >= ?2", storeId, mes).stream()
                .collect(Collectors.groupingBy(p -> p.livro.id, Collectors.counting()));
        List<MaisPedido> maisPedidos = Livro.<Livro>find("storeId = ?1 and pedidos > 0 order by pedidos desc", storeId)
                .page(0, 15).list().stream()
                .map(l -> new MaisPedido(l.id, l.titulo, l.grupo.nome, l.pedidos, noMes.getOrDefault(l.id, 0L).intValue()))
                .toList();
        int hoje = (int) LivroPedido.count("storeId = ?1 and momento >= ?2", storeId, inicioDoDia());
        if (config.telegramDonoCodigo == null) config.telegramDonoCodigo = UUID.randomUUID().toString().substring(0, 8);
        String linkDono = config.robo() ? Telegram.linkRobo(config.telegramBotUsuario, "dono_" + config.telegramDonoCodigo) : null;

        String contaEmail = null;
        if (config.googleContaServico != null) {
            try {
                contaEmail = contaServico.ler(config.googleContaServico).email();
            } catch (GoogleDrive.ErroDrive ignorado) {
                // JSON com defeito: aparece como não configurado
            }
        }
        return new PainelBiblioteca(GoogleDrive.configurado(config), config.googleApiKey != null && !config.googleApiKey.isBlank(),
                contaEmail, config.robo(),
                config.telegramBotUsuario,
                conteudos.grupos(storeId, config).stream().filter(ConteudosContrato.GrupoOpcao::automatico).toList(),
                importacoes, resumo, maisPedidos, hoje, LIMITE_POR_DIA, TAMANHO_MAXIMO, extensoes(config),
                config.telegramDonoId != null, linkDono, config.completarLivros,
                (int) Livro.count("storeId = ?1 and dadosStatus = ?2", storeId, Livro.PENDENTE),
                (int) LivroSugestao.count("storeId = ?1 and status = ?2", storeId, LivroSugestao.PENDENTE),
                config.materiais() ? Config.MATERIAIS : Config.LIVROS);
    }

    static OffsetDateTime inicioDoDia() {
        return Membros.hoje().atStartOfDay(br.com.clienteplus.modulos.comum.Formatos.FUSO).toOffsetDateTime();
    }

    public void salvarChaveGoogle(UUID storeId, String chave) {
        String c = Membros.limpo(chave);
        if (c != null && !c.matches("[A-Za-z0-9_-]{20,}")) throw Erro.invalido("Chave inválida: copie a chave inteira (começa com AIza...)");
        membros.config(storeId).googleApiKey = c;
    }

    // Arquivo JSON da conta de serviço (pasta do Drive privada). Testa com o
    // Google antes de guardar. Vazio = apaga.
    public void salvarContaServico(UUID storeId, String conteudo) {
        Config config = membros.config(storeId);
        if (conteudo == null || conteudo.isBlank()) {
            if (config.googleContaServico != null) contaServico.esquecer(config.googleContaServico);
            config.googleContaServico = null;
            return;
        }
        try {
            contaServico.token(conteudo.trim());
        } catch (GoogleDrive.ErroDrive e) {
            throw Erro.invalido(e.getMessage());
        }
        config.googleContaServico = conteudo.trim();
    }

    // ---------- Livros ----------

    public ListaLivros livros(UUID storeId, String busca, UUID grupoId, int pagina) {
        List<String> termos = termos(busca);
        List<Livro> todos = (grupoId != null
                        ? Livro.<Livro>list("storeId = ?1 and grupo.id = ?2", storeId, grupoId)
                        : Livro.<Livro>list("storeId", storeId))
                .stream()
                .filter(l -> combina(l, termos))
                .sorted(Comparator.comparing((Livro l) -> GestaoTelegram.normal(l.titulo)))
                .toList();
        int p = Math.max(0, pagina);
        List<LivroJson> itens = todos.stream().skip((long) p * POR_PAGINA).limit(POR_PAGINA).map(Biblioteca::json).toList();
        return new ListaLivros(itens, todos.size(), p, POR_PAGINA);
    }

    static LivroJson json(Livro l) {
        return new LivroJson(l.id, l.titulo, l.arquivoNome, l.tamanho, l.grupo.id, l.grupo.nome, l.origem, l.pedidos,
                l.telegramFileId != null, l.autor, l.categoria, l.genero, l.sinopse, l.capaUrl, l.ano, l.dadosStatus,
                l.tamanho > TAMANHO_MAXIMO && l.telegramFileId == null, l.createdAt);
    }

    static List<String> termos(String busca) {
        if (busca == null || busca.isBlank()) return List.of();
        return Arrays.stream(GestaoTelegram.normal(busca).split("[^\\p{L}\\p{N}]+")).filter(t -> !t.isEmpty()).toList();
    }

    // Todas as palavras da busca aparecem no título, no nome do arquivo, no
    // autor, na categoria ou no gênero.
    static boolean combina(Livro l, List<String> termos) {
        if (termos.isEmpty()) return true;
        String texto = GestaoTelegram.normal(l.titulo + " " + l.arquivoNome + " " + (l.autor != null ? l.autor : "") + " "
                + (l.categoria != null ? l.categoria : "") + " " + (l.genero != null ? l.genero : ""));
        return termos.stream().allMatch(texto::contains);
    }

    // Tira o livro da biblioteca e, se pedido, apaga os posts dele nos grupos.
    public void excluirLivro(UUID storeId, UUID id, boolean doGrupo) {
        Livro l = Livro.findById(id);
        if (l == null || !l.storeId.equals(storeId)) throw Erro.naoEncontrado("Livro não encontrado");
        Config config = membros.config(storeId);
        if (doGrupo && l.grupo.automatico(config)) {
            for (ImportacaoItem i : ImportacaoItem.<ImportacaoItem>list("livro = ?1 and telegramMessageId is not null", l)) {
                try {
                    telegram.apagarMensagem(config.telegramBotToken, l.grupo.telegramChatId, i.telegramMessageId);
                } catch (Telegram.ErroTelegram e) {
                    Log.warnf("Biblioteca: não deu para apagar o post de %s: %s", l.titulo, e.getMessage());
                }
            }
        }
        // o mesmo arquivo pode estar na biblioteca de outro grupo (cópia entre grupos)
        if (l.arquivoUrl != null && Livro.count("arquivoUrl = ?1 and id <> ?2", l.arquivoUrl, l.id) == 0) {
            try {
                Files.deleteIfExists(arquivo(l.arquivoUrl));
            } catch (IOException ignorado) {
                // o arquivo some na próxima limpeza
            }
        }
        l.delete();
    }

    Path arquivo(String nome) {
        Path pasta = Paths.get(pastaLivros).toAbsolutePath().normalize();
        Path p = pasta.resolve(nome).normalize();
        if (!p.startsWith(pasta)) throw Erro.invalido("Arquivo inválido");
        return p;
    }

    // Título a partir do nome do arquivo: "dom_casmurro-machado.pdf" -> "dom casmurro-machado".
    static String titulo(String arquivoNome) {
        int ponto = arquivoNome.lastIndexOf('.');
        String t = ponto > 0 ? arquivoNome.substring(0, ponto) : arquivoNome;
        t = t.replace('_', ' ').replaceAll("\\s+", " ").trim();
        return t.isEmpty() ? arquivoNome : t;
    }

    static String extensao(String arquivoNome) {
        int ponto = arquivoNome.lastIndexOf('.');
        return ponto >= 0 ? arquivoNome.substring(ponto + 1).toLowerCase(Locale.ROOT) : "";
    }

    // ---------- Envios em massa ----------

    public ImportacaoJson json(Importacao imp) {
        Map<String, Long> n = ImportacaoItem.<ImportacaoItem>list("importacao", imp).stream()
                .collect(Collectors.groupingBy(i -> i.status, Collectors.counting()));
        int pendentes = n.getOrDefault(ImportacaoItem.PENDENTE, 0L).intValue();
        int total = n.values().stream().mapToInt(Long::intValue).sum();
        Integer minutos = Importacao.ENVIANDO.equals(imp.status) || Importacao.PAUSADA.equals(imp.status)
                ? (int) Math.ceil(pendentes * INTERVALO_SEGUNDOS / 60.0)
                : null;
        return new ImportacaoJson(imp.id, imp.grupo.id, imp.grupo.nome, imp.topico != null ? imp.topico.nome : null, imp.origem,
                imp.origemGrupo != null ? imp.origemGrupo.nome : null, imp.copiarMidias, imp.varreduraAtual, imp.varreduraAte,
                imp.protegidas, imp.pastaUrl, imp.pastaNome, imp.postarNoGrupo, imp.status, imp.erro, total,
                n.getOrDefault(ImportacaoItem.ENVIADO, 0L).intValue(), n.getOrDefault(ImportacaoItem.PULADO, 0L).intValue(),
                n.getOrDefault(ImportacaoItem.GRANDE_DEMAIS, 0L).intValue(), n.getOrDefault(ImportacaoItem.FALHOU, 0L).intValue(),
                pendentes, minutos, imp.createdAt, imp.concluidaEm);
    }

    public DetalhesImportacao detalhes(UUID storeId, UUID id, String status) {
        Importacao imp = importacao(storeId, id);
        List<ImportacaoItem> itens = status == null || status.isBlank()
                ? ImportacaoItem.<ImportacaoItem>find("importacao = ?1 order by ordem", imp).page(0, 500).list()
                : ImportacaoItem.<ImportacaoItem>find("importacao = ?1 and status = ?2 order by ordem", imp, status).page(0, 500).list();
        return new DetalhesImportacao(json(imp), itens.stream()
                .map(i -> new ItemJson(i.id, i.arquivoNome, i.tamanho, i.status, i.erro, i.enviadoEm))
                .toList());
    }

    Importacao importacao(UUID storeId, UUID id) {
        Importacao imp = Importacao.findById(id);
        if (imp == null || !imp.storeId.equals(storeId)) throw Erro.naoEncontrado("Envio não encontrado");
        return imp;
    }

    public Importacao criar(UUID storeId, DadosImportacao d) {
        if (d == null) throw Erro.invalido("Preencha o envio");
        Config config = membros.config(storeId);
        if (!config.robo()) throw Erro.conflito("Conecte o robô do Telegram em Configurações");
        Grupo g = d.grupoId() != null ? Grupo.findById(d.grupoId()) : null;
        if (g == null || !g.storeId.equals(storeId)) throw Erro.invalido("Escolha o grupo");
        if (!g.automatico(config)) throw Erro.invalido("O robô não cuida do grupo " + g.nome + " (informe o ID do grupo)");
        Importacao imp = new Importacao();
        imp.storeId = storeId;
        imp.grupo = g;
        imp.postarNoGrupo = d.postarNoGrupo();
        if (d.topicoId() != null) {
            Topico t = Topico.findById(d.topicoId());
            if (t == null || !t.grupo.id.equals(g.id)) throw Erro.invalido("Tópico não encontrado");
            imp.topico = t;
        }
        if (Livro.DRIVE.equals(d.origem())) {
            if (!GoogleDrive.configurado(config)) {
                throw Erro.invalido("Configure o acesso ao Google Drive (Biblioteca › Google) para ler pastas do Drive");
            }
            String id = GoogleDrive.idDaPasta(d.pastaUrl());
            if (id == null) throw Erro.invalido("Link da pasta inválido: copie o link da pasta do Google Drive (drive.google.com/drive/folders/...)");
            imp.origem = Livro.DRIVE;
            imp.pastaUrl = d.pastaUrl().trim();
            imp.status = Importacao.LISTANDO; // EnvioEmMassa lista a pasta em seguida
        } else if (Livro.TELEGRAM.equals(d.origem())) {
            Grupo origem = d.origemGrupoId() != null ? Grupo.findById(d.origemGrupoId()) : null;
            if (origem == null || !origem.storeId.equals(storeId)) throw Erro.invalido("Escolha o grupo de onde copiar");
            if (origem.id.equals(g.id)) throw Erro.invalido("Escolha grupos diferentes (de onde copiar e para onde copiar)");
            if (!origem.automatico(config)) {
                throw Erro.invalido("O robô precisa ser administrador do grupo " + origem.nome + " (informe o ID do grupo)");
            }
            if (config.telegramDonoId == null) {
                throw Erro.invalido("Conecte o seu Telegram de dono ao robô (botão na tela) antes de copiar um grupo");
            }
            Long ultima = mensagemDoLink(d.ultimaMensagem());
            if (ultima == null) {
                throw Erro.invalido("Cole o link da ÚLTIMA mensagem do grupo " + origem.nome
                        + " (no Telegram: botão direito na mensagem › Copiar link)");
            }
            Long primeira = d.primeiraMensagem() == null || d.primeiraMensagem().isBlank() ? 1L : mensagemDoLink(d.primeiraMensagem());
            if (primeira == null) throw Erro.invalido("Link da primeira mensagem inválido (ou deixe vazio para começar do início)");
            if (primeira > ultima) throw Erro.invalido("A primeira mensagem vem depois da última");
            if (ultima - primeira > 500_000) throw Erro.invalido("Intervalo grande demais (máximo 500 mil mensagens por cópia)");
            imp.origem = Livro.TELEGRAM;
            imp.origemGrupo = origem;
            imp.copiarMidias = d.copiarMidias();
            imp.varreduraDe = primeira;
            imp.varreduraAte = ultima;
            imp.varreduraAtual = primeira;
            imp.status = Importacao.LISTANDO; // EnvioEmMassa lê as mensagens do grupo de origem
            imp.persist();
            copiarCatalogo(imp);
            return imp;
        } else if (Livro.COMPUTADOR.equals(d.origem())) {
            imp.origem = Livro.COMPUTADOR;
            imp.status = Importacao.RECEBENDO; // o navegador envia os arquivos e depois chama iniciar
        } else {
            throw Erro.invalido("Escolha de onde vêm os livros");
        }
        imp.persist();
        return imp;
    }

    private static final Pattern LINK_MENSAGEM = Pattern.compile("t\\.me/\\S+/(\\d+)/?(?:\\?\\S*)?$");

    // Número da mensagem: "https://t.me/c/1234567890/4567" (ou com tópico:
    // ".../c/123/45/4567"), "t.me/nomedogrupo/4567" ou só "4567".
    static Long mensagemDoLink(String link) {
        if (link == null) return null;
        String l = link.trim();
        if (l.matches("\\d{1,12}")) return Long.parseLong(l);
        Matcher m = LINK_MENSAGEM.matcher(l);
        return m.find() ? Long.parseLong(m.group(1)) : null;
    }

    // Livros que o robô já postou no grupo de origem: entram na fila já na
    // criação (vão pelo file_id, sem precisar ler as mensagens).
    private void copiarCatalogo(Importacao imp) {
        int ordem = 0;
        for (Livro de : Livro.<Livro>list("grupo = ?1 and telegramFileId is not null order by titulo", imp.origemGrupo)) {
            Livro l = de.md5 != null ? Livro.<Livro>find("grupo = ?1 and md5 = ?2", imp.grupo, de.md5).firstResult() : null;
            boolean novo = l == null;
            if (novo) {
                l = copiaDoLivro(de, imp.grupo);
                l.persist();
            }
            ImportacaoItem item = novoItem(imp, de.arquivoNome, de.tamanho, ordem++);
            destinoDoItem(imp, item, l, novo);
            item.persist();
        }
    }

    static Livro copiaDoLivro(Livro de, Grupo para) {
        Livro l = new Livro();
        l.storeId = de.storeId;
        l.grupo = para;
        l.titulo = de.titulo;
        l.arquivoNome = de.arquivoNome;
        l.tamanho = de.tamanho;
        l.origem = de.origem;
        l.driveId = de.driveId;
        l.arquivoUrl = de.arquivoUrl;
        l.md5 = de.md5;
        l.telegramFileId = de.telegramFileId;
        l.autor = de.autor;
        l.categoria = de.categoria;
        l.genero = de.genero;
        l.sinopse = de.sinopse;
        l.capaUrl = de.capaUrl;
        l.ano = de.ano;
        l.dadosStatus = de.dadosStatus;
        return l;
    }

    // Um arquivo vindo do computador (o navegador manda um por vez).
    // pasta: subpasta onde o arquivo estava (quando o dono escolhe uma pasta
    // inteira); vira a categoria do livro.
    public ItemJson receberArquivo(UUID storeId, UUID importacaoId, FileUpload upload, String pasta) {
        Importacao imp = importacao(storeId, importacaoId);
        if (!Importacao.RECEBENDO.equals(imp.status)) throw Erro.conflito("Este envio não está recebendo arquivos");
        if (upload == null) throw Erro.invalido("Escolha um arquivo");
        String nome = upload.fileName() != null ? Path.of(upload.fileName()).getFileName().toString() : "arquivo";
        int ordem = (int) ImportacaoItem.count("importacao", imp);
        ImportacaoItem item = novoItem(imp, nome, upload.size(), ordem);
        String ext = extensao(nome);
        if (!extensoes(membros.config(storeId)).contains(ext)) {
            item.status = ImportacaoItem.PULADO;
            item.erro = "Formato não aceito (." + ext + ")";
        } else if (upload.size() > TAMANHO_MAXIMO) {
            item.status = ImportacaoItem.GRANDE_DEMAIS;
            item.erro = "Acima de 50 MB (limite do robô do Telegram)";
        } else {
            String md5 = md5(upload.uploadedFile());
            Livro l = Livro.<Livro>find("grupo = ?1 and md5 = ?2", imp.grupo, md5).firstResult();
            boolean novo = l == null;
            if (novo) {
                String guardado = UUID.randomUUID() + "." + ext;
                try {
                    Path destino = arquivo(guardado);
                    Files.createDirectories(destino.getParent());
                    Files.copy(upload.uploadedFile(), destino, StandardCopyOption.REPLACE_EXISTING);
                } catch (IOException e) {
                    throw new UncheckedIOException(e);
                }
                l = novoLivro(imp, nome, upload.size(), md5, pasta);
                l.origem = Livro.COMPUTADOR;
                l.arquivoUrl = guardado;
                l.persist();
            }
            destinoDoItem(imp, item, l, novo);
        }
        item.persist();
        return new ItemJson(item.id, item.arquivoNome, item.tamanho, item.status, item.erro, item.enviadoEm);
    }

    ImportacaoItem novoItem(Importacao imp, String nome, long tamanho, int ordem) {
        ImportacaoItem i = new ImportacaoItem();
        i.storeId = imp.storeId;
        i.importacao = imp;
        i.arquivoNome = nome;
        i.tamanho = tamanho;
        i.ordem = ordem;
        i.status = ImportacaoItem.PENDENTE;
        return i;
    }

    Livro novoLivro(Importacao imp, String nome, long tamanho, String md5, String pasta) {
        Livro l = new Livro();
        l.storeId = imp.storeId;
        l.grupo = imp.grupo;
        l.arquivoNome = nome;
        l.tamanho = tamanho;
        l.md5 = md5;
        Catalogador.preparar(l, pasta, membros.config(imp.storeId).materiais());
        return l;
    }

    // Livro já no catálogo: vai para o grupo só se ainda não foi postado lá.
    // novo = o livro acabou de entrar na biblioteca.
    void destinoDoItem(Importacao imp, ImportacaoItem item, Livro l, boolean novo) {
        item.livro = l;
        if (!imp.postarNoGrupo && !novo) {
            item.status = ImportacaoItem.PULADO;
            item.erro = "Já estava na biblioteca";
        } else if (!imp.postarNoGrupo) {
            item.status = ImportacaoItem.ENVIADO; // só entrou na biblioteca
            item.enviadoEm = OffsetDateTime.now();
        } else if (ImportacaoItem.count("livro = ?1 and status = ?2 and telegramMessageId is not null", l,
                ImportacaoItem.ENVIADO) > 0) {
            item.status = ImportacaoItem.PULADO;
            item.erro = "Já estava no grupo";
        } else {
            item.status = ImportacaoItem.PENDENTE;
        }
    }

    static String md5(Path arquivo) {
        try (InputStream in = Files.newInputStream(arquivo)) {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] buf = new byte[1 << 16];
            int n;
            while ((n = in.read(buf)) > 0) md.update(buf, 0, n);
            return HexFormat.of().formatHex(md.digest());
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    // O navegador terminou de mandar os arquivos do computador.
    public void iniciar(UUID storeId, UUID id) {
        Importacao imp = importacao(storeId, id);
        if (!Importacao.RECEBENDO.equals(imp.status)) throw Erro.conflito("Este envio já começou");
        if (ImportacaoItem.count("importacao", imp) == 0) throw Erro.invalido("Nenhum arquivo foi enviado");
        seguir(imp);
    }

    // Enviando se ainda há arquivos para o grupo; senão, concluída.
    static void seguir(Importacao imp) {
        imp.erro = null;
        if (ImportacaoItem.count("importacao = ?1 and status = ?2", imp, ImportacaoItem.PENDENTE) > 0) {
            imp.status = Importacao.ENVIANDO;
            imp.proximoEm = null;
        } else {
            imp.status = Importacao.CONCLUIDA;
            imp.concluidaEm = OffsetDateTime.now();
        }
    }

    public void pausar(UUID storeId, UUID id) {
        Importacao imp = importacao(storeId, id);
        if (!Importacao.ENVIANDO.equals(imp.status) && !Importacao.LISTANDO.equals(imp.status)) {
            throw Erro.conflito("Este envio não está em andamento");
        }
        imp.status = Importacao.PAUSADA;
    }

    public void continuar(UUID storeId, UUID id) {
        Importacao imp = importacao(storeId, id);
        if (!Importacao.PAUSADA.equals(imp.status) && !Importacao.FALHOU.equals(imp.status)) {
            throw Erro.conflito("Este envio não está pausado");
        }
        boolean faltaLer = Livro.TELEGRAM.equals(imp.origem) && imp.varreduraAtual != null && imp.varreduraAtual <= imp.varreduraAte;
        if (faltaLer || Livro.DRIVE.equals(imp.origem) && ImportacaoItem.count("importacao", imp) == 0) {
            imp.status = Importacao.LISTANDO; // a pasta (ou o grupo de origem) ainda não tinha sido lida
            imp.erro = null;
            imp.proximoEm = null;
        } else {
            seguir(imp);
        }
    }

    // Arquivos que falharam voltam para a fila.
    public void tentarFalhas(UUID storeId, UUID id) {
        Importacao imp = importacao(storeId, id);
        if (Importacao.RECEBENDO.equals(imp.status) || Importacao.LISTANDO.equals(imp.status)) {
            throw Erro.conflito("Espere o envio começar");
        }
        ImportacaoItem.update("status = ?1, erro = null where importacao = ?2 and status = ?3", ImportacaoItem.PENDENTE, imp,
                ImportacaoItem.FALHOU);
        ImportacaoItem.flush();
        if (!Importacao.PAUSADA.equals(imp.status)) seguir(imp);
    }

    // Tira o envio da lista (os livros continuam na biblioteca).
    public void excluir(UUID storeId, UUID id) {
        importacao(storeId, id).delete();
    }

    // ---------- Dados dos livros (autor, categoria, gênero...) ----------

    // O dono corrigiu os dados: vale para o livro e para as cópias dele em
    // outros grupos, e o Google Books não troca mais.
    public void editarLivro(UUID storeId, UUID id, DadosLivro d) {
        Livro l = livro(storeId, id);
        if (d == null) throw Erro.invalido("Preencha os dados do livro");
        String titulo = Membros.limpo(d.titulo());
        if (titulo == null) throw Erro.invalido("Informe o título");
        for (Livro c : copias(l)) {
            c.titulo = Catalogador.limitar(titulo, 200);
            c.autor = Catalogador.limitar(Membros.limpo(d.autor()), 200);
            c.categoria = Catalogador.limitar(Membros.limpo(d.categoria()), 80);
            c.genero = Catalogador.limitar(Membros.limpo(d.genero()), 60);
            c.sinopse = d.sinopse() == null || d.sinopse().isBlank() ? null : Catalogador.limitar(d.sinopse().trim(), 1500);
            c.dadosStatus = Livro.MANUAL;
        }
    }

    // Procura os dados no Google Books de novo (ex.: depois de corrigir o nome).
    public void buscarDadosDeNovo(UUID storeId, UUID id) {
        for (Livro c : copias(livro(storeId, id))) c.dadosStatus = Livro.PENDENTE;
    }

    public void completarLivros(UUID storeId, boolean ligado) {
        membros.config(storeId).completarLivros = ligado;
    }

    // Livros ou materiais: muda os textos do robô e do painel e os formatos
    // aceitos. O que já está na biblioteca continua lá.
    public void mudarTipo(UUID storeId, String tipo) {
        if (!Config.LIVROS.equals(tipo) && !Config.MATERIAIS.equals(tipo)) throw Erro.invalido("Escolha livros ou materiais");
        Config config = membros.config(storeId);
        // materiais não passam pelo Google Books (Catalogador); se voltar para
        // livros, os que ficaram pendentes são completados
        config.bibliotecaTipo = tipo;
        if (config.robo()) {
            try {
                telegram.definirComandos(config.telegramBotToken, comandos(config));
            } catch (Telegram.ErroTelegram ignorado) {
                // só o atalho do menu do robô
            }
        }
    }

    // Botão "Menu" da conversa com o robô.
    static Map<String, String> comandos(Config config) {
        Vocabulario v = Vocabulario.de(config);
        Map<String, String> comandos = new java.util.LinkedHashMap<>();
        comandos.put("menu", "Abrir o menu");
        comandos.put("livro", v.t("Procurar um livro pelo nome"));
        comandos.put("sugerir", v.t("Sugerir um livro para a biblioteca"));
        comandos.put("grupos", "Receber os links dos seus grupos");
        return comandos;
    }

    Livro livro(UUID storeId, UUID id) {
        Livro l = Livro.findById(id);
        if (l == null || !l.storeId.equals(storeId)) throw Erro.naoEncontrado("Livro não encontrado");
        return l;
    }

    // O mesmo arquivo na biblioteca de vários grupos.
    static List<Livro> copias(Livro l) {
        return l.md5 != null ? Livro.list("storeId = ?1 and md5 = ?2", l.storeId, l.md5) : List.of(l);
    }

    // O livro (ou a cópia dele) de um grupo que a pessoa pode usar. null = não pode.
    static Livro doMembro(Livro l, java.util.Collection<UUID> grupos) {
        if (grupos.contains(l.grupo.id)) return l;
        return copias(l).stream().filter(c -> grupos.contains(c.grupo.id)).findFirst().orElse(null);
    }

    // ---------- Entrega dos livros (robô) ----------

    // Manda o livro no privado: o arquivo, se couber no Telegram, ou o link
    // do Google Drive (arquivo acima de 50 MB, ou o Drive não deixou baixar).
    // Devolve false se não deu (a pessoa já foi avisada).
    boolean entregar(Config config, Membro m, long chat, Livro l) {
        String token = config.telegramBotToken;
        Vocabulario v = Vocabulario.de(config);
        long hoje = LivroPedido.count("cliente = ?1 and momento >= ?2", m.cliente, inicioDoDia());
        if (hoje >= LIMITE_POR_DIA) {
            telegram.enviarTexto(token, chat, v.t("Você já pediu " + LIMITE_POR_DIA + " livros hoje. Amanhã você pode pedir mais 🙂"));
            return false;
        }
        String legenda = legenda(l);
        Telegram.Opcoes opcoes = new Telegram.Opcoes(null, l.grupo.protegerConteudo, List.of());
        boolean porLink = l.telegramFileId == null && l.tamanho > TAMANHO_MAXIMO;
        if (!porLink) {
            try {
                if (l.telegramFileId != null) {
                    telegram.enviarDocumentoPorId(token, chat, l.telegramFileId, legenda, opcoes);
                } else {
                    telegram.enviarTexto(token, chat, v.t("⏳ Um instante, estou buscando o livro..."));
                    JsonNode msg = enviarArquivo(config, chat, l, legenda, opcoes);
                    l.telegramFileId = msg.path("document").path("file_id").asText(null);
                }
            } catch (GoogleDrive.ErroDrive e) {
                Log.warnf("Biblioteca: não deu para buscar %s no Drive: %s", l.titulo, e.getMessage());
                telegram.enviarTexto(token, chat, v.t("Não consegui buscar este livro agora. Tente de novo mais tarde."));
                return false;
            } catch (Telegram.ErroTelegram e) {
                Log.warnf("Biblioteca: não deu para enviar %s: %s", l.titulo, e.getMessage());
                if (l.driveId == null && l.arquivoUrl == null) {
                    telegram.enviarTexto(token, chat, v.t("Não consegui enviar este livro agora. Tente de novo mais tarde."));
                    return false;
                }
                porLink = true; // o Telegram não aceitou o arquivo: vai o link
            }
        }
        if (porLink) {
            if (l.driveId == null && l.arquivoUrl == null) {
                telegram.enviarTexto(token, chat, v.t("Este livro é grande demais para o Telegram. Avise a equipe, por favor."));
                return false;
            }
            // Link do sistema (nunca o do Drive): só desta pessoa, vale 24 h e
            // confere o pagamento a cada clique.
            String link = links.criar(l, m.cliente);
            String motivo = l.tamanho > TAMANHO_MAXIMO
                    ? "O arquivo tem " + (l.tamanho / MB) + " MB e passa do limite do Telegram (50 MB)."
                    : "Não consegui mandar o arquivo por aqui agora.";
            String ext = extensao(l.arquivoNome);
            String abrir = "pdf".equals(ext) || "txt".equals(ext) ? "📖 Ler online" : "▶️ Abrir online";
            List<Telegram.Tecla> botoes = LivroLinkResource.ABRE_NO_NAVEGADOR.contains(ext)
                    ? List.of(Telegram.Tecla.link(abrir, link + "?ler=1"), Telegram.Tecla.link("⬇️ Baixar", link))
                    : List.of(Telegram.Tecla.link("⬇️ Baixar", link));
            telegram.enviarMenu(token, chat, legenda + "\n\n" + motivo + " Use o link abaixo: ele é só seu e vale por "
                    + LinksDeLivro.HORAS + v.t(" horas (depois é só pedir o livro de novo)."), List.of(botoes));
        }
        l.pedidos++;
        LivroPedido p = new LivroPedido();
        p.storeId = l.storeId;
        p.livro = l;
        p.cliente = m.cliente;
        p.momento = OffsetDateTime.now();
        p.persist();
        return true;
    }

    // "📚 Dom Casmurro · ✍️ Machado de Assis (1899)"
    static String legenda(Livro l) {
        StringBuilder s = new StringBuilder("📚 <b>").append(Telegram.html(l.titulo)).append("</b>");
        if (l.autor != null) s.append("\n✍️ ").append(Telegram.html(l.autor));
        if (l.ano != null) s.append(" (").append(l.ano).append(")");
        if (l.genero != null || l.categoria != null) {
            s.append("\n🏷 ").append(Telegram.html(l.categoria != null ? l.categoria : l.genero));
            if (l.categoria != null && l.genero != null && !l.genero.equalsIgnoreCase(l.categoria)) {
                s.append(" · ").append(Telegram.html(l.genero));
            }
        }
        return s.toString();
    }

    // Sobe o arquivo (do Drive ou guardado aqui) para um chat. Devolve a mensagem.
    JsonNode enviarArquivo(Config config, Object chat, Livro l, String legenda, Telegram.Opcoes opcoes) {
        return enviarArquivo(config.telegramBotToken, config.googleApiKey, config.googleContaServico, chat, l.origem, l.driveId,
                l.arquivoUrl, l.arquivoNome, legenda, opcoes);
    }

    JsonNode enviarArquivo(String token, String chaveGoogle, String contaGoogle, Object chat, String origem, String driveId,
                           String arquivoUrl, String nome, String legenda, Telegram.Opcoes opcoes) {
        if (Livro.DRIVE.equals(origem)) {
            Path temp = drive.baixar(drive.credencial(chaveGoogle, contaGoogle), driveId);
            try {
                return telegram.enviarDocumento(token, chat, temp, nome, legenda, opcoes);
            } finally {
                try {
                    Files.deleteIfExists(temp);
                } catch (IOException ignorado) {
                    // temporário
                }
            }
        }
        Path local = arquivo(arquivoUrl);
        if (!Files.isRegularFile(local)) throw new Telegram.ErroTelegram("O arquivo do livro não está mais no servidor");
        return telegram.enviarDocumento(token, chat, local, nome, legenda, opcoes);
    }
}
