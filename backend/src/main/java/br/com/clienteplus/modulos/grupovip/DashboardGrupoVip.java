package br.com.clienteplus.modulos.grupovip;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;
import java.util.UUID;

// Formato da resposta de GET /api/grupo-vip/dashboard. Tudo calculado dos dados.
// Contrato com o frontend: frontend/src/lib/grupo-vip.ts (tipo DashboardGrupoVip).
public record DashboardGrupoVip(
        GrupoAtual grupoAtual,
        Gestor gestor,
        String frase,
        String fraseDestaque,
        Indicadores indicadores,
        List<MembroRecente> membrosRecentes,
        List<CrescimentoMembros> crescimentoMembros,
        List<ConteudoAcessado> conteudosMaisAcessados,
        List<PlanoMembros> planosMembros,
        List<Aviso> avisos,
        List<Grupo> grupos,
        List<Evento> proximosEventos,
        Pendencias pendencias,
        List<Alerta> alertas,
        boolean roboConectado,
        String paginaVendas) {

    public record GrupoAtual(String nome) {}

    public record Gestor(String nome, String sobrenome, String cargo) {}

    // membrosAtivos = com acesso hoje; visualizacoes = conteúdos abertos na área do membro
    public record Indicadores(
            ComMesAnterior membrosAtivos,
            ComMesAnterior conteudosPublicados,
            ComMesAnterior visualizacoes,
            ComMesAnterior receitaMes,
            Number novosEsteMes,
            Number ticketMedio) {}

    public record ComMesAnterior(Number valor, Number variacao, Number mesAnterior) {}

    // situacao: igual à lista de membros
    public record MembroRecente(UUID id, String nome, String plano, String grupo, String data, String situacao) {}

    // "data" é opcional: só aparece no JSON no mês em andamento.
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record CrescimentoMembros(String mes, int membros, String data) {}

    public record ConteudoAcessado(String titulo, int acessos) {}

    public record PlanoMembros(String nome, int percentual, int quantidade) {}

    // tipo: "conteudo" | "manutencao" | "live" | "material" | "promocao"
    public record Aviso(String tipo, String titulo, String quando, int destinatarios) {}

    // plataforma: "telegram" | "whatsapp"; cor: "blue" | "sky" | "violet" | "indigo" | "amber"
    public record Grupo(UUID id, String nome, String plataforma, int membros, String cor, boolean automatico) {}

    // status: "ao_vivo" | "agendado"
    public record Evento(UUID id, String titulo, String foto, String quando, String status) {}

    public record Pendencias(
            int adicionar,
            int remover,
            int aguardando,
            int mensagensWhatsapp,
            int publicacoesManuais,
            int chamadosAbertos,
            int saquesSolicitados,
            int cobrancasAtrasadas) {}

    // link: caminho da tela que resolve o alerta
    public record Alerta(String chave, String titulo, String descricao, int quantidade, String link) {}
}
