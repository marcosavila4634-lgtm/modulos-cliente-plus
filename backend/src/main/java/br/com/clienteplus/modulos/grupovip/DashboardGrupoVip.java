package br.com.clienteplus.modulos.grupovip;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

// Formato da resposta de GET /api/grupo-vip/dashboard.
// Contrato com o frontend: frontend/src/lib/grupo-vip.ts (tipo DashboardGrupoVip).
public record DashboardGrupoVip(
        boolean demo,
        GrupoAtual grupoAtual,
        Gestor gestor,
        int notificacoes,
        String frase,
        String fraseDestaque,
        Indicadores indicadores,
        List<MembroRecente> membrosRecentes,
        List<CrescimentoMembros> crescimentoMembros,
        List<ConteudoAcessado> conteudosMaisAcessados,
        List<PlanoMembros> planosMembros,
        List<Aviso> avisos,
        List<Grupo> grupos,
        List<Evento> proximosEventos) {

    public record GrupoAtual(String nome) {}

    public record Gestor(String nome, String sobrenome, String cargo) {}

    public record Indicadores(
            ComMesAnterior membrosAtivos,
            ComMesAnterior conteudosPublicados,
            ComMesAnterior visualizacoes,
            ComMesAnterior receitaMes,
            Number novosEsteMes,
            Number ticketMedio) {}

    public record ComMesAnterior(Number valor, Number variacao, Number mesAnterior) {}

    // plano: "Básico" | "VIP" | "Premium" | "Cortesia"; status: "ativo" | "pendente"
    public record MembroRecente(String nome, String foto, String plano, String grupo, String data, String status) {}

    // "data" é opcional: só aparece no JSON quando preenchida.
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record CrescimentoMembros(String mes, int membros, String data) {}

    public record ConteudoAcessado(String titulo, int acessos) {}

    public record PlanoMembros(String nome, int percentual) {}

    // tipo: "conteudo" | "manutencao" | "live" | "material"; status: "enviado"
    public record Aviso(String tipo, String titulo, String quando, String status) {}

    // plataforma: "telegram" | "whatsapp"; cor: "blue" | "sky" | "violet" | "indigo" | "amber"
    public record Grupo(String nome, String plataforma, int membros, String cor) {}

    // status: "ao_vivo" | "em_breve"
    public record Evento(String titulo, String foto, String quando, String status) {}
}
