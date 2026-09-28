package br.com.clienteplus.modulos.grupovip;

import io.quarkus.logging.Log;
import io.quarkus.narayana.jta.QuarkusTransaction;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.StreamingOutput;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Map;
import java.util.Set;

// Link temporário de um livro (LinksDeLivro.java): confere o acesso e entrega
// o arquivo. ?ler=1 abre no navegador (PDF, vídeo, imagem...); sem isso, baixa.
@Path("/grupo-vip/l/{token}")
public class LivroLinkResource {

    @Inject
    LinksDeLivro links;

    @Inject
    GoogleDrive drive;

    @Inject
    Biblioteca biblioteca;

    private static final Map<String, String> TIPOS = Map.ofEntries(
            Map.entry("pdf", "application/pdf"),
            Map.entry("epub", "application/epub+zip"),
            Map.entry("mobi", "application/x-mobipocket-ebook"),
            Map.entry("txt", "text/plain; charset=utf-8"),
            Map.entry("mp3", "audio/mpeg"),
            Map.entry("m4a", "audio/mp4"),
            Map.entry("m4b", "audio/mp4"),
            Map.entry("mp4", "video/mp4"),
            Map.entry("webm", "video/webm"),
            Map.entry("jpg", "image/jpeg"),
            Map.entry("jpeg", "image/jpeg"),
            Map.entry("png", "image/png"),
            Map.entry("webp", "image/webp"),
            Map.entry("gif", "image/gif"),
            Map.entry("zip", "application/zip"));

    // o navegador mostra sozinho (?ler=1); o resto sempre baixa
    static final Set<String> ABRE_NO_NAVEGADOR = Set.of("pdf", "txt", "mp3", "m4a", "mp4", "webm", "jpg", "jpeg", "png", "webp", "gif");

    @GET
    public Response abrir(@PathParam("token") String token, @QueryParam("ler") String ler) {
        LinksDeLivro.Clique c = QuarkusTransaction.requiringNew().call(() -> links.conferir(token));
        if (c.motivo() != null) return recusa(c);
        LinksDeLivro.Arquivo a = c.arquivo();
        String ext = Biblioteca.extensao(a.nome());
        boolean noNavegador = ler != null && !"0".equals(ler) && ABRE_NO_NAVEGADOR.contains(ext);
        Response.ResponseBuilder r;
        try {
            if (Livro.DRIVE.equals(a.origem())) {
                GoogleDrive.Download d = drive.abrir(drive.credencial(a.chaveGoogle(), a.contaGoogle()), a.driveId());
                StreamingOutput saida = out -> {
                    try (d) {
                        d.corpo().transferTo(out);
                    }
                };
                r = Response.ok(saida);
                if (d.tamanho() >= 0) r.header("Content-Length", d.tamanho());
            } else if (a.arquivoUrl() != null && Files.isRegularFile(biblioteca.arquivo(a.arquivoUrl()))) {
                java.nio.file.Path local = biblioteca.arquivo(a.arquivoUrl());
                r = Response.ok(local.toFile()).header("Content-Length", Files.size(local));
            } else {
                return pagina(404, "Arquivo indisponível", "Este arquivo não está mais disponível para download. Avise a equipe, por favor.",
                        null);
            }
        } catch (GoogleDrive.ErroDrive | IOException e) {
            Log.warnf("Biblioteca: link do livro %s falhou: %s", c.titulo(), e.getMessage());
            return pagina(503, "Não deu para abrir agora", "O arquivo não pôde ser buscado agora. Tente de novo em alguns minutos.", null);
        }
        return r.type(TIPOS.getOrDefault(ext, "application/octet-stream"))
                .header("Content-Disposition", (noNavegador ? "inline" : "attachment") + "; filename*=UTF-8''"
                        + URLEncoder.encode(a.nome(), StandardCharsets.UTF_8).replace("+", "%20"))
                .header("Cache-Control", "private, no-store")
                .header("X-Robots-Tag", "noindex")
                .build();
    }

    private static Response recusa(LinksDeLivro.Clique c) {
        return switch (c.motivo()) {
            case "expirado" -> pagina(410, "Este link expirou",
                    "Por segurança, cada link vale " + LinksDeLivro.HORAS + " horas. Peça de novo ao robô no Telegram"
                            + " e ele te manda um link novo.", null);
            case "sem_acesso" -> pagina(403, "Seu acesso não está ativo",
                    "A biblioteca é liberada só para quem está com a assinatura em dia. Veja sua situação e pague pela sua área"
                            + " de membro.", c.areaMembro());
            default -> pagina(404, "Link inválido", "Confira se o link foi copiado inteiro, ou peça de novo ao robô.", null);
        };
    }

    // Página simples, no tema escuro dos Grupos VIP.
    private static Response pagina(int status, String titulo, String texto, String botao) {
        String html = "<!doctype html><html lang=\"pt-BR\"><head><meta charset=\"utf-8\">"
                + "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>" + esc(titulo) + "</title>"
                + "<style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b1220;color:#e2e8f0;"
                + "font-family:system-ui,sans-serif;padding:16px}main{width:100%;max-width:420px;background:#111a2e;border:1px solid #1f2a44;"
                + "border-radius:16px;padding:28px;text-align:center}h1{font-size:20px;margin:8px 0 10px;color:#fff}"
                + "p{color:#94a3b8;line-height:1.5;margin:0}a{display:inline-block;margin-top:18px;background:#f97316;color:#fff;"
                + "text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600}</style></head><body><main>"
                + "<div style=\"font-size:36px\">📚</div><h1>" + esc(titulo) + "</h1><p>" + esc(texto) + "</p>"
                + (botao != null ? "<a href=\"" + esc(botao) + "\">Abrir minha área</a>" : "")
                + "</main></body></html>";
        return Response.status(status).type("text/html; charset=utf-8").entity(html).build();
    }

    private static String esc(String s) {
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
