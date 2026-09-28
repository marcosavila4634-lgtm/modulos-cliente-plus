package br.com.clienteplus.modulos.grupovip;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.io.InputStream;
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

// Leitura de pastas do Google Drive (Drive API v3). Lista os arquivos da
// pasta (e das subpastas) e baixa cada um. Dois jeitos de entrar:
//
//   conta de serviço (recomendado): a pasta fica PRIVADA, compartilhada só
//     com o e-mail da conta de serviço (ContaServicoGoogle.java)
//   chave de API: só pastas PÚBLICAS ("qualquer pessoa com o link")
//
// Os membros nunca recebem o endereço do Drive: livros que não vão pelo
// Telegram saem por um link temporário do sistema (LinksDeLivro.java).
//
// No projeto principal: a chave/o JSON viram segredos da Edge Function.
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

    // Como entrar no Drive: passe da conta de serviço (token) ou chave de API.
    public record Credencial(String chave, String token) {}

    // pasta: caminho da subpasta dentro da pasta escolhida ("" = na raiz)
    public record ArquivoDrive(String id, String nome, long tamanho, String md5, String pasta) {}

    public record Pasta(String id, String nome) {}

    // Arquivo sendo baixado (quem chamou fecha o corpo). tamanho -1 = não informado.
    public record Download(InputStream corpo, long tamanho) implements AutoCloseable {
        @Override
        public void close() throws IOException {
            corpo.close();
        }
    }

    private static final String PASTA = "application/vnd.google-apps.folder";
    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();
    private static final Pattern ID_NA_URL = Pattern.compile("(?:/folders/|[?&]id=)([A-Za-z0-9_-]{10,})");

    @Inject
    ObjectMapper json;

    @Inject
    ContaServicoGoogle contaServico;

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

    public static boolean configurado(Config c) {
        return c.googleContaServico != null && !c.googleContaServico.isBlank()
                || c.googleApiKey != null && !c.googleApiKey.isBlank();
    }

    // Credencial da loja: a conta de serviço, se houver; senão a chave de API.
    // Pede o passe ao Google quando precisa (fazer FORA das transações).
    public Credencial credencial(String chave, String contaServicoJson) {
        if (contaServicoJson != null && !contaServicoJson.isBlank()) {
            return new Credencial(null, contaServico.token(contaServicoJson));
        }
        if (chave != null && !chave.isBlank()) return new Credencial(chave, null);
        throw new ErroDrive("Configure o acesso ao Google Drive em Biblioteca › Google", false);
    }

    public Pasta pasta(Credencial c, String id) {
        JsonNode r = pedir(c, api + "/" + id + "?fields=id,name,mimeType&supportsAllDrives=true");
        if (!PASTA.equals(r.path("mimeType").asText())) throw new ErroDrive("Este link é de um arquivo, não de uma pasta", false);
        return new Pasta(r.path("id").asText(), r.path("name").asText());
    }

    // Todos os arquivos da pasta e das subpastas (até "limite" arquivos).
    public List<ArquivoDrive> listar(Credencial c, String pastaId, int limite) {
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
                        + "&pageSize=1000&orderBy=name&supportsAllDrives=true&includeItemsFromAllDrives=true"
                        + (pagina != null ? "&pageToken=" + enc(pagina) : "");
                JsonNode r = pedir(c, url);
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
    public Path baixar(Credencial c, String arquivoId) {
        Path temp = null;
        try (Download d = abrirDownload(c, arquivoId)) {
            temp = Files.createTempFile("livro-", ".tmp");
            Files.copy(d.corpo(), temp, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            return temp;
        } catch (IOException e) {
            apagar(temp);
            throw new ErroDrive("Sem conexão com o Google Drive: " + e.getMessage(), true);
        }
    }

    // Abre o download para repassar direto a quem pediu (sem gravar no disco).
    public Download abrir(Credencial c, String arquivoId) {
        return abrirDownload(c, arquivoId);
    }

    private Download abrirDownload(Credencial c, String arquivoId) {
        try {
            HttpRequest req = requisicao(c, api + "/" + arquivoId + "?alt=media&supportsAllDrives=true&acknowledgeAbuse=false")
                    .timeout(Duration.ofMinutes(10))
                    .build();
            HttpResponse<InputStream> res = HTTP.send(req, HttpResponse.BodyHandlers.ofInputStream());
            if (res.statusCode() != 200) {
                String corpo;
                try (InputStream in = res.body()) {
                    corpo = new String(in.readAllBytes(), StandardCharsets.UTF_8);
                }
                throw erro(res.statusCode(), corpo, c);
            }
            return new Download(res.body(), res.headers().firstValueAsLong("Content-Length").orElse(-1));
        } catch (IOException e) {
            throw new ErroDrive("Sem conexão com o Google Drive: " + e.getMessage(), true);
        } catch (InterruptedException e) {
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

    // Chave de API vai no endereço; o passe da conta de serviço vai no cabeçalho.
    private static HttpRequest.Builder requisicao(Credencial c, String url) {
        HttpRequest.Builder b = HttpRequest.newBuilder(URI.create(c.token() == null ? url + "&key=" + enc(c.chave()) : url)).GET();
        if (c.token() != null) b.header("Authorization", "Bearer " + c.token());
        return b;
    }

    private JsonNode pedir(Credencial c, String url) {
        try {
            HttpRequest req = requisicao(c, url).timeout(Duration.ofSeconds(30)).build();
            HttpResponse<String> res = HTTP.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (res.statusCode() != 200) throw erro(res.statusCode(), res.body(), c);
            return json.readTree(res.body());
        } catch (IOException e) {
            throw new ErroDrive("Sem conexão com o Google Drive: " + e.getMessage(), true);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ErroDrive("Consulta interrompida", true);
        }
    }

    // Erros mais comuns do Google, em português.
    private ErroDrive erro(int status, String corpo, Credencial c) {
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
        String compartilhar = c.token() != null
                ? "compartilhe a pasta com o e-mail da conta de serviço (Biblioteca › Google)"
                : "compartilhe a pasta como \"Qualquer pessoa com o link\"";
        if (t.contains("api key not valid") || t.contains("api_key_invalid") || t.contains("keyinvalid")) {
            return new ErroDrive("Chave do Google inválida: confira a chave em Biblioteca › Google", false);
        }
        if (t.contains("has not been used") || t.contains("disabled") || t.contains("accessnotconfigured")) {
            return new ErroDrive("A Google Drive API está desligada no projeto: ative em console.cloud.google.com"
                    + " › APIs e serviços › Biblioteca › Google Drive API", false);
        }
        if (status == 429 || t.contains("ratelimitexceeded") || t.contains("userratelimitexceeded")) {
            return new ErroDrive("Muitos pedidos ao Google: tentando de novo daqui a pouco", true);
        }
        if (t.contains("downloadquotaexceeded") || t.contains("cannotdownload")) {
            return new ErroDrive("O Google bloqueou o download deste arquivo (muitos downloads). Tente mais tarde.", false);
        }
        if (status == 404 || t.contains("notfound")) return new ErroDrive("Não encontrado: " + compartilhar, false);
        if (status == 401) return new ErroDrive("O Google não aceitou o acesso: envie de novo o arquivo da conta de serviço", false);
        if (status == 403) return new ErroDrive("Sem permissão: " + compartilhar + " (" + mensagem + ")", false);
        return new ErroDrive("Google Drive: " + (mensagem.isBlank() ? "erro " + status : mensagem), status >= 500);
    }

    private static String enc(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }
}
