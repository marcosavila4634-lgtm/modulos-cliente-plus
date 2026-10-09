package br.com.clienteplus.modulos.paginas;

import br.com.clienteplus.modulos.comum.Erro;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.Map;
import java.util.UUID;

// Rotas da PLATAFORMA (equipe do Cliente Plus), nunca do lojista.
//
// O endereço da página pública (slug) é definido na criação da loja; depois
// disso, só a plataforma troca, por aqui:
//   PUT /api/plataforma/paginas/<modulo>/lojas/<storeId>/endereco
//   {"endereco": "novo-endereco"}
//
// No laboratório não há login. No projeto principal: tela do admin da
// plataforma (ex.: "Gerenciar Barbearias") com permissão só de admin (RLS /
// Edge Function com service role).
@Path("/plataforma/paginas/{modulo}/lojas/{storeId}/endereco")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PlataformaResource {

    public record NovoEndereco(String endereco) {}

    @Inject
    Instance<ModuloComPagina> modulos;

    @PUT
    @Transactional
    public Map<String, String> mudar(@PathParam("modulo") String modulo, @PathParam("storeId") UUID storeId,
                                     NovoEndereco pedido) {
        ModuloComPagina m = modulos.stream()
                .filter(x -> x.modulo().equals(modulo))
                .findFirst()
                .orElseThrow(() -> Erro.naoEncontrado("Módulo sem página pública: " + modulo));
        String endereco = Paginas.endereco(pedido != null ? pedido.endereco() : null);
        m.mudarEndereco(storeId, endereco);
        return Map.of("endereco", endereco);
    }
}
