package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.grupovip.ConteudosContrato.GrupoOpcao;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

// Formato do JSON da tela "Biblioteca" (livros, envio em massa e robô bibliotecário).
// Contrato com o frontend: frontend/src/lib/grupo-vip-biblioteca.ts
public final class BibliotecaContrato {

    private BibliotecaContrato() {}

    // noTelegram = o arquivo já está no Telegram (o robô reenvia na hora)
    // dadosStatus: "pendente" | "ok" | "nao_encontrado" | "manual" (Google Books)
    // soLink = acima de 50 MB: o robô entrega um link temporário (LinksDeLivro)
    public record LivroJson(UUID id, String titulo, String arquivoNome, long tamanho, UUID grupoId, String grupo, String origem,
                            int pedidos, boolean noTelegram, String autor, String categoria, String genero, String sinopse,
                            String capaUrl, Integer ano, String dadosStatus, boolean soLink, OffsetDateTime createdAt) {}

    // Dados corrigidos pelo dono.
    public record DadosLivro(String titulo, String autor, String categoria, String genero, String sinopse) {}

    public record Ligado(boolean ligado) {}

    // Sugestões de livros dos membros, juntadas pelo título.
    // status: "pendente" | "adicionado" | "recusado"
    public record SugestaoJson(List<UUID> ids, String titulo, String autor, int pedidos, List<String> nomes, String status,
                               UUID livroId, String livro, OffsetDateTime ultimaEm, OffsetDateTime respondidaEm) {}

    // livroId vazio = o sistema procura o livro na biblioteca pelo título
    public record RespostaSugestao(List<UUID> ids, String acao, UUID livroId) {}

    public record ListaLivros(List<LivroJson> livros, int total, int pagina, int porPagina) {}

    // status: "pendente" | "enviado" | "pulado" | "grande_demais" | "falhou"
    public record ItemJson(UUID id, String arquivoNome, long tamanho, String status, String erro, OffsetDateTime enviadoEm) {}

    // status: "recebendo" | "listando" | "enviando" | "pausada" | "concluida" | "falhou"
    // minutosRestantes: previsão (o Telegram aceita ~20 arquivos por minuto)
    public record ImportacaoJson(
            UUID id,
            UUID grupoId,
            String grupo,
            String topico,
            String origem,
            // telegram: grupo de origem e andamento da leitura das mensagens
            String origemGrupo,
            boolean copiarMidias,
            Long varreduraAtual,
            Long varreduraAte,
            int protegidas,
            String pastaUrl,
            String pastaNome,
            boolean postarNoGrupo,
            String status,
            String erro,
            int total,
            int enviados,
            int pulados,
            int grandes,
            int falhas,
            int pendentes,
            Integer minutosRestantes,
            OffsetDateTime createdAt,
            OffsetDateTime concluidaEm) {}

    public record DetalhesImportacao(ImportacaoJson importacao, List<ItemJson> itens) {}

    public record ResumoGrupo(UUID grupoId, String grupo, int livros) {}

    public record MaisPedido(UUID livroId, String titulo, String grupo, int pedidos, int pedidos30Dias) {}

    // grupos: grupos do Telegram com o robô (onde dá para ter biblioteca)
    // googleConfigurado = dá para ler o Drive (conta de serviço ou chave)
    // contaServicoEmail = e-mail com quem compartilhar a pasta privada
    public record PainelBiblioteca(
            boolean googleConfigurado,
            boolean chaveConfigurada,
            String contaServicoEmail,
            boolean roboConectado,
            String roboUsuario,
            List<GrupoOpcao> grupos,
            List<ImportacaoJson> importacoes,
            List<ResumoGrupo> resumo,
            List<MaisPedido> maisPedidos,
            int pedidosHoje,
            int limitePorDia,
            long tamanhoMaximo,
            List<String> extensoes,
            // cópia entre grupos: o Telegram do dono precisa estar ligado ao robô
            boolean donoConectado,
            String linkDono,
            // Google Books: completar autor, gênero, capa e resumo
            boolean completarLivros,
            // livros esperando a busca no Google Books
            int dadosPendentes,
            int sugestoesPendentes,
            // "livros" | "materiais" (apostilas, vídeos, áudios...): muda os textos e os formatos aceitos
            String tipo) {}

    // "livros" | "materiais"
    public record TipoBiblioteca(String tipo) {}

    // origem: "drive" | "computador" | "telegram"; pastaUrl só no Drive; topicoId opcional
    // telegram: origemGrupoId, ultimaMensagem (link da última mensagem do grupo de
    // origem), primeiraMensagem (link, opcional: começa do início) e copiarMidias
    public record DadosImportacao(String origem, String pastaUrl, UUID grupoId, UUID topicoId, boolean postarNoGrupo,
                                  UUID origemGrupoId, String ultimaMensagem, String primeiraMensagem, boolean copiarMidias) {}

    // vazio = apaga a chave
    public record ChaveGoogle(String chave) {}

    // conteúdo do arquivo JSON da conta de serviço; vazio = apaga
    public record ContaServico(String json) {}
}
