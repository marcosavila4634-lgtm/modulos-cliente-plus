package br.com.clienteplus.modulos.grupovip;

import static br.com.clienteplus.modulos.comum.Formatos.numero;

import br.com.clienteplus.modulos.clienteplus.Assinatura;
import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.clienteplus.Pagamento;
import br.com.clienteplus.modulos.clienteplus.Plano;
import br.com.clienteplus.modulos.comum.Erro;
import br.com.clienteplus.modulos.grupovip.FinanceiroContrato.Receber;
import br.com.clienteplus.modulos.grupovip.MembrosContrato.*;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.math.BigDecimal;
import java.text.Collator;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.eclipse.microprofile.config.inject.ConfigProperty;

// Membros dos grupos (clientes do Cliente Plus), assinaturas e cobranças.
@Path("/grupo-vip/membros")
@Produces(MediaType.APPLICATION_JSON)
public class MembrosResource {

    private static final Collator ALFABETICA = Collator.getInstance(Locale.of("pt", "BR"));
    static final List<String> SITUACOES = List.of(
            "em_dia", "vencendo", "atrasado", "bloqueado", "aguardando_pagamento", "cancelando", "sem_plano");

    // Loja de exemplo, até existir login (application.properties).
    @ConfigProperty(name = "grupo-vip.store-id")
    UUID storeId;

    @Inject
    Membros membros;

    @Inject
    ControleAcesso controle;

    @Inject
    Automacoes automacoes;

    @Inject
    Mensageiro mensageiro;

    @Inject
    Indicacoes indicacoes;

    @Inject
    EnderecoPublico endereco;

    @GET
    @Transactional
    public ListaMembros listar() {
        Membros.Base base = membros.base(storeId);
        Map<UUID, Long> dentro = Acesso.<Acesso>list("storeId = ?1 and status = ?2", storeId, Acesso.NO_GRUPO).stream()
                .collect(Collectors.groupingBy(a -> a.cliente.id, Collectors.counting()));

        List<MembroResumo> lista = base.estados.values().stream()
                .map(e -> {
                    Cliente c = e.cliente();
                    Membro m = e.membro();
                    Plano plano = e.plano();
                    if (plano == null) {
                        List<Assinatura> doCliente = base.assinaturasPorCliente.getOrDefault(c.id, List.of());
                        if (!doCliente.isEmpty()) plano = doCliente.get(doCliente.size() - 1).plano;
                    }
                    return new MembroResumo(
                            c.id,
                            c.nome,
                            c.telefone,
                            c.email,
                            m != null ? m.telegramUsuario : null,
                            m != null && m.telegramId != null,
                            plano != null ? plano.nome : null,
                            e.proxima() != null ? e.proxima().vencimento : null,
                            e.pagoAte(),
                            e.situacao(),
                            e.diasAtraso(),
                            dentro.getOrDefault(c.id, 0L).intValue(),
                            e.gruposComDireito().size(),
                            c.createdAt,
                            m != null ? m.origem : "manual",
                            c.indicadoPor != null ? c.indicadoPor.nome : null);
                })
                .sorted(Comparator.comparing(MembroResumo::nome, ALFABETICA))
                .toList();

        Map<String, Integer> contagem = new LinkedHashMap<>();
        contagem.put("todos", lista.size());
        for (String s : SITUACOES) contagem.put(s, 0);
        lista.forEach(r -> contagem.merge(r.situacao(), 1, Integer::sum));

        List<PlanoJson> planos = Plano.<Plano>list("storeId = ?1 order by preco", storeId).stream()
                .map(p -> Visoes.plano(p, base))
                .toList();
        return new ListaMembros(lista, contagem, planos);
    }

    @GET
    @Path("/{id}")
    @Transactional
    public MembroDetalhe buscar(@PathParam("id") UUID id) {
        return detalhe(membros.cliente(storeId, id));
    }

    @POST
    @Transactional
    public MembroDetalhe cadastrar(NovoMembro pedido) {
        if (pedido == null) throw Erro.invalido("Preencha os dados do membro");
        Cliente c = membros.cadastrar(storeId, pedido.dados(), "manual");
        if (pedido.planoId() != null) {
            Pagamento p = membros.assinar(storeId, c, membros.plano(storeId, pedido.planoId()), pedido.inicio(), null);
            if (pedido.formaPagamento() != null && Pagamento.PENDENTE.equals(p.status)) {
                membros.receber(storeId, p.id, pedido.formaPagamento());
            }
            automacoes.rodar(storeId);
        }
        return detalhe(c);
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public MembroDetalhe atualizar(@PathParam("id") UUID id, DadosMembro dados) {
        if (dados == null) throw Erro.invalido("Preencha os dados do membro");
        return detalhe(membros.atualizar(storeId, id, dados.dados()));
    }

    @POST
    @Path("/{id}/assinatura")
    @Transactional
    public MembroDetalhe assinar(@PathParam("id") UUID id, Assinar pedido) {
        if (pedido == null) throw Erro.invalido("Escolha um plano");
        Cliente c = membros.cliente(storeId, id);
        membros.membro(c);
        Pagamento p = membros.assinar(storeId, c, membros.plano(storeId, pedido.planoId()), pedido.inicio(), null);
        if (pedido.formaPagamento() != null && Pagamento.PENDENTE.equals(p.status)) {
            membros.receber(storeId, p.id, pedido.formaPagamento());
        }
        automacoes.rodar(storeId);
        return detalhe(c);
    }

    @POST
    @Path("/{id}/assinatura/cancelar")
    @Transactional
    public MembroDetalhe cancelar(@PathParam("id") UUID id) {
        Cliente c = membros.cliente(storeId, id);
        membros.cancelar(storeId, c);
        automacoes.rodar(storeId);
        return detalhe(c);
    }

    @POST
    @Path("/{id}/bloquear")
    @Transactional
    public MembroDetalhe bloquear(@PathParam("id") UUID id, Bloquear pedido) {
        membros.bloquear(storeId, id, pedido != null && pedido.bloqueado());
        automacoes.rodar(storeId);
        return detalhe(membros.cliente(storeId, id));
    }

    @POST
    @Path("/cobrancas/{pagamentoId}/receber")
    @Transactional
    public MembroDetalhe receber(@PathParam("pagamentoId") UUID pagamentoId, Receber pedido) {
        Pagamento p = membros.pagamento(storeId, pagamentoId);
        membros.receber(storeId, pagamentoId, pedido != null ? pedido.formaPagamento() : null);
        automacoes.rodar(storeId);
        return detalhe(p.cliente);
    }

    // Mensagem avulsa para o membro (vai pela caixa de saída).
    @POST
    @Path("/{id}/mensagem")
    @Transactional
    public MensagemJson mensagem(@PathParam("id") UUID id, TextoLivre pedido) {
        String texto = pedido != null && pedido.texto() != null ? pedido.texto().trim() : "";
        if (texto.isEmpty()) throw Erro.invalido("Escreva a mensagem");
        Cliente c = membros.cliente(storeId, id);
        Config config = membros.config(storeId);
        Mensagem m = mensageiro.criar(config, c, membros.membro(c), "manual", texto, null);
        if (m == null) throw Erro.invalido("Este membro não tem WhatsApp nem Telegram conectado");
        if ("telegram".equals(m.canal)) mensageiro.enviar(config, m);
        return Visoes.mensagem(m);
    }

    // ---------- Montagem da ficha ----------

    MembroDetalhe detalhe(Cliente c) {
        Membro m = membros.membro(c);
        Membros.Base base = membros.base(storeId);
        Membros.Estado e = base.estado(c.id);
        Config config = base.config;

        AssinaturaAtual assinatura = null;
        Assinatura a = e.assinatura();
        if (a == null) {
            List<Assinatura> doCliente = base.assinaturasPorCliente.getOrDefault(c.id, List.of());
            if (!doCliente.isEmpty()) a = doCliente.get(doCliente.size() - 1);
        }
        if (a != null) {
            Pagamento prox = e.proxima();
            assinatura = new AssinaturaAtual(a.id, Visoes.plano(a.plano, base), numero(a.valor), a.inicio, a.status,
                    prox != null ? prox.vencimento : null, prox != null ? prox.id : null,
                    prox != null ? numero(prox.valor) : null, base.pagoAte(a), a.canceladaEm);
        }

        Map<UUID, String> pendencias = new LinkedHashMap<>();
        controle.pendencias(base).stream()
                .filter(p -> p.clienteId().equals(c.id))
                .forEach(p -> pendencias.put(p.grupoId(), p.acao()));
        Map<UUID, Acesso> acessos = Acesso.<Acesso>list("cliente", c).stream()
                .collect(Collectors.toMap(x -> x.grupo.id, x -> x));
        List<GrupoDoMembro> grupos = new ArrayList<>();
        for (Grupo g : base.grupos) {
            Acesso ac = acessos.get(g.id);
            boolean direito = e.gruposComDireito().contains(g.id);
            if (!direito && ac == null) continue;
            grupos.add(new GrupoDoMembro(g.id, g.nome, g.plataforma, g.automatico(config), direito,
                    ac != null ? ac.status : null, ac != null ? ac.conviteLink : null, ac != null ? ac.entrouEm : null,
                    pendencias.get(g.id)));
        }

        var daPagina = Financeiro.pagamentosDaPagina(storeId);
        List<FinanceiroContrato.Cobranca> cobrancas = Pagamento.<Pagamento>list("cliente = ?1 order by vencimento desc", c)
                .stream()
                .map(p -> Financeiro.cobranca(p, daPagina))
                .toList();

        List<AcessosContrato.EventoAcesso> historico = AcessoEvento.<AcessoEvento>list(
                        "cliente = ?1 order by momento desc", c).stream()
                .limit(30)
                .map(Visoes::evento)
                .toList();

        List<MensagemJson> mensagens = Mensagem.<Mensagem>list("cliente = ?1 order by criadaEm desc", c).stream()
                .limit(30)
                .map(Visoes::mensagem)
                .toList();

        Pessoa indicadoPor = c.indicadoPor != null
                ? new Pessoa(c.indicadoPor.id, c.indicadoPor.nome, base.estado(c.indicadoPor.id).situacao())
                : null;
        List<Pessoa> indicados = base.clientes.stream()
                .filter(x -> x.indicadoPor != null && x.indicadoPor.id.equals(c.id))
                .map(x -> new Pessoa(x.id, x.nome, base.estado(x.id).situacao()))
                .sorted(Comparator.comparing(Pessoa::nome, ALFABETICA))
                .toList();
        Indicacoes.Saldo saldo = indicacoes.saldo(storeId, c.id);

        return new MembroDetalhe(
                c.id,
                c.nome,
                c.email,
                c.telefone,
                c.cpf,
                c.dataNascimento,
                m.telegramUsuario,
                m.telegramId != null,
                m.observacoes,
                m.bloqueado,
                m.codigo,
                m.origem,
                c.createdAt,
                e.situacao(),
                e.diasAtraso(),
                e.motivoBloqueio(),
                config.toleranciaDias,
                assinatura,
                grupos,
                cobrancas,
                historico,
                mensagens,
                indicadoPor,
                indicados,
                numero(saldo.ganho()),
                numero(saldo.disponivel().max(BigDecimal.ZERO)),
                new Links(endereco.areaMembro(m.codigo), endereco.paginaVendas(config.slug, m.codigo),
                        config.robo() ? Telegram.linkRobo(config.telegramBotUsuario, m.codigo) : null));
    }
}
