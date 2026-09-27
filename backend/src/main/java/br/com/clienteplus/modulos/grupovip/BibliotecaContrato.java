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
    public record LivroJson(UUID id, String titulo, String arquivoNome, long tamanho, UUID grupoId, String grupo, String origem,
                            int pedidos, boolean noTelegram, OffsetDateTime createdAt) {}

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
    public record PainelBiblioteca(
            boolean googleConfigurado,
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
            String linkDono) {}

    // origem: "drive" | "computador" | "telegram"; pastaUrl só no Drive; topicoId opcional
    // telegram: origemGrupoId, ultimaMensagem (link da última mensagem do grupo de
    // origem), primeiraMensagem (link, opcional: começa do início) e copiarMidias
    public record DadosImportacao(String origem, String pastaUrl, UUID grupoId, UUID topicoId, boolean postarNoGrupo,
                                  UUID origemGrupoId, String ultimaMensagem, String primeiraMensagem, boolean copiarMidias) {}

    // vazio = apaga a chave
    public record ChaveGoogle(String chave) {}
}
