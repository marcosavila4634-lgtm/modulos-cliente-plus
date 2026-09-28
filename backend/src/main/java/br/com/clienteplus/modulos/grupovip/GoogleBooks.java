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
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import org.eclipse.microprofile.config.inject.ConfigProperty;

// Consulta ao Google Books (https://developers.google.com/books): acha autor,
// gênero, capa e resumo de um livro pelo título. Funciona sem chave (com
// limite diário menor); com a chave do Google da Biblioteca, se a Books API
// estiver ativada nela.
@ApplicationScoped
public class GoogleBooks {

    public static class ErroBooks extends RuntimeException {
        // o Google pediu para ir mais devagar (ou está fora do ar): tentar depois
        public final boolean tentarDepois;
        // a chave não serve para a Books API: tentar sem a chave
        public final boolean chaveRecusada;

        public ErroBooks(String mensagem, boolean tentarDepois, boolean chaveRecusada) {
            super(mensagem);
            this.tentarDepois = tentarDepois;
            this.chaveRecusada = chaveRecusada;
        }
    }

    public record Volume(String titulo, List<String> autores, List<String> categorias, String descricao, String capa,
                         Integer ano) {}

    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    @Inject
    ObjectMapper json;

    // Endereço da API (trocado só para testes).
    @ConfigProperty(name = "grupo-vip.google-books-api", defaultValue = "https://www.googleapis.com/books/v1/volumes")
    String api;

    // q no formato do Google: intitle:dom casmurro inauthor:machado
    public List<Volume> buscar(String q, String chave) {
        String url = api + "?q=" + URLEncoder.encode(q, StandardCharsets.UTF_8) + "&maxResults=5&printType=books"
                + (chave != null && !chave.isBlank() ? "&key=" + URLEncoder.encode(chave, StandardCharsets.UTF_8) : "");
        JsonNode r;
        try {
            HttpRequest req = HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(20)).GET().build();
            HttpResponse<String> res = HTTP.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (res.statusCode() != 200) throw erro(res.statusCode(), res.body());
            r = json.readTree(res.body());
        } catch (IOException e) {
            throw new ErroBooks("Sem conexão com o Google Books: " + e.getMessage(), true, false);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ErroBooks("Consulta interrompida", true, false);
        }
        List<Volume> volumes = new ArrayList<>();
        for (JsonNode item : r.path("items")) {
            JsonNode v = item.path("volumeInfo");
            String titulo = v.path("title").asText("");
            if (titulo.isBlank()) continue;
            String capa = v.path("imageLinks").path("thumbnail").asText(null);
            if (capa != null) capa = capa.replaceFirst("^http://", "https://");
            String data = v.path("publishedDate").asText("");
            Integer ano = data.matches("\\d{4}.*") ? Integer.valueOf(data.substring(0, 4)) : null;
            volumes.add(new Volume(titulo, textos(v.path("authors")), textos(v.path("categories")),
                    v.path("description").asText(null), capa, ano));
        }
        return volumes;
    }

    private static List<String> textos(JsonNode lista) {
        List<String> r = new ArrayList<>();
        for (JsonNode n : lista) {
            if (!n.asText("").isBlank()) r.add(n.asText().trim());
        }
        return r;
    }

    private ErroBooks erro(int status, String corpo) {
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
        boolean chave = t.contains("api key") || t.contains("keyinvalid") || t.contains("has not been used")
                || t.contains("disabled") || t.contains("accessnotconfigured") || t.contains("blocked")
                || t.contains("api_key");
        if (chave) return new ErroBooks("A chave do Google não está liberada para a Books API", false, true);
        if (status == 429 || t.contains("ratelimit") || t.contains("quota")) {
            return new ErroBooks("Muitas consultas ao Google Books: tentando de novo daqui a pouco", true, false);
        }
        return new ErroBooks("Google Books: " + (mensagem.isBlank() ? "erro " + status : mensagem), status >= 500, false);
    }
}
