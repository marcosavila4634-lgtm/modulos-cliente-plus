package br.com.clienteplus.modulos.paginas;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.UUID;

// O que cada módulo informa para o editor da página pública. Para um módulo
// novo ganhar página: criar uma classe @ApplicationScoped que implementa esta
// interface, a rota pública do módulo (que devolve Paginas.publicada(...)
// junto com os dados) e, no frontend, o adaptador em lib/pagina-<modulo>.ts.
public interface ModuloComPagina {

    // nome usado na API: /api/paginas/<modulo>
    String modulo();

    // loja do usuário logado (no laboratório: a loja de exemplo do módulo)
    UUID storeId();

    // endereço público da página (para copiar e divulgar)
    String link();

    // os mesmos dados que a página pública recebe (nome, planos...), para a
    // prévia do editor
    Object dados();

    // chamado ao publicar (ex.: copiar a descrição para os textos do robô)
    default void aoPublicar(JsonNode pagina) {}
}
