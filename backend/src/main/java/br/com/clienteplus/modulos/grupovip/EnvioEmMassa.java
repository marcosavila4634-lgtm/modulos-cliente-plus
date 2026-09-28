package br.com.clienteplus.modulos.grupovip;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import io.quarkus.logging.Log;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

// Trabalho em segundo plano da Biblioteca (a cada segundo):
//
//   1. Lê as pastas do Google Drive dos envios novos (status "listando") e
//      cria os livros e a fila de arquivos. Na cópia entre grupos, lê 1
//      mensagem do grupo de origem por segundo (varrer).
//   2. Posta o próximo arquivo de cada envio em andamento, um a cada
//      INTERVALO_SEGUNDOS por grupo (o Telegram aceita ~20 por minuto no mesmo
//      grupo). Se o Telegram pedir para esperar, espera.
//
// Baixar/subir arquivos acontece FORA das transações do banco (pode demorar).
// Se o sistema for desligado, continua de onde parou ao ligar de novo.
@ApplicationScoped
public class EnvioEmMassa {

    @Inject
    Biblioteca biblioteca;

    @Inject
    GoogleDrive drive;

    @Inject
    Telegram telegram;

    @Inject
    Membros membros;

    @Scheduled(every = "1s", delayed = "15s", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void trabalhar() {
        OffsetDateTime agora = OffsetDateTime.now();
        record Leitura(UUID id, String origem) {}
        List<Leitura> ler = QuarkusTransaction.requiringNew().call(() -> Importacao.<Importacao>list(
                        "status = ?1 and (proximoEm is null or proximoEm <= ?2) order by createdAt", Importacao.LISTANDO, agora)
                .stream()
                .map(i -> new Leitura(i.id, i.origem))
                .toList());
        for (Leitura l : ler) {
            try {
                if (Livro.TELEGRAM.equals(l.origem())) varrer(l.id());
                else listarPasta(l.id());
            } catch (Exception e) {
                Log.warnf("Biblioteca: erro ao ler a origem: %s", e.getMessage());
            }
        }

        // Um envio por grupo de cada vez (o limite do Telegram é por grupo).
        List<UUID> prontos = QuarkusTransaction.requiringNew().call(() -> {
            Set<UUID> grupos = new HashSet<>();
            return Importacao.<Importacao>list("status = ?1 order by createdAt", Importacao.ENVIANDO).stream()
                    .filter(i -> grupos.add(i.grupo.id))
                    .filter(i -> i.proximoEm == null || !i.proximoEm.isAfter(OffsetDateTime.now()))
                    .map(i -> i.id)
                    .toList();
        });
        for (UUID id : prontos) {
            try {
                enviarProximo(id);
            } catch (Exception e) {
                Log.warnf("Biblioteca: erro no envio em massa: %s", e.getMessage());
            }
        }
    }

    // ---------- 1. Ler a pasta do Drive ----------

    private void listarPasta(UUID id) {
        record Pedido(String chave, String conta, String pastaId) {}
        Pedido p = QuarkusTransaction.requiringNew().call(() -> {
            Importacao imp = Importacao.findById(id);
            Config config = membros.config(imp.storeId);
            return new Pedido(config.googleApiKey, config.googleContaServico, GoogleDrive.idDaPasta(imp.pastaUrl));
        });
        GoogleDrive.Pasta pasta;
        List<GoogleDrive.ArquivoDrive> arquivos;
        try {
            GoogleDrive.Credencial c = drive.credencial(p.chave(), p.conta());
            pasta = drive.pasta(c, p.pastaId());
            arquivos = drive.listar(c, p.pastaId(), Biblioteca.MAX_ARQUIVOS);
        } catch (GoogleDrive.ErroDrive e) {
            QuarkusTransaction.requiringNew().run(() -> {
                Importacao imp = Importacao.findById(id);
                imp.erro = e.getMessage();
                if (e.tentarDepois) imp.proximoEm = OffsetDateTime.now().plusMinutes(1);
                else imp.status = Importacao.FALHOU;
            });
            return;
        }
        // Pasta grande (milhares de arquivos): dá mais tempo para gravar a fila.
        QuarkusTransaction.requiringNew().timeout(600).run(() -> {
            Importacao imp = Importacao.findById(id);
            if (imp == null || !Importacao.LISTANDO.equals(imp.status)) return; // pausado ou excluído enquanto lia
            imp.pastaNome = pasta.nome();
            criarFila(imp, arquivos);
            if (arquivos.isEmpty()) {
                imp.status = Importacao.FALHOU;
                imp.erro = "A pasta está vazia (ou só tem Documentos Google, que não são arquivos)";
            } else {
                Biblioteca.seguir(imp);
            }
        });
    }

    private void criarFila(Importacao imp, List<GoogleDrive.ArquivoDrive> arquivos) {
        List<GoogleDrive.ArquivoDrive> ordem = arquivos.stream()
                .sorted(Comparator.comparing(GoogleDrive.ArquivoDrive::pasta).thenComparing(GoogleDrive.ArquivoDrive::nome))
                .toList();
        Map<String, Livro> nestaPasta = new HashMap<>(); // o mesmo arquivo repetido na pasta
        List<String> aceitas = Biblioteca.extensoes(Config.<Config>find("storeId", imp.storeId).firstResult());
        int n = 0;
        for (GoogleDrive.ArquivoDrive a : ordem) {
            ImportacaoItem item = biblioteca.novoItem(imp, a.pasta().isEmpty() ? a.nome() : a.pasta() + " / " + a.nome(), a.tamanho(), n++);
            String ext = Biblioteca.extensao(a.nome());
            String chave = a.md5() != null ? a.md5() : "drive:" + a.id();
            if (!aceitas.contains(ext)) {
                item.status = ImportacaoItem.PULADO;
                item.erro = "Formato não aceito (." + ext + ")";
            } else if (nestaPasta.containsKey(chave)) {
                item.status = ImportacaoItem.PULADO;
                item.erro = "Arquivo repetido na pasta";
                item.livro = nestaPasta.get(chave);
            } else {
                Livro l = a.md5() != null
                        ? Livro.<Livro>find("grupo = ?1 and md5 = ?2", imp.grupo, a.md5()).firstResult()
                        : Livro.<Livro>find("grupo = ?1 and driveId = ?2", imp.grupo, a.id()).firstResult();
                boolean novo = l == null;
                if (novo) {
                    l = biblioteca.novoLivro(imp, a.nome(), a.tamanho(), a.md5(), a.pasta());
                    l.origem = Livro.DRIVE;
                    l.driveId = a.id();
                    l.persist();
                }
                nestaPasta.put(chave, l);
                if (a.tamanho() > Biblioteca.TAMANHO_MAXIMO) {
                    // não cabe no Telegram: fica na biblioteca e o robô entrega um link temporário
                    item.livro = l;
                    item.status = ImportacaoItem.GRANDE_DEMAIS;
                    item.erro = "Acima de 50 MB: não vai para o grupo, mas o robô entrega um link temporário";
                } else {
                    biblioteca.destinoDoItem(imp, item, l, novo);
                }
            }
            item.persist();
        }
        ImportacaoItem.flush();
    }

    // ---------- 1b. Ler o grupo de origem (cópia entre grupos) ----------

    // Encaminha a próxima mensagem do grupo de origem para o privado do dono
    // (é o único jeito de o robô ver o que tem nela), apaga na hora e, se for
    // arquivo, põe na fila para copiar.
    private void varrer(UUID id) {
        record Passo(String token, Long dono, String origemChat, long mensagem, boolean fim, boolean jaConhecida) {}
        Passo p = QuarkusTransaction.requiringNew().call(() -> {
            Importacao imp = Importacao.findById(id);
            Config config = membros.config(imp.storeId);
            long atual = imp.varreduraAtual;
            if (atual > imp.varreduraAte) return new Passo(null, null, null, atual, true, false);
            // posts do próprio robô (livros e conteúdos) já estão no catálogo ou em Conteúdos
            boolean conhecida = ImportacaoItem.count("importacao.grupo = ?1 and telegramMessageId = ?2", imp.origemGrupo, atual) > 0
                    || ConteudoGrupo.count("grupo = ?1 and telegramMessageId = ?2", imp.origemGrupo, atual) > 0;
            if (!imp.origemGrupo.automatico(config) || config.telegramDonoId == null) {
                imp.status = Importacao.PAUSADA;
                imp.erro = config.telegramDonoId == null
                        ? "Conecte o seu Telegram de dono ao robô e continue"
                        : "O robô não cuida mais do grupo " + imp.origemGrupo.nome + ": confira o robô e o ID do grupo e continue";
                return null;
            }
            return new Passo(config.telegramBotToken, config.telegramDonoId, imp.origemGrupo.telegramChatId, atual, false, conhecida);
        });
        if (p == null) return;
        if (p.fim()) {
            QuarkusTransaction.requiringNew().run(() -> {
                Importacao imp = Importacao.findById(id);
                imp.pastaNome = null;
                if (ImportacaoItem.count("importacao", imp) == 0) {
                    imp.status = Importacao.FALHOU;
                    imp.erro = imp.protegidas > 0
                            ? "Nenhum arquivo pôde ser copiado: o grupo de origem está com o conteúdo protegido. No Telegram, abra o grupo"
                                    + " › Editar › Tipo de grupo › desligue \"Restringir conteúdo salvo\" e tente de novo."
                            : "Nenhum arquivo encontrado nessas mensagens";
                } else {
                    Biblioteca.seguir(imp);
                }
            });
            return;
        }

        JsonNode msg = null;
        String erro = null;
        int esperar = 0;
        boolean protegida = false;
        if (!p.jaConhecida()) {
            try {
                msg = telegram.encaminhar(p.token(), p.origemChat(), p.mensagem(), p.dono());
                try {
                    telegram.apagarMensagem(p.token(), p.dono(), msg.path("message_id").asLong());
                } catch (Telegram.ErroTelegram ignorado) {
                    // fica no privado do dono; não atrapalha
                }
            } catch (Telegram.ErroTelegram e) {
                String t = e.original.toLowerCase();
                if (e.esperarSegundos > 0) esperar = e.esperarSegundos;
                else if (t.contains("not found") || t.contains("message_id_invalid") || t.contains("message to forward")
                        || t.contains("can't be forwarded") && !t.contains("protected")) {
                    // mensagem apagada, de serviço ou que não existe: segue
                } else if (t.contains("protected") || t.contains("can't be forwarded") || t.contains("chat_forwards_restricted")) {
                    protegida = true;
                } else {
                    erro = e.getMessage();
                }
            }
        }

        JsonNode m = msg;
        String falha = erro;
        int espera = esperar;
        boolean prot = protegida;
        QuarkusTransaction.requiringNew().run(() -> {
            Importacao imp = Importacao.findById(id);
            if (imp == null || !Importacao.LISTANDO.equals(imp.status)) return;
            if (espera > 0) {
                imp.proximoEm = OffsetDateTime.now().plusSeconds(espera + 1);
                return;
            }
            if (falha != null) { // ex.: o robô perdeu o acesso ao grupo
                imp.status = Importacao.FALHOU;
                imp.erro = falha;
                return;
            }
            if (prot) imp.protegidas++;
            if (m != null) guardarMensagem(imp, p.mensagem(), m);
            imp.varreduraAtual = p.mensagem() + 1;
            imp.proximoEm = OffsetDateTime.now().plusSeconds(1); // ~1 mensagem por segundo no privado do dono
        });
    }

    // Arquivo (documento) vira livro nas bibliotecas dos dois grupos; foto,
    // vídeo e áudio só são copiados se o dono pediu.
    private void guardarMensagem(Importacao imp, long mensagem, JsonNode m) {
        JsonNode doc = m.path("document");
        String tipo = doc.isMissingNode()
                ? (m.has("photo") ? "Foto" : m.has("video") ? "Vídeo" : m.has("audio") ? "Áudio" : m.has("voice") ? "Áudio"
                        : m.has("animation") ? "GIF" : null)
                : "documento";
        if (tipo == null) return; // texto, figurinha, enquete...
        if (!"documento".equals(tipo) && !imp.copiarMidias) return;
        int ordem = (int) ImportacaoItem.count("importacao", imp);

        if (!"documento".equals(tipo)) {
            String legenda = m.path("caption").asText("");
            ImportacaoItem item = biblioteca.novoItem(imp,
                    tipo + " (mensagem " + mensagem + ")" + (legenda.isBlank() ? "" : " · " + resumo(legenda)),
                    tamanhoDaMidia(m), ordem);
            item.origemMensagemId = mensagem;
            item.persist();
            return;
        }

        String nome = doc.path("file_name").asText("arquivo-" + mensagem);
        long tamanho = doc.path("file_size").asLong(0);
        String chave = "tg:" + doc.path("file_unique_id").asText();
        ImportacaoItem item = biblioteca.novoItem(imp, nome, tamanho, ordem);
        item.origemMensagemId = mensagem;
        // no grupo de origem (para o robô bibliotecário de lá também)
        if (Livro.count("grupo = ?1 and md5 = ?2", imp.origemGrupo, chave) == 0) {
            Livro l = novoLivro(imp.origemGrupo, nome, tamanho, chave, doc.path("file_id").asText());
            l.persist();
        }
        Livro l = Livro.<Livro>find("grupo = ?1 and md5 = ?2", imp.grupo, chave).firstResult();
        boolean novo = l == null;
        if (novo) {
            l = novoLivro(imp.grupo, nome, tamanho, chave, doc.path("file_id").asText());
            l.persist();
        } else if (ImportacaoItem.count("importacao = ?1 and livro = ?2", imp, l) > 0) {
            item.status = ImportacaoItem.PULADO; // o mesmo arquivo repetido no grupo de origem
            item.erro = "Arquivo repetido no grupo de origem";
            item.livro = l;
            item.persist();
            return;
        }
        biblioteca.destinoDoItem(imp, item, l, novo);
        item.persist();
    }

    private static Livro novoLivro(Grupo grupo, String nome, long tamanho, String chave, String fileId) {
        Livro l = new Livro();
        l.storeId = grupo.storeId;
        l.grupo = grupo;
        l.arquivoNome = nome;
        l.tamanho = tamanho;
        l.origem = Livro.TELEGRAM;
        l.md5 = chave;
        l.telegramFileId = fileId;
        Config config = Config.<Config>find("storeId", grupo.storeId).firstResult();
        Catalogador.preparar(l, null, config != null && config.materiais());
        return l;
    }

    private static long tamanhoDaMidia(JsonNode m) {
        JsonNode foto = m.path("photo");
        if (foto.isArray() && !foto.isEmpty()) return foto.get(foto.size() - 1).path("file_size").asLong(0);
        for (String campo : List.of("video", "audio", "voice", "animation")) {
            if (m.has(campo)) return m.path(campo).path("file_size").asLong(0);
        }
        return 0;
    }

    private static String resumo(String texto) {
        String t = texto.replaceAll("\\s+", " ").trim();
        return t.length() > 60 ? t.substring(0, 57) + "..." : t;
    }

    // ---------- 2. Postar o próximo arquivo ----------

    // origemChat/origemMensagem: cópia entre grupos (copyMessage)
    private record Envio(UUID itemId, UUID livroId, String token, String chaveGoogle, String contaGoogle, String chat, Long topico, boolean proteger,
                         String fileId, String origem, String driveId, String arquivoUrl, String nome, String legenda,
                         String origemChat, Long origemMensagem) {}

    private void enviarProximo(UUID id) {
        Envio e = QuarkusTransaction.requiringNew().call(() -> {
            Importacao imp = Importacao.findById(id);
            Config config = membros.config(imp.storeId);
            if (!imp.grupo.automatico(config)) {
                imp.status = Importacao.PAUSADA;
                imp.erro = "O robô não cuida mais do grupo " + imp.grupo.nome + ": confira o robô e o ID do grupo e continue";
                return null;
            }
            ImportacaoItem item = ImportacaoItem.<ImportacaoItem>find("importacao = ?1 and status = ?2 order by ordem", imp,
                    ImportacaoItem.PENDENTE).firstResult();
            if (item == null) {
                Biblioteca.seguir(imp);
                return null;
            }
            Livro l = item.livro;
            Long topico = imp.topico != null ? imp.topico.threadId : null;
            if (item.origemMensagemId != null) {
                if (imp.origemGrupo == null || !imp.origemGrupo.automatico(config)) {
                    imp.status = Importacao.PAUSADA;
                    imp.erro = "O robô não está mais no grupo de origem: confira e continue";
                    return null;
                }
                return new Envio(item.id, l != null ? l.id : null, config.telegramBotToken, null, null, imp.grupo.telegramChatId, topico,
                        imp.grupo.protegerConteudo, null, null, null, null, item.arquivoNome, null,
                        imp.origemGrupo.telegramChatId, item.origemMensagemId);
            }
            if (l == null) { // livro excluído enquanto estava na fila
                item.status = ImportacaoItem.PULADO;
                item.erro = "Arquivo excluído da biblioteca";
                return null;
            }
            String legenda = "📚 <b>" + Telegram.html(l.titulo) + "</b>";
            return new Envio(item.id, l.id, config.telegramBotToken, config.googleApiKey, config.googleContaServico, imp.grupo.telegramChatId,
                    topico, imp.grupo.protegerConteudo, l.telegramFileId, l.origem,
                    l.driveId, l.arquivoUrl, l.arquivoNome, legenda, null, null);
        });
        if (e == null) return;

        Telegram.Opcoes opcoes = new Telegram.Opcoes(e.topico(), e.proteger(), List.of());
        JsonNode msg = null;
        String erro = null;
        int esperar = 0;
        try {
            if (e.origemMensagem() != null) {
                long novo = telegram.copiar(e.token(), e.origemChat(), e.origemMensagem(), e.chat(), opcoes);
                msg = JsonNodeFactory.instance.objectNode().put("message_id", novo);
            } else msg = e.fileId() != null
                    ? telegram.enviarDocumentoPorId(e.token(), e.chat(), e.fileId(), e.legenda(), opcoes)
                    : biblioteca.enviarArquivo(e.token(), e.chaveGoogle(), e.contaGoogle(), e.chat(), e.origem(), e.driveId(), e.arquivoUrl(),
                            e.nome(), e.legenda(), opcoes);
        } catch (Telegram.ErroTelegram ex) {
            erro = ex.getMessage();
            esperar = ex.esperarSegundos;
        } catch (GoogleDrive.ErroDrive ex) {
            erro = ex.getMessage();
            esperar = ex.tentarDepois ? 60 : 0;
        } catch (RuntimeException ex) {
            erro = "Erro ao enviar: " + ex.getMessage();
        }

        JsonNode resposta = msg;
        String falha = erro;
        int espera = esperar;
        QuarkusTransaction.requiringNew().run(() -> {
            Importacao imp = Importacao.findById(id);
            ImportacaoItem item = ImportacaoItem.findById(e.itemId());
            if (imp == null || item == null) return;
            if (espera > 0) { // o Telegram (ou o Google) pediu para esperar: o item continua na fila
                imp.proximoEm = OffsetDateTime.now().plusSeconds(espera + 1);
                imp.erro = falha;
                return;
            }
            imp.proximoEm = OffsetDateTime.now().plusSeconds(Biblioteca.INTERVALO_SEGUNDOS);
            imp.erro = null;
            if (falha != null) {
                item.status = ImportacaoItem.FALHOU;
                item.erro = falha;
                return;
            }
            item.status = ImportacaoItem.ENVIADO;
            item.enviadoEm = OffsetDateTime.now();
            item.telegramMessageId = resposta.path("message_id").asLong();
            Livro l = e.livroId() != null ? Livro.findById(e.livroId()) : null;
            if (l != null && l.telegramFileId == null) l.telegramFileId = resposta.path("document").path("file_id").asText(null);
        });
    }
}
