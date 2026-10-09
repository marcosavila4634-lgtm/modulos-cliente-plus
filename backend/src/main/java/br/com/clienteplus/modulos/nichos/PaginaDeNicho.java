package br.com.clienteplus.modulos.nichos;

import br.com.clienteplus.modulos.comum.Erro;
import br.com.clienteplus.modulos.grupovip.EnderecoPublico;
import br.com.clienteplus.modulos.paginas.ModuloComPagina;
import br.com.clienteplus.modulos.paginas.Paginas;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.inject.Inject;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

// Editor de página por NICHO (barbearia, salão de beleza, terapeutas): cada
// nicho é um "módulo" do editor comum (pacote paginas) com uma loja de
// exemplo. A página nasce com o modelo pronto do nicho, que fica no frontend
// (frontend/src/lib/pagina-modelos.ts); aqui só ficam os dados da loja.
//
// Área separada do laboratório (/editores), fora dos módulos, para ir sozinha
// ao sistema principal: lá o nicho vem do cadastro da loja (tabela de nichos)
// e os dados são os da loja de verdade (nome, planos, WhatsApp).
// Adaptador do frontend: frontend/src/lib/pagina-nichos.tsx
public abstract class PaginaDeNicho implements ModuloComPagina {

    public record PlanoNicho(UUID id, String nome, String descricao, Number preco, int duracaoMeses, List<String> itens) {}

    public record HorarioNicho(String dia, String texto) {}

    public record PessoaNicho(String nome, String cargo) {}

    public record NichoJson(
            String nicho,
            String nome,
            String whatsapp,
            String endereco,
            int clientes,
            String rotuloClientes,
            List<PlanoNicho> planos,
            List<HorarioNicho> horarios,
            List<PessoaNicho> equipe,
            // página personalizada publicada (null = o modelo do nicho); formato em
            // frontend/src/lib/pagina.ts
            JsonNode pagina) {}

    @Inject
    Paginas paginas;

    @Inject
    EnderecoPublico endereco;

    // "barbearia", "salao", "terapeuta": igual à chave do modelo no frontend
    public abstract String nicho();

    // dados da loja de exemplo
    protected abstract NichoJson loja(JsonNode pagina);

    // O que a página pública (/n/<nicho>) recebe.
    public NichoJson publico() {
        return loja(paginas.publicada(storeId(), modulo()));
    }

    protected PlanoNicho plano(String nome, String descricao, double preco, int duracaoMeses, String... itens) {
        return new PlanoNicho(id(nome), nome, descricao, preco, duracaoMeses, List.of(itens));
    }

    private UUID id(String nome) {
        return UUID.nameUUIDFromBytes((modulo() + "/" + nome).getBytes(StandardCharsets.UTF_8));
    }

    // ---------- Editor (ModuloComPagina) ----------

    @Override
    public String modulo() {
        return "nicho-" + nicho();
    }

    // loja de exemplo fixa de cada nicho (no laboratório não há cadastro de lojas)
    @Override
    public UUID storeId() {
        return id("loja");
    }

    @Override
    public String link() {
        return endereco.base() + "/n/" + nicho();
    }

    @Override
    public Object dados() {
        return loja(null);
    }

    @Override
    public void mudarEndereco(UUID storeId, String novo) {
        throw Erro.invalido("As lojas de exemplo dos nichos têm endereço fixo");
    }
}
