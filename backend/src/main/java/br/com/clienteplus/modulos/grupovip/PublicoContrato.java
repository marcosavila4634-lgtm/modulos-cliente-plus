package br.com.clienteplus.modulos.grupovip;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

// Formato do JSON da página de vendas (/g/<slug>) e da área do membro
// (/membro/<codigo>), que são abertas pelos clientes, sem login no painel.
// Contrato com o frontend: frontend/src/lib/grupo-vip-publico.ts
public final class PublicoContrato {

    private PublicoContrato() {}

    public record GrupoPublico(UUID id, String nome, String plataforma, String descricao) {}

    public record PlanoPublico(UUID id, String nome, String descricao, Number preco, int duracaoMeses,
                               List<GrupoPublico> grupos) {}

    public record PaginaVendas(
            String nome,
            String slug,
            String descricao,
            List<String> beneficios,
            String fotoCapa,
            String whatsappSuporte,
            List<PlanoPublico> planos,
            // primeiro nome de quem indicou (link com ?ref=)
            String indicadoPor,
            int membros) {}

    public record CupomAplicado(String codigo, Number desconto, Number valorFinal) {}

    public record PedidoCheckout(
            UUID planoId,
            String nome,
            String email,
            String telefone,
            String cpf,
            String telegramUsuario,
            String cupom,
            String ref) {}

    public record CheckoutFeito(String codigo) {}

    // ---------- Área do membro ----------

    // modo: "automatico" (robô do Telegram) | "assistido" (a equipe adiciona)
    // status: "no_grupo" | "convidado" | "removido" | null
    // link: link de entrada (quando existe)
    public record GrupoArea(UUID id, String nome, String plataforma, String descricao, String modo, String status,
                            String link) {}

    public record PixJson(String copiaECola, String chave, String recebedor) {}

    // status: "pendente" | "atrasada" | "paga" | "cancelada"
    public record CobrancaArea(UUID id, String descricao, Number valor, LocalDate vencimento, String status,
                               OffsetDateTime pagoEm, String formaPagamento, PixJson pix) {}

    public record ConteudoArea(UUID id, String titulo, String texto, String categoria, String cor, String midiaUrl,
                               String midiaTipo, String link, OffsetDateTime publicadoEm, boolean visto) {}

    // status: "agendado" | "ao_vivo" | "encerrado"; link só para quem tem acesso
    public record LiveArea(UUID id, String titulo, String descricao, String foto, String link, OffsetDateTime comecaEm,
                           int duracaoMinutos, String status) {}

    public record Indicado(String nome, boolean ativo, OffsetDateTime desde) {}

    public record ComissaoArea(LocalDate data, String de, int nivel, Number valor) {}

    // status: "solicitado" | "pago" | "recusado"
    public record SaqueArea(UUID id, OffsetDateTime data, Number valor, String status, String motivo) {}

    public record IndicacaoArea(
            String link,
            List<Number> percentuais,
            List<Indicado> indicados,
            Number ganho,
            Number disponivel,
            Number emAnalise,
            Number sacado,
            List<ComissaoArea> comissoes,
            List<SaqueArea> saques) {}

    public record TelegramArea(boolean roboAtivo, boolean conectado, String usuario, String linkRobo) {}

    public record AreaMembro(
            String negocio,
            String whatsappSuporte,
            String paginaVendas,
            String nome,
            String codigo,
            String situacao,
            int diasAtraso,
            int toleranciaDias,
            PlanoPublico plano,
            // "ativa" | "cancelada" | null
            String assinaturaStatus,
            LocalDate proximoVencimento,
            LocalDate pagoAte,
            List<GrupoArea> grupos,
            List<CobrancaArea> cobrancas,
            TelegramArea telegram,
            List<ConteudoArea> conteudos,
            List<LiveArea> lives,
            IndicacaoArea indicacao,
            List<Suporte.ChamadoJson> chamados,
            List<PlanoPublico> planos,
            boolean pixConfigurado) {}

    public record Assinar(UUID planoId) {}

    public record PedidoSaque(BigDecimal valor, String chavePix) {}

    public record NovoChamado(String assunto, String texto) {}

    public record Texto(String texto) {}
}
