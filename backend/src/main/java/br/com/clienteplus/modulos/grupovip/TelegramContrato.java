package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.grupovip.ConteudosContrato.GrupoOpcao;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

// Formato do JSON da tela "Telegram" (controle dos grupos pelo robô) e das enquetes.
// Contrato com o frontend: frontend/src/lib/grupo-vip-telegram.ts
public final class TelegramContrato {

    private TelegramContrato() {}

    public record TopicoJson(UUID id, String nome, long threadId) {}

    // travaInicio/travaFim: "HH:mm" (null = sem trava automática)
    public record GrupoTelegram(
            UUID id,
            String nome,
            String chatId,
            boolean automatico,
            boolean protegerConteudo,
            boolean moderarLinks,
            String palavrasProibidas,
            int silenciarMinutos,
            String boasVindasGrupo,
            boolean apagarAvisosEntrada,
            boolean travado,
            String travaInicio,
            String travaFim,
            List<TopicoJson> topicos,
            int moderadas7Dias) {}

    // Dados lidos na hora do Telegram (erro preenchido se não deu para ler).
    public record InfoTelegram(String titulo, String descricao, Integer membros, boolean forum, Boolean travado, String erro) {}

    public record ModeracaoJson(UUID id, UUID grupoId, String grupo, String nome, String motivo, String detalhe,
                                String texto, OffsetDateTime silenciadoAte, OffsetDateTime momento) {}

    public record Painel(boolean roboConectado, String roboUsuario, List<GrupoTelegram> grupos) {}

    public record Detalhes(GrupoTelegram grupo, InfoTelegram info, List<ModeracaoJson> moderacao) {}

    public record DadosRegras(
            Boolean protegerConteudo,
            Boolean moderarLinks,
            String palavrasProibidas,
            Integer silenciarMinutos,
            String boasVindasGrupo,
            Boolean apagarAvisosEntrada,
            String travaInicio,
            String travaFim) {}

    // Só o que vier preenchido muda. foto: "/api/arquivos/..." (enviada antes)
    public record DadosGrupoTelegram(String titulo, String descricao, String foto) {}

    public record NomeTopico(String nome) {}

    // ---------- Enquetes ----------

    // votos: quantidade por opção (na ordem das opções)
    // status: "enviada" | "falhou" | "encerrada"
    public record EnvioJson(UUID id, UUID grupoId, String grupo, String topico, String status, String erro, List<Integer> votos,
                            int total) {}

    public record EnqueteJson(
            UUID id,
            String pergunta,
            List<String> opcoes,
            // "enquete" | "quiz"
            String tipo,
            Integer correta,
            String explicacao,
            boolean anonima,
            boolean multipla,
            boolean encerrada,
            OffsetDateTime createdAt,
            List<EnvioJson> envios,
            List<Integer> votos,
            int total) {}

    public record DadosEnquete(
            String pergunta,
            List<String> opcoes,
            String tipo,
            Integer correta,
            String explicacao,
            boolean anonima,
            boolean multipla,
            List<UUID> grupoIds,
            Map<UUID, UUID> topicos) {}

    // grupos: só os do Telegram com o robô
    public record ListaEnquetes(List<EnqueteJson> enquetes, List<GrupoOpcao> grupos, boolean roboConectado) {}
}
