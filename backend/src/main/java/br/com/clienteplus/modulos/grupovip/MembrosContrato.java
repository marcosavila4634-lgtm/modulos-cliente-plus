package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.grupovip.AcessosContrato.EventoAcesso;
import br.com.clienteplus.modulos.grupovip.FinanceiroContrato.Cobranca;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

// Formato do JSON de membros, planos e grupos.
// Contrato com o frontend: frontend/src/lib/grupo-vip-membros.ts
public final class MembrosContrato {

    private MembrosContrato() {}

    public record Opcao(UUID id, String nome) {}

    // situacao: "em_dia" | "vencendo" | "atrasado" | "bloqueado" | "aguardando_pagamento" | "cancelando" | "sem_plano"
    public record MembroResumo(
            UUID id,
            String nome,
            String telefone,
            String email,
            String telegramUsuario,
            boolean telegramConectado,
            String plano,
            LocalDate proximoVencimento,
            LocalDate pagoAte,
            String situacao,
            int diasAtraso,
            int gruposDentro,
            int gruposComDireito,
            OffsetDateTime membroDesde,
            String origem,
            String indicadoPor) {}

    public record ListaMembros(List<MembroResumo> membros, Map<String, Integer> contagem, List<PlanoJson> planos) {}

    public record PlanoJson(
            UUID id,
            String nome,
            String descricao,
            Number preco,
            int duracaoMeses,
            boolean participaIndicacoes,
            boolean ativo,
            List<Opcao> grupos,
            int assinantes) {}

    public record AssinaturaAtual(
            UUID id,
            PlanoJson plano,
            Number valor,
            LocalDate inicio,
            // "ativa" | "cancelada"
            String status,
            LocalDate proximoVencimento,
            UUID proximaCobrancaId,
            Number proximoValor,
            LocalDate pagoAte,
            OffsetDateTime canceladaEm) {}

    // status: "convidado" | "no_grupo" | "removido" | null (nunca entrou)
    // pendencia: "adicionar" | "aguardando" | "remover" | null
    public record GrupoDoMembro(
            UUID grupoId,
            String nome,
            String plataforma,
            boolean automatico,
            boolean direito,
            String status,
            String conviteLink,
            OffsetDateTime entrouEm,
            String pendencia) {}

    // status: "pendente" | "enviada" | "falhou" | "descartada"; whatsapp = link para enviar
    public record MensagemJson(
            UUID id,
            UUID clienteId,
            String nome,
            String telefone,
            String tipo,
            String canal,
            String texto,
            String status,
            String erro,
            OffsetDateTime criadaEm,
            OffsetDateTime enviadaEm,
            String whatsapp) {}

    public record Pessoa(UUID id, String nome, String situacao) {}

    public record Links(String areaMembro, String indicacao, String robo) {}

    public record MembroDetalhe(
            UUID id,
            String nome,
            String email,
            String telefone,
            String cpf,
            LocalDate dataNascimento,
            String telegramUsuario,
            boolean telegramConectado,
            String observacoes,
            boolean bloqueado,
            String codigo,
            String origem,
            OffsetDateTime membroDesde,
            String situacao,
            int diasAtraso,
            String motivoBloqueio,
            int toleranciaDias,
            AssinaturaAtual assinatura,
            List<GrupoDoMembro> grupos,
            List<Cobranca> cobrancas,
            List<EventoAcesso> historico,
            List<MensagemJson> mensagens,
            Pessoa indicadoPor,
            List<Pessoa> indicados,
            Number comissaoTotal,
            Number saldoComissao,
            Links links) {}

    public record DadosMembro(
            String nome,
            String email,
            String telefone,
            String cpf,
            LocalDate dataNascimento,
            String telegramUsuario,
            String observacoes) {

        Membros.Dados dados() {
            return new Membros.Dados(nome, email, telefone, cpf, dataNascimento, telegramUsuario, observacoes);
        }
    }

    // Cadastro com assinatura opcional: planoId vazio = só cadastra.
    // formaPagamento preenchida = a 1ª mensalidade já foi paga.
    public record NovoMembro(
            String nome,
            String email,
            String telefone,
            String cpf,
            LocalDate dataNascimento,
            String telegramUsuario,
            String observacoes,
            UUID planoId,
            LocalDate inicio,
            String formaPagamento) {

        Membros.Dados dados() {
            return new Membros.Dados(nome, email, telefone, cpf, dataNascimento, telegramUsuario, observacoes);
        }
    }

    public record Assinar(UUID planoId, LocalDate inicio, String formaPagamento) {}

    public record Bloquear(boolean bloqueado) {}

    public record TextoLivre(String texto) {}
}
