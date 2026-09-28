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
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.eclipse.microprofile.config.inject.ConfigProperty;

// Conta de serviço do Google: um "usuário robô" do Google que só enxerga as
// pastas do Drive compartilhadas com ele. Com ela a pasta dos livros fica
// PRIVADA (Restrito): nenhum link do Drive abre para quem não é o sistema.
//
// O dono cria a conta no Google Cloud, baixa o arquivo JSON da chave e envia
// na Biblioteca; depois compartilha a pasta com o e-mail da conta (Leitor).
// O sistema troca a chave por um passe de 1 hora (OAuth, JWT assinado com
// RS256) e usa esse passe na Drive API.
//
// No projeto principal: o JSON vira segredo da Edge Function.
@ApplicationScoped
public class ContaServicoGoogle {

    private static final HttpClient HTTP = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private static final String ESCOPO = "https://www.googleapis.com/auth/drive.readonly";

    private record Passe(String token, Instant expira) {}

    // e-mail da conta -> passe válido
    private final Map<String, Passe> passes = new ConcurrentHashMap<>();

    @Inject
    ObjectMapper json;

    // Endereço que troca a chave pelo passe (trocado só para testes).
    @ConfigProperty(name = "grupo-vip.google-token-api")
    Optional<String> enderecoToken;

    public record Dados(String email, String chavePrivada, String tokenUri) {}

    // Lê o JSON baixado do Google. Erro = arquivo errado.
    public Dados ler(String conteudo) {
        try {
            JsonNode j = json.readTree(conteudo);
            String email = j.path("client_email").asText("");
            String chave = j.path("private_key").asText("");
            if (!"service_account".equals(j.path("type").asText()) || email.isBlank() || chave.isBlank()) {
                throw new GoogleDrive.ErroDrive("Este não é o arquivo da conta de serviço: envie o JSON baixado em Contas de"
                        + " serviço › Chaves › Adicionar chave › JSON", false);
            }
            return new Dados(email, chave, j.path("token_uri").asText("https://oauth2.googleapis.com/token"));
        } catch (IOException e) {
            throw new GoogleDrive.ErroDrive("Arquivo inválido: envie o arquivo .json da conta de serviço", false);
        }
    }

    // Passe de acesso (renovado alguns minutos antes de vencer).
    public String token(String conteudo) {
        Dados d = ler(conteudo);
        Passe p = passes.get(d.email());
        if (p != null && p.expira().isAfter(Instant.now().plusSeconds(300))) return p.token();
        Passe novo = pedirPasse(d);
        passes.put(d.email(), novo);
        return novo.token();
    }

    public void esquecer(String conteudo) {
        try {
            passes.remove(ler(conteudo).email());
        } catch (GoogleDrive.ErroDrive ignorado) {
            // não era um JSON válido: nada guardado
        }
    }

    private Passe pedirPasse(Dados d) {
        String destino = enderecoToken.filter(s -> !s.isBlank()).orElse(d.tokenUri());
        long agora = Instant.now().getEpochSecond();
        String cabecalho = base64(("{\"alg\":\"RS256\",\"typ\":\"JWT\"}").getBytes(StandardCharsets.UTF_8));
        String corpo;
        try {
            corpo = base64(json.writeValueAsBytes(Map.of("iss", d.email(), "scope", ESCOPO, "aud", d.tokenUri(),
                    "iat", agora, "exp", agora + 3600)));
        } catch (IOException e) {
            throw new GoogleDrive.ErroDrive("Não foi possível montar o pedido ao Google", false);
        }
        String assinado = cabecalho + "." + corpo;
        String jwt = assinado + "." + base64(assinar(d.chavePrivada(), assinado));
        try {
            HttpRequest req = HttpRequest.newBuilder(URI.create(destino))
                    .timeout(Duration.ofSeconds(20))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString("grant_type="
                            + URLEncoder.encode("urn:ietf:params:oauth:grant-type:jwt-bearer", StandardCharsets.UTF_8)
                            + "&assertion=" + jwt))
                    .build();
            HttpResponse<String> res = HTTP.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            JsonNode r = json.readTree(res.body());
            if (res.statusCode() != 200 || !r.hasNonNull("access_token")) {
                String erro = r.path("error_description").asText(r.path("error").asText("erro " + res.statusCode()));
                throw new GoogleDrive.ErroDrive("O Google recusou a conta de serviço (" + erro + "). Confira se a chave não foi"
                        + " apagada no Google Cloud e envie o arquivo de novo.", res.statusCode() >= 500);
            }
            return new Passe(r.path("access_token").asText(), Instant.now().plusSeconds(r.path("expires_in").asLong(3600)));
        } catch (IOException e) {
            throw new GoogleDrive.ErroDrive("Sem conexão com o Google: " + e.getMessage(), true);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new GoogleDrive.ErroDrive("Pedido interrompido", true);
        }
    }

    private static byte[] assinar(String pem, String texto) {
        try {
            String semCabecalho = pem.replaceAll("-----[A-Z ]+-----", "").replaceAll("\\s", "");
            PrivateKey chave = KeyFactory.getInstance("RSA")
                    .generatePrivate(new PKCS8EncodedKeySpec(Base64.getDecoder().decode(semCabecalho)));
            Signature s = Signature.getInstance("SHA256withRSA");
            s.initSign(chave);
            s.update(texto.getBytes(StandardCharsets.UTF_8));
            return s.sign();
        } catch (GeneralSecurityException | IllegalArgumentException e) {
            throw new GoogleDrive.ErroDrive("A chave privada do arquivo da conta de serviço está com defeito: baixe uma nova", false);
        }
    }

    private static String base64(byte[] b) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }
}
