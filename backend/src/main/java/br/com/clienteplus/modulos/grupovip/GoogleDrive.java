package br.com.clienteplus.modulos.grupovip;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.eclipse.microprofile.config.inject.ConfigProperty;

// Leitura de pastas PÚBLICAS do Google Drive ("qualquer pessoa com o link")
// com uma chave de API do Google (Drive API v3). Lista os arquivos da pasta
// (e das subpastas) e baixa cada um.
//
// No projeto principal: a chave vira segredo da Edge Function; para pastas
// privadas seria preciso login com a conta Google (OAuth).
@ApplicationScoped
public class GoogleDrive {

    public static class ErroDrive extends RuntimeException {
        // o Google pediu para ir mais devagar: tentar de novo depois
        public final boolean tentarDepois;

        public ErroDrive(String mensagem, boolean tentarDepois) {
            super(mensagem);
            this.tentarDepois = tentarDepois;
        }
    }

    // pasta: caminho da subpasta dentro da pasta escolhida ("" = na raiz)
    public record ArquivoDrive(String id, String nome, long tamanho, String md5, String pasta) {}

    public record Pasta(String id, String nome) {}

    private static final String PASTA = "application/vnd.google-apps.folder";
    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();
    private static final Pattern ID_NA_URL = Pattern.compile("(?:/folders/|[?&]id=)([A-Za-z0-9_-]{10,})");

    @Inject
    ObjectMapper json;

    // Endereço da Drive API (trocado só para testes).
    @ConfigProperty(name = "grupo-vip.google-drive-api", defaultValue = "https://www.googleapis.com/drive/v3/files")
    String api;

    // Aceita o link da pasta (drive.google.com/drive/folders/<id>) ou só o id.
    public static String idDaPasta(String link) {
        if (link == null) return null;
        String l = link.trim();
        Matcher m = ID_NA_URL.matcher(l);
        if (m.find()) return m.group(1);
        return l.matches("[A-Za-z0-9_-]{20,}") ? l : null;
    }

    public Pasta pasta(String chave, String id) {
        JsonNode r = pedir(api + "/" + id + "?fields=id,name,mimeType&supportsAllDrives=true&key=" + enc(chave));
        if (!PASTA.equals(r.path("mimeType").asText())) throw new ErroDrive("Este link é de um arquivo, não de uma pasta", false);
        return new Pasta(r.path("id").asText(), r.path("name").asText());
    }

    // Todos os arquivos da pasta e das subpastas (até "limite" arquivos).
    public List<ArquivoDrive> listar(String chave, String pastaId, int limite) {
        List<ArquivoDrive> arquivos = new ArrayList<>();
        Deque<String[]> pastas = new ArrayDeque<>(); // [id, caminho]
        pastas.add(new String[] {pastaId, ""});
        int pastasVistas = 0;
        while (!pastas.isEmpty() && arquivos.size() < limite && pastasVistas < 2000) {
            String[] atual = pastas.poll();
            pastasVistas++;
            String pagina = null;
            do {
                String q = "'" + atual[0] + "' in parents and trashed = false";
                String url = api + "?q=" + enc(q)
                        + "&fields=" + enc("nextPageToken,files(id,name,mimeType,size,md5Checksum)")
                        + "&pageSize=1000&orderBy=name&supportsAllDrives=true&includeItemsFromAllDrives=true&key=" + enc(chave)
                        + (pagina != null ? "&pageToken=" + enc(pagina) : "");
                JsonNode r = pedir(url);
                for (JsonNode f : r.path("files")) {
                    String tipo = f.path("mimeType").asText();
                    String nome = f.path("name").asText();
                    if (PASTA.equals(tipo)) {
                        pastas.add(new String[] {f.path("id").asText(), atual[1].isEmpty() ? nome : atual[1] + " / " + nome});
                    } else if (!tipo.startsWith("application/vnd.google-apps.")) { // Documentos Google não dá para baixar como arquivo
                        arquivos.add(new ArquivoDrive(f.path("id").asText(), nome, f.path("size").asLong(0),
                                f.hasNonNull("md5Checksum") ? f.path("md5Checksum").asText() : null, atual[1]));
                    }
                }
                pagina = r.hasNonNull("nextPageToken") ? r.path("nextPageToken").asText() : null;
            } while (pagina != null && arquivos.size() < limite);
        }
        return arquivos.size() > limite ? arquivos.subList(0, limite) : arquivos;
    }

    // Baixa o arquivo para um arquivo temporário (quem chamou apaga depois).
    public Path baixar(String chave, String arquivoId) {
        Path temp = null;
        try {
            temp = Files.createTempFile("livro-", ".tmp");
            HttpRequest req = HttpRequest.newBuilder(URI.create(api + "/" + arquivoId
                            + "?alt=media&supportsAllDrives=true&acknowledgeAbuse=false&key=" + enc(chave)))
                    .timeout(Duration.ofMinutes(10))
                    .GET()
                    .build();
            HttpResponse<Path> res = HTTP.send(req, HttpResponse.BodyHandlers.ofFile(temp));
            if (res.statusCode() != 200) {
                String corpo = Files.readString(temp, StandardCharsets.UTF_8);
                Files.deleteIfExists(temp);
                throw erro(res.statusCode(), corpo);
            }
            return temp;
        } catch (IOException e) {
            apagar(temp);
            throw new ErroDrive("Sem conexão com o Google Drive: " + e.getMessage(), true);
        } catch (InterruptedException e) {
            apagar(temp);
            Thread.currentThread().interrupt();
            throw new ErroDrive("Download interrompido", true);
        }
    }

    private static void apagar(Path p) {
        try {
            if (p != null) Files.deleteIfExists(p);
        } catch (IOException ignorado) {
            // arquivo temporário: o sistema limpa depois
        }
    }

    private JsonNode pedir(String url) {
        try {
            HttpRequest req = HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(30)).GET().build();
            HttpResponse<String> res = HTTP.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (res.statusCode() != 200) throw erro(res.statusCode(), res.body());
            return json.readTree(res.body());
        } catch (IOException e) {
            throw new ErroDrive("Sem conexão com o Google Drive: " + e.getMessage(), true);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ErroDrive("Consulta interrompida", true);
        }
    }

    // Erros mais comuns do Google, em português.
    private ErroDrive erro(int status, String corpo) {
        String mensagem = "";
        String motivo = "";
        try {
            JsonNode e = json.readTree(corpo).path("error");
            mensagem = e.path("message").asText("");
            motivo = e.path("errors").path(0).path("reason").asText(e.path("status").asText(""));
        } catch (IOException ignorado) {
            // resposta que não é JSON
        }
        String t = (mensagem + " " + motivo).toLowerCase();
        if (t.contains("api key not valid") || t.contains("api_key_invalid") || t.contains("keyinvalid")) {
            return new ErroDrive("Chave do Google inválida: confira a chave em Biblioteca › Chave do Google", false);
        }
        if (t.contains("has not been used") || t.contains("disabled") || t.contains("accessnotconfigured")) {
            return new ErroDrive("A Google Drive API está desligada no projeto da chave: ative em console.cloud.google.com"
                    + " › APIs e serviços › Biblioteca › Google Drive API", false);
        }
        if (status == 429 || t.contains("ratelimitexceeded") || t.contains("userratelimitexceeded")) {
            return new ErroDrive("Muitos pedidos ao Google: tentando de novo daqui a pouco", true);
        }
        if (t.contains("downloadquotaexceeded") || t.contains("cannotdownload")) {
            return new ErroDrive("O Google bloqueou o download deste arquivo (muitos downloads). Tente mais tarde.", false);
        }
        if (status == 404 || t.contains("notfound")) {
            return new ErroDrive("Não encontrado: a pasta precisa estar compartilhada como \"Qualquer pessoa com o link\"", false);
        }
        if (status == 403) {
            return new ErroDrive("Sem permissão: compartilhe a pasta como \"Qualquer pessoa com o link\" (" + mensagem + ")", false);
        }
        return new ErroDrive("Google Drive: " + (mensagem.isBlank() ? "erro " + status : mensagem), status >= 500);
    }

    private static String enc(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }
}
