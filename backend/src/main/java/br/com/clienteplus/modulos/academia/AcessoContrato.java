package br.com.clienteplus.modulos.academia;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

// Formatos de entrada e saída de Check-in, Controle de acesso, Horários de
// pico e Configurações. Contrato com o frontend: frontend/src/lib/academia-acesso.ts.
public final class AcessoContrato {

    private AcessoContrato() {}

    // ---------- Entrada ----------

    // liberarMesmoAssim: a recepção libera um aluno que estaria bloqueado
    public record NovoCheckin(UUID alunoId, Boolean liberarMesmoAssim, String observacao) {}

    // Chamada de uma catraca/leitor: identifica o aluno pelo CPF ou pelo id
    // (o QR code da área do cliente leva o id).
    public record EntradaDispositivo(String token, String documento, UUID alunoId) {}

    public record DadosRegras(
            Boolean bloquearInadimplentes,
            Integer toleranciaAtrasoDias,
            Boolean bloquearForaDoHorario,
            Integer intervaloCheckinMinutos) {}

    public record NovoBloqueio(UUID alunoId, String motivo) {}

    public record DadosDispositivo(String nome, String tipo, String fabricante, String identificador, Boolean ativo) {}

    // abre/fecha "06:00"; fechado = não abre nesse dia
    public record DadosHorario(int diaSemana, String abre, String fecha, boolean fechado) {}

    public record DadosConfiguracoes(
            String nomeAcademia,
            String gestorNome,
            String gestorCargo,
            String frase,
            String telefone,
            String email,
            String endereco,
            String cnpj,
            String whatsapp,
            Integer capacidade,
            Integer validadeFichaSemanas,
            Integer reavaliacaoDias,
            List<DadosHorario> horarios) {}

    // ---------- Saída ----------

    // meio: "recepcao" | "catraca" | "leitor_facial" | "leitor_biometrico" | "totem_qr" | "app"
    // motivo: "sem_matricula" | "inadimplente" | "fora_do_horario" | "bloqueio_manual" | null
    public record AcessoJson(
            UUID id,
            UUID alunoId,
            String aluno,
            OffsetDateTime momento,
            String meio,
            String dispositivo,
            String resultado,
            String motivo,
            boolean liberadoManual,
            String observacao) {}

    // resultado: "liberado" | "bloqueado" | "repetido" (já entrou há pouco; não conta de novo)
    public record ResultadoAcesso(
            String resultado,
            String motivo,
            String mensagem,
            UUID alunoId,
            String aluno,
            String plano,
            AcessoJson acesso) {}

    // agora = alunos que entraram nos últimos 90 minutos (estimativa de quem está lá)
    public record ResumoCheckins(
            int hoje, long variacao, int agora, int bloqueadosHoje, int liberacoesManuaisHoje, String ultimo) {}

    public record PainelCheckins(LocalDate data, boolean ehHoje, ResumoCheckins resumo, List<AcessoJson> acessos) {}

    public record Regras(
            boolean bloquearInadimplentes,
            int toleranciaAtrasoDias,
            boolean bloquearForaDoHorario,
            int intervaloCheckinMinutos) {}

    public record HorarioJson(int diaSemana, String dia, String abre, String fecha, boolean fechado) {}

    // manual = bloqueio feito pela academia (bloqueioId preenchido); os
    // demais são automáticos (inadimplência).
    public record AlunoBloqueado(
            UUID alunoId, String nome, String motivo, String detalhe, LocalDate desde, boolean manual, UUID bloqueioId) {}

    public record DispositivoJson(
            UUID id,
            String nome,
            String tipo,
            String fabricante,
            String identificador,
            String token,
            boolean ativo,
            OffsetDateTime ultimoContato,
            int acessosHoje) {}

    public record PainelAcesso(
            Regras regras,
            List<HorarioJson> horarios,
            boolean abertoAgora,
            List<AlunoBloqueado> bloqueados,
            List<DispositivoJson> dispositivos,
            List<AcessoJson> historico) {}

    // media = entradas por hora em média; ocupacao = % da capacidade
    public record HoraPico(int hora, double media, int ocupacao) {}

    public record DiaPico(int diaSemana, String dia, List<HoraPico> horas) {}

    public record HoraHoje(int hora, int hoje, double media) {}

    public record Destaques(
            String horaMaisCheia,
            int ocupacaoMaisCheia,
            String horaMaisVazia,
            String diaMaisMovimentado,
            double mediaDiaria) {}

    public record PainelPico(
            int capacidade,
            int semanas,
            int horaInicio,
            int horaFim,
            int diaHoje,
            List<DiaPico> mapa,
            List<HoraHoje> hoje,
            Destaques destaques,
            int agora,
            int ocupacaoAgora) {}

    public record ConfiguracoesJson(
            String nomeAcademia,
            String gestorNome,
            String gestorCargo,
            String frase,
            String telefone,
            String email,
            String endereco,
            String cnpj,
            String whatsapp,
            String slug,
            // endereço completo da página pública
            String paginaPublica,
            int capacidade,
            int validadeFichaSemanas,
            int reavaliacaoDias,
            List<HorarioJson> horarios) {}
}
