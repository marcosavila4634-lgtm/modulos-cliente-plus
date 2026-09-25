package br.com.clienteplus.modulos.comum;

import io.vertx.ext.web.Router;
import io.vertx.ext.web.handler.FileSystemAccess;
import io.vertx.ext.web.handler.StaticHandler;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

// Envio de imagens e vídeos (ex.: dos exercícios).
//
// No laboratório os arquivos ficam na pasta backend/data/uploads e são
// servidos em /api/arquivos/<nome>. No projeto principal: Supabase Storage
// (a URL gravada no banco passa a ser a do bucket).
@Path("/arquivos")
@ApplicationScoped
public class Arquivos {

    public record ArquivoEnviado(String url, String nome, String tipo) {}

    private record Formato(String tipo, long limiteBytes) {}

    private static final long MB = 1024 * 1024;

    // extensão -> tipo ("imagem" ou "video") e tamanho máximo
    private static final Map<String, Formato> FORMATOS = Map.of(
            "jpg", new Formato("imagem", 8 * MB),
            "jpeg", new Formato("imagem", 8 * MB),
            "png", new Formato("imagem", 8 * MB),
            "webp", new Formato("imagem", 8 * MB),
            "gif", new Formato("imagem", 8 * MB),
            "mp4", new Formato("video", 100 * MB),
            "webm", new Formato("video", 100 * MB),
            "mov", new Formato("video", 100 * MB));

    @ConfigProperty(name = "modulos.uploads-dir")
    String pasta;

    // Serve os arquivos enviados (aceita "Range", para o vídeo poder avançar).
    void rotas(@Observes Router router) throws IOException {
        java.nio.file.Path dir = Paths.get(pasta).toAbsolutePath();
        Files.createDirectories(dir);
        router.route("/api/arquivos/*")
                .order(-100)
                .handler(StaticHandler.create(FileSystemAccess.ROOT, dir.toString())
                        .setCachingEnabled(false)
                        .setDirectoryListing(false));
    }

    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    public ArquivoEnviado enviar(@RestForm("arquivo") FileUpload arquivo) {
        if (arquivo == null) throw Erro.invalido("Escolha um arquivo");
        String original = arquivo.fileName() != null ? arquivo.fileName() : "";
        int ponto = original.lastIndexOf('.');
        String extensao = ponto >= 0 ? original.substring(ponto + 1).toLowerCase(Locale.ROOT) : "";
        Formato formato = FORMATOS.get(extensao);
        if (formato == null) {
            throw Erro.invalido("Formato não aceito. Imagens: JPG, PNG, WEBP ou GIF. Vídeos: MP4, WEBM ou MOV.");
        }
        if (arquivo.size() > formato.limiteBytes()) {
            throw Erro.invalido("Arquivo grande demais: " + formato.tipo() + " até "
                    + formato.limiteBytes() / MB + " MB");
        }

        String nome = UUID.randomUUID() + "." + extensao;
        try {
            Files.copy(arquivo.uploadedFile(), Paths.get(pasta).toAbsolutePath().resolve(nome),
                    StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        return new ArquivoEnviado("/api/arquivos/" + nome, original, formato.tipo());
    }
}
