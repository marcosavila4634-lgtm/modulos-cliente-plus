package br.com.clienteplus.modulos.grupovip;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

// Formato do JSON do controle de acesso (GET /api/grupo-vip/acessos).
// Contrato com o frontend: frontend/src/lib/grupo-vip-acessos.ts
public final class AcessosContrato {

    private AcessosContrato() {}

    // acao: "adicionar" | "aguardando" | "remover"
    // automatico = o robô resolve sozinho
    public record Pendencia(
            UUID clienteId,
            String nome,
            String telefone,
            String telegramUsuario,
            boolean telegramConectado,
            UUID grupoId,
            String grupo,
            String plataforma,
            boolean automatico,
            String acao,
            String situacao,
            String motivo,
            String conviteLink,
            OffsetDateTime desde) {}

    public record Sincronizacao(int convidados, int removidos, List<String> erros) {}

    // link = link de entrada; whatsapp = link que abre o WhatsApp com a mensagem pronta
    public record Convite(String link, String whatsapp) {}

    // acao: "convite" | "entrou" | "removido" | "recusado"
    public record EventoAcesso(
            UUID id,
            OffsetDateTime momento,
            UUID clienteId,
            String nome,
            UUID grupoId,
            String grupo,
            String plataforma,
            String acao,
            boolean automatico,
            String detalhe) {}

    public record Robo(boolean conectado, String usuario, String erro, OffsetDateTime ultimaConsulta) {}

    public record GrupoContagem(UUID id, String nome, String plataforma, boolean automatico, int noGrupo,
                                int comDireito) {}

    public record PainelAcessos(
            List<Pendencia> pendencias,
            List<EventoAcesso> historico,
            Robo robo,
            List<GrupoContagem> grupos,
            int toleranciaDias) {}
}
