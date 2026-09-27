package br.com.clienteplus.modulos.grupovip;

import static br.com.clienteplus.modulos.comum.Formatos.data;
import static br.com.clienteplus.modulos.comum.Formatos.diaEHora;
import static br.com.clienteplus.modulos.comum.Formatos.mesAbreviado;
import static br.com.clienteplus.modulos.comum.Formatos.numero;

import br.com.clienteplus.modulos.clienteplus.Assinatura;
import br.com.clienteplus.modulos.clienteplus.Pagamento;
import br.com.clienteplus.modulos.clienteplus.Saque;
import br.com.clienteplus.modulos.grupovip.DashboardGrupoVip.*;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.eclipse.microprofile.config.inject.ConfigProperty;

// Dashboard e relatórios do módulo Grupos VIP. Tudo calculado dos dados.
@Path("/grupo-vip")
@Produces(MediaType.APPLICATION_JSON)
public class GrupoVipResource {

    // Loja de exemplo, até existir login (application.properties).
    @ConfigProperty(name = "grupo-vip.store-id")
    UUID storeId;

    @Inject
    Membros membros;

    @Inject
    ControleAcesso controle;

    @Inject
    Relatorios relatorios;

    @Inject
    RoboTelegram robo;

    @Inject
    EnderecoPublico endereco;

    @GET
    @Path("/relatorios")
    @Transactional
    public Relatorios.RelatorioGrupoVip relatorios(@QueryParam("meses") Integer meses) {
        int m = meses == null ? 12 : Math.max(3, Math.min(24, meses));
        return relatorios.montar(storeId, m);
    }

    @GET
    @Path("/dashboard")
    @Transactional
    public DashboardGrupoVip dashboard() {
        Membros.Base base = membros.base(storeId);
        Config config = base.config;
        LocalDate hoje = Membros.hoje();
        YearMonth mes = YearMonth.from(hoje);
        YearMonth anterior = mes.minusMonths(1);

        // ---------- Indicadores ----------
        int ativos = (int) base.estados.values().stream().filter(Membros.Estado::temAcesso).count();
        int ativosAntes = base.ativosEm(anterior.atEndOfMonth());

        List<Conteudo> publicados = Conteudo.list("storeId = ?1 and status = ?2", storeId, Conteudo.PUBLICADO);
        int conteudosMes = (int) publicados.stream().filter(c -> noMes(c.publicadoEm, mes)).count();
        int conteudosAntes = (int) publicados.stream().filter(c -> noMes(c.publicadoEm, anterior)).count();

        List<ConteudoView> views = ConteudoView.list("storeId", storeId);
        int viewsMes = (int) views.stream().filter(v -> noMes(v.vistoEm, mes)).count();
        int viewsAntes = (int) views.stream().filter(v -> noMes(v.vistoEm, anterior)).count();

        List<Pagamento> pagosMes = base.pagamentos.stream()
                .filter(p -> Pagamento.PAGO.equals(p.status) && noMes(p.pagoEm, mes))
                .toList();
        BigDecimal receita = soma(pagosMes);
        BigDecimal receitaAntes = soma(base.pagamentos.stream()
                .filter(p -> Pagamento.PAGO.equals(p.status) && noMes(p.pagoEm, anterior))
                .toList());
        BigDecimal ticket = pagosMes.isEmpty() ? BigDecimal.ZERO
                : receita.divide(BigDecimal.valueOf(pagosMes.size()), 2, RoundingMode.HALF_UP);

        // Novos = 1º pagamento de uma assinatura feito neste mês.
        int novos = 0;
        for (Assinatura a : base.assinaturas) {
            OffsetDateTime primeiro = base.pagamentosDa(a).stream()
                    .filter(p -> Pagamento.PAGO.equals(p.status) && p.pagoEm != null)
                    .map(p -> p.pagoEm)
                    .min(Comparator.naturalOrder())
                    .orElse(null);
            if (noMes(primeiro, mes)) novos++;
        }

        Indicadores indicadores = new Indicadores(
                comparar(BigDecimal.valueOf(ativos), BigDecimal.valueOf(ativosAntes)),
                comparar(BigDecimal.valueOf(conteudosMes), BigDecimal.valueOf(conteudosAntes)),
                comparar(BigDecimal.valueOf(viewsMes), BigDecimal.valueOf(viewsAntes)),
                comparar(receita, receitaAntes),
                novos,
                numero(ticket));

        // ---------- Listas ----------
        List<MembroRecente> recentes = base.assinaturas.stream()
                .sorted(Comparator.comparing((Assinatura a) -> a.createdAt).reversed())
                .limit(6)
                .map(a -> {
                    List<Grupo> grupos = base.gruposDoPlano(a.plano);
                    return new MembroRecente(a.cliente.id, a.cliente.nome, a.plano.nome,
                            grupos.isEmpty() ? "—" : grupos.get(0).nome + (grupos.size() > 1 ? " +" + (grupos.size() - 1) : ""),
                            data(a.createdAt), base.estado(a.cliente.id).situacao());
                })
                .toList();

        List<CrescimentoMembros> crescimento = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            YearMonth ym = mes.minusMonths(i);
            LocalDate dia = i == 0 ? hoje : ym.atEndOfMonth();
            crescimento.add(new CrescimentoMembros(mesAbreviado(ym.atDay(1)), base.ativosEm(dia),
                    i == 0 ? hoje.toString() : null));
        }

        Map<UUID, Long> viewsPorConteudo = views.stream().collect(Collectors.groupingBy(v -> v.conteudo.id, Collectors.counting()));
        List<ConteudoAcessado> maisAcessados = publicados.stream()
                .filter(c -> viewsPorConteudo.containsKey(c.id))
                .sorted(Comparator.comparing((Conteudo c) -> viewsPorConteudo.get(c.id)).reversed())
                .limit(5)
                .map(c -> new ConteudoAcessado(c.titulo, viewsPorConteudo.get(c.id).intValue()))
                .toList();

        Map<String, Long> porPlano = base.estados.values().stream()
                .filter(Membros.Estado::temAcesso)
                .collect(Collectors.groupingBy(e -> e.plano().nome, Collectors.counting()));
        List<PlanoMembros> planos = porPlano.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(e -> new PlanoMembros(e.getKey(), ativos == 0 ? 0 : (int) Math.round(e.getValue() * 100.0 / ativos),
                        e.getValue().intValue()))
                .toList();

        List<Aviso> avisos = Anuncio.<Anuncio>find("storeId = ?1 order by enviadoEm desc", storeId)
                .page(0, 4)
                .stream()
                .map(a -> new Aviso(a.tipo, a.titulo, diaEHora(a.enviadoEm), a.destinatarios))
                .toList();

        Map<UUID, Long> dentro = Acesso.<Acesso>list("storeId = ?1 and status = ?2", storeId, Acesso.NO_GRUPO).stream()
                .collect(Collectors.groupingBy(a -> a.grupo.id, Collectors.counting()));
        List<DashboardGrupoVip.Grupo> grupos = base.grupos.stream()
                .filter(g -> g.ativo)
                .sorted(Comparator.comparing((br.com.clienteplus.modulos.grupovip.Grupo g) -> dentro.getOrDefault(g.id, 0L))
                        .reversed())
                .limit(5)
                .map(g -> new DashboardGrupoVip.Grupo(g.id, g.nome, g.plataforma, dentro.getOrDefault(g.id, 0L).intValue(),
                        g.cor, g.automatico(config)))
                .toList();

        List<DashboardGrupoVip.Evento> eventos = br.com.clienteplus.modulos.grupovip.Evento
                .<br.com.clienteplus.modulos.grupovip.Evento>list("storeId = ?1 and cancelado = false order by comecaEm", storeId)
                .stream()
                .filter(e -> !"encerrado".equals(e.status()))
                .limit(3)
                .map(e -> new DashboardGrupoVip.Evento(e.id, e.titulo, e.foto, diaEHora(e.comecaEm), e.status()))
                .toList();

        // ---------- Pendências e alertas ----------
        List<AcessosContrato.Pendencia> pend = controle.pendencias(base);
        int adicionar = (int) pend.stream().filter(p -> "adicionar".equals(p.acao())).count();
        int remover = (int) pend.stream().filter(p -> "remover".equals(p.acao())).count();
        int aguardando = (int) pend.stream().filter(p -> "aguardando".equals(p.acao())).count();
        int zap = (int) Mensagem.count("storeId = ?1 and status = ?2 and canal = ?3", storeId, Mensagem.PENDENTE, "whatsapp");
        int manuais = (int) ConteudoGrupo.count("storeId = ?1 and status = ?2", storeId, ConteudoGrupo.MANUAL);
        int chamados = (int) Chamado.count("storeId = ?1 and status = ?2", storeId, Chamado.ABERTO);
        int saques = (int) Saque.count("storeId = ?1 and status = ?2", storeId, Saque.SOLICITADO);
        int atrasadas = (int) base.estados.values().stream().filter(e -> e.diasAtraso() > 0 && e.pagoAte() != null).count();
        Pendencias pendencias = new Pendencias(adicionar, remover, aguardando, zap, manuais, chamados, saques, atrasadas);

        List<Alerta> alertas = new ArrayList<>();
        String erroRobo = robo.erro(storeId);
        if (config.robo() && erroRobo != null) {
            alertas.add(new Alerta("robo", "Robô do Telegram com problema", erroRobo, 1, "/grupo-vip/configuracoes"));
        }
        if (remover > 0) {
            alertas.add(new Alerta("remover", "Tirar dos grupos", remover == 1 ? "1 pessoa sem acesso ainda está no grupo"
                    : remover + " pessoas sem acesso ainda estão nos grupos", remover, "/grupo-vip/acessos"));
        }
        if (adicionar > 0) {
            alertas.add(new Alerta("adicionar", "Colocar nos grupos", adicionar == 1 ? "1 pessoa pagou e ainda não recebeu o acesso"
                    : adicionar + " pessoas pagaram e ainda não receberam o acesso", adicionar, "/grupo-vip/acessos"));
        }
        if (zap > 0) {
            alertas.add(new Alerta("whatsapp", "Mensagens para enviar", zap + " mensagens esperando envio pelo WhatsApp",
                    zap, "/grupo-vip/automacao"));
        }
        if (atrasadas > 0) {
            alertas.add(new Alerta("atrasadas", "Pagamentos em atraso", atrasadas + (atrasadas == 1 ? " membro" : " membros")
                    + " com mensalidade vencida", atrasadas, "/grupo-vip/assinaturas"));
        }
        if (manuais > 0) {
            alertas.add(new Alerta("publicacoes", "Publicar no WhatsApp", manuais + " publicações esperando você postar no grupo",
                    manuais, "/grupo-vip/conteudos"));
        }
        if (chamados > 0) {
            alertas.add(new Alerta("suporte", "Suporte", chamados + (chamados == 1 ? " conversa esperando" : " conversas esperando")
                    + " resposta", chamados, "/grupo-vip/suporte"));
        }
        if (saques > 0) {
            alertas.add(new Alerta("saques", "Saques para pagar", saques + (saques == 1 ? " pedido" : " pedidos") + " de saque",
                    saques, "/grupo-vip/saques"));
        }

        return new DashboardGrupoVip(
                new GrupoAtual(config.nomeNegocio),
                new Gestor(config.gestorNome, config.gestorSobrenome, config.gestorCargo),
                config.frase,
                config.fraseDestaque,
                indicadores,
                recentes,
                crescimento,
                maisAcessados,
                planos,
                avisos,
                grupos,
                eventos,
                pendencias,
                alertas,
                config.robo(),
                endereco.paginaVendas(config.slug, null));
    }

    private static boolean noMes(OffsetDateTime t, YearMonth mes) {
        return t != null && YearMonth.from(Financeiro.dia(t)).equals(mes);
    }

    private static BigDecimal soma(List<Pagamento> lista) {
        return lista.stream().map(p -> p.valor).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // Variação em % (inteira) em relação ao mês anterior.
    private static ComMesAnterior comparar(BigDecimal valor, BigDecimal antes) {
        int variacao = antes.signum() == 0
                ? (valor.signum() > 0 ? 100 : 0)
                : valor.subtract(antes).multiply(BigDecimal.valueOf(100)).divide(antes, 0, RoundingMode.HALF_UP).intValue();
        return new ComMesAnterior(numero(valor), variacao, numero(antes));
    }
}
