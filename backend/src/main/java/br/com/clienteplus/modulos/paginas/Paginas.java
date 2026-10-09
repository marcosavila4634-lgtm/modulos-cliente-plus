package br.com.clienteplus.modulos.paginas;

import br.com.clienteplus.modulos.comum.Erro;
import br.com.clienteplus.modulos.paginas.PaginaContrato.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

// Regras da página pública personalizada, iguais para todos os módulos:
// rascunho (salva sozinho enquanto o dono edita), publicar, descartar e
// voltar para uma versão anterior.
//
// O servidor não interpreta as seções (quem desenha é o frontend); ele só
// confere o tamanho, a forma geral e os endereços de links e imagens.
@ApplicationScoped
public class Paginas {

    // endereço público (slug): 3 a 40 letras minúsculas, números ou hífen
    public static final String ENDERECO = "[a-z0-9](?:[a-z0-9-]{1,38})[a-z0-9]";

    static final int MAX_CARACTERES = 300_000;
    static final int MAX_SECOES = 40;
    static final int MAX_VERSOES = 20;
    // campos que viram link ou imagem na página
    static final Set<String> CAMPOS_ENDERECO = Set.of("logo", "capa", "imagem", "foto", "url", "link", "alvo",
            "alvoSecundario", "instagram", "youtube", "tiktok", "facebook", "site");

    @Inject
    ObjectMapper json;

    // Versão no ar (null = a página padrão do módulo).
    public JsonNode publicada(UUID storeId, String modulo) {
        Pagina p = pagina(storeId, modulo);
        return p != null ? ler(p.publicada) : null;
    }

    public Editor editor(ModuloComPagina m) {
        Pagina p = pagina(m.storeId(), m.modulo());
        List<Versao> versoes = PaginaVersao.<PaginaVersao>list(
                        "storeId = ?1 and modulo = ?2 order by publicadaEm desc", m.storeId(), m.modulo()).stream()
                .map(v -> new Versao(v.id, v.publicadaEm))
                .toList();
        JsonNode rascunho = p != null ? ler(p.rascunho) : null;
        JsonNode publicada = p != null ? ler(p.publicada) : null;
        return new Editor(rascunho, publicada, pendente(rascunho, publicada), p != null ? p.publicadaEm : null,
                m.link(), m.dados(), versoes);
    }

    @Transactional
    public Salvo salvarRascunho(ModuloComPagina m, JsonNode pagina) {
        validar(pagina);
        Pagina p = paginaOuNova(m);
        p.rascunho = escrever(pagina);
        return new Salvo(pendente(pagina, ler(p.publicada)));
    }

    @Transactional
    public void publicar(ModuloComPagina m) {
        Pagina p = paginaOuNova(m);
        JsonNode pagina = ler(p.rascunho);
        if (pagina == null) throw Erro.invalido("Nada para publicar: faça uma alteração primeiro");
        validar(pagina);
        p.publicada = p.rascunho;
        p.publicadaEm = OffsetDateTime.now();

        PaginaVersao v = new PaginaVersao();
        v.storeId = m.storeId();
        v.modulo = m.modulo();
        v.pagina = p.publicada;
        v.publicadaEm = p.publicadaEm;
        v.persist();
        PaginaVersao.<PaginaVersao>list("storeId = ?1 and modulo = ?2 order by publicadaEm desc", m.storeId(), m.modulo())
                .stream()
                .skip(MAX_VERSOES)
                .forEach(PaginaVersao::delete);

        m.aoPublicar(pagina);
    }

    // Volta o rascunho para o que está no ar.
    @Transactional
    public void descartar(ModuloComPagina m) {
        Pagina p = paginaOuNova(m);
        p.rascunho = p.publicada;
    }

    // Coloca uma versão antiga no rascunho (o dono confere e publica).
    @Transactional
    public void restaurar(ModuloComPagina m, UUID versaoId) {
        PaginaVersao v = PaginaVersao.findById(versaoId);
        if (v == null || !v.storeId.equals(m.storeId()) || !v.modulo.equals(m.modulo())) {
            throw Erro.naoEncontrado("Versão não encontrada");
        }
        paginaOuNova(m).rascunho = v.pagina;
    }

    public static String endereco(String texto) {
        String e = texto != null ? texto.trim().toLowerCase(Locale.ROOT) : "";
        if (!e.matches(ENDERECO)) throw Erro.invalido("Endereço: de 3 a 40 letras minúsculas, números ou hífen");
        return e;
    }

    // ---------- apoio ----------

    private static Pagina pagina(UUID storeId, String modulo) {
        return Pagina.<Pagina>find("storeId = ?1 and modulo = ?2", storeId, modulo).firstResult();
    }

    private static Pagina paginaOuNova(ModuloComPagina m) {
        Pagina p = pagina(m.storeId(), m.modulo());
        if (p == null) {
            p = new Pagina();
            p.storeId = m.storeId();
            p.modulo = m.modulo();
            p.persist();
        }
        return p;
    }

    private static boolean pendente(JsonNode rascunho, JsonNode publicada) {
        return rascunho != null && !Objects.equals(rascunho, publicada);
    }

    private JsonNode ler(String texto) {
        if (texto == null || texto.isBlank()) return null;
        try {
            return json.readTree(texto);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private String escrever(JsonNode pagina) {
        try {
            return json.writeValueAsString(pagina);
        } catch (JsonProcessingException e) {
            throw Erro.invalido("Página inválida");
        }
    }

    private void validar(JsonNode pagina) {
        if (pagina == null || !pagina.isObject() || !pagina.path("secoes").isArray() || !pagina.path("tema").isObject()) {
            throw Erro.invalido("Página inválida");
        }
        if (pagina.path("secoes").size() > MAX_SECOES) throw Erro.invalido("A página pode ter até " + MAX_SECOES + " seções");
        if (escrever(pagina).length() > MAX_CARACTERES) {
            throw Erro.invalido("A página ficou grande demais. Diminua os textos ou tire algumas seções.");
        }
        conferirEnderecos(pagina, null);
    }

    // Links e imagens: só endereços comuns (https://, /api/arquivos/..., #planos).
    // Barra "javascript:" e parecidos, que rodariam código na página.
    private static void conferirEnderecos(JsonNode no, String campo) {
        if (no.isObject()) {
            no.fields().forEachRemaining(e -> conferirEnderecos(e.getValue(), e.getKey()));
        } else if (no.isArray()) {
            no.forEach(x -> conferirEnderecos(x, campo));
        } else if (no.isTextual() && campo != null && CAMPOS_ENDERECO.contains(campo)) {
            String v = no.asText().trim().toLowerCase(Locale.ROOT).replaceAll("\\s", "");
            if (v.startsWith("javascript:") || v.startsWith("data:") || v.startsWith("vbscript:")) {
                throw Erro.invalido("Endereço não permitido: " + no.asText());
            }
        }
    }
}
