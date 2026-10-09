package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.Erro;
import br.com.clienteplus.modulos.paginas.ModuloComPagina;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;

// Página de vendas (/g/<slug>) no editor de páginas comum a todos os módulos
// (pacote paginas). Adaptador do frontend: frontend/src/lib/pagina-grupo-vip.tsx
@ApplicationScoped
public class PaginaGrupoVip implements ModuloComPagina {

    public static final String MODULO = "grupo-vip";

    @ConfigProperty(name = "grupo-vip.store-id")
    UUID storeId;

    @Inject
    Membros membros;

    @Inject
    EnderecoPublico endereco;

    @Override
    public String modulo() {
        return MODULO;
    }

    @Override
    public UUID storeId() {
        return storeId;
    }

    @Override
    public String link() {
        return endereco.paginaVendas(membros.config(storeId).slug, null);
    }

    @Override
    public Object dados() {
        return PublicoResource.montar(membros.config(storeId), null, null);
    }

    @Override
    public void mudarEndereco(UUID loja, String endereco) {
        Config c = membros.config(loja);
        if (Config.count("slug = ?1 and storeId <> ?2", endereco, loja) > 0) {
            throw Erro.conflito("Este endereço de página já está em uso");
        }
        c.slug = endereco;
    }

    // O robô ("Conhecer mais") e os Primeiros passos usam a descrição, os
    // benefícios e a foto de capa: copia da página publicada.
    @Override
    public void aoPublicar(JsonNode pagina) {
        Config c = membros.config(storeId);
        for (JsonNode s : pagina.path("secoes")) {
            if (!s.path("visivel").asBoolean(true)) continue;
            String tipo = s.path("tipo").asText();
            // conteúdo da seção (formato do editor: { id, tipo, visivel, props, estilo })
            JsonNode props = s.path("props");
            if ("capa".equals(tipo)) {
                c.descricaoPagina = props.path("texto").asText("").trim();
                String capa = props.path("imagem").asText(null);
                if (capa != null && !capa.isBlank()) c.fotoCapa = capa;
            } else if ("beneficios".equals(tipo)) {
                List<String> itens = new ArrayList<>();
                props.path("itens").forEach(i -> {
                    String t = i.path("titulo").asText("").trim();
                    if (!t.isEmpty()) itens.add(t);
                });
                c.beneficios = String.join("\n", itens);
                break; // só a primeira lista de benefícios
            }
        }
    }
}
