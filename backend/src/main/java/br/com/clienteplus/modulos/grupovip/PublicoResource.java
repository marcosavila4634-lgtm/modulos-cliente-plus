package br.com.clienteplus.modulos.grupovip;

import static br.com.clienteplus.modulos.comum.Formatos.numero;

import br.com.clienteplus.modulos.clienteplus.Assinatura;
import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.clienteplus.Pagamento;
import br.com.clienteplus.modulos.clienteplus.Plano;
import br.com.clienteplus.modulos.clienteplus.ProgramaIndicacao;
import br.com.clienteplus.modulos.clienteplus.Saque;
import br.com.clienteplus.modulos.comum.Erro;
import br.com.clienteplus.modulos.grupovip.PublicoContrato.*;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

// Páginas abertas pelos clientes (sem login no painel):
//   /g/<slug>          página de vendas com os planos e o checkout
//   /membro/<codigo>   área do membro: grupos, pagamentos (Pix), conteúdos,
//                      lives, indicações e suporte
//
// No laboratório o membro é identificado pelo código do link. No projeto
// principal: área do cliente do Cliente Plus (com login) e Edge Functions.
@Path("/grupo-vip")
@Produces(MediaType.APPLICATION_JSON)
public class PublicoResource {

    @Inject
    Membros membros;

    @Inject
    ControleAcesso controle;

    @Inject
    Automacoes automacoes;

    @Inject
    Indicacoes indicacoes;

    @Inject
    Financeiro financeiro;

    @Inject
    Suporte suporte;

    @Inject
    EnderecoPublico endereco;

    // ---------- Página de vendas ----------

    private static Config porSlug(String slug) {
        Config c = Config.<Config>find("slug", slug == null ? "" : slug.toLowerCase()).firstResult();
        if (c == null) throw Erro.naoEncontrado("Página não encontrada");
        return c;
    }

    static List<PlanoPublico> planosAVenda(Membros.Base base) {
        return Plano.<Plano>list("storeId = ?1 and ativo = true order by preco", base.storeId).stream()
                .filter(p -> !base.gruposDoPlano(p).isEmpty() && p.preco.signum() > 0)
                .map(p -> planoPublico(p, base))
                .toList();
    }

    static PlanoPublico planoPublico(Plano p, Membros.Base base) {
        return new PlanoPublico(p.id, p.nome, p.descricao, numero(p.preco), p.duracaoMeses,
                base.gruposDoPlano(p).stream()
                        .map(g -> new GrupoPublico(g.id, g.nome, g.plataforma, g.descricao))
                        .toList());
    }

    @GET
    @Path("/publico/{slug}")
    @Transactional
    public PaginaVendas pagina(@PathParam("slug") String slug, @QueryParam("ref") String ref) {
        Config c = porSlug(slug);
        Membros.Base base = new Membros.Base(c.storeId, c);
        String indicador = null;
        if (ref != null && !ref.isBlank()) {
            Membro m = Membro.<Membro>find("storeId = ?1 and codigo = ?2", c.storeId, ref.trim().toUpperCase()).firstResult();
            if (m != null) indicador = Membros.primeiroNome(m.cliente.nome);
        }
        List<String> beneficios = Arrays.stream(c.beneficios.split("\\R"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        int ativos = (int) base.estados.values().stream().filter(Membros.Estado::temAcesso).count();
        return new PaginaVendas(c.nomeNegocio, c.slug, c.descricaoPagina, beneficios, c.fotoCapa, c.whatsappSuporte,
                planosAVenda(base), indicador, ativos);
    }

    @GET
    @Path("/publico/{slug}/cupom")
    @Transactional
    public CupomAplicado cupom(@PathParam("slug") String slug, @QueryParam("codigo") String codigo,
                               @QueryParam("planoId") UUID planoId) {
        Config c = porSlug(slug);
        Plano p = membros.plano(c.storeId, planoId);
        Cupom cupom = cupomValido(c.storeId, codigo);
        BigDecimal desconto = desconto(cupom, p.preco);
        return new CupomAplicado(cupom.codigo, numero(desconto), numero(p.preco.subtract(desconto)));
    }

    static Cupom cupomValido(UUID storeId, String codigo) {
        String cod = codigo != null ? codigo.trim().toUpperCase() : "";
        Cupom c = Cupom.<Cupom>find("storeId = ?1 and codigo = ?2", storeId, cod).firstResult();
        if (c == null || !c.ativo) throw Erro.invalido("Cupom inválido");
        if (c.validade != null && c.validade.isBefore(Membros.hoje())) throw Erro.invalido("Este cupom expirou");
        if (c.limiteUsos != null && c.usos >= c.limiteUsos) throw Erro.invalido("Este cupom já foi usado o máximo de vezes");
        return c;
    }

    static BigDecimal desconto(Cupom c, BigDecimal preco) {
        BigDecimal d = "percentual".equals(c.tipo)
                ? preco.multiply(c.valor).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                : c.valor;
        return d.min(preco);
    }

    @POST
    @Path("/publico/{slug}/checkout")
    @Transactional
    public CheckoutFeito checkout(@PathParam("slug") String slug, PedidoCheckout pedido) {
        if (pedido == null) throw Erro.invalido("Preencha seus dados");
        Config config = porSlug(slug);
        UUID storeId = config.storeId;
        Plano plano = membros.plano(storeId, pedido.planoId());
        Membros.Base base = new Membros.Base(storeId, config);
        if (!plano.ativo || base.gruposDoPlano(plano).isEmpty()) throw Erro.invalido("Este plano não está à venda");
        String telefone = Membros.numeros(pedido.telefone());
        if (telefone == null) throw Erro.invalido("Informe seu WhatsApp com DDD");
        if (telefone.startsWith("55") && telefone.length() >= 12) telefone = telefone.substring(2);
        String email = Membros.limpo(pedido.email());

        // Já é cliente? (mesmo WhatsApp ou e-mail)
        Cliente c = Cliente.<Cliente>find("storeId = ?1 and telefone = ?2", storeId, telefone).firstResult();
        if (c == null && email != null) {
            c = Cliente.<Cliente>find("storeId = ?1 and lower(email) = ?2", storeId, email.toLowerCase()).firstResult();
        }
        Membros.Dados dados = new Membros.Dados(pedido.nome(), email, telefone, pedido.cpf(), null,
                pedido.telegramUsuario(), null);
        if (c == null) {
            c = membros.cadastrar(storeId, dados, "pagina");
        } else {
            Membros.Estado e = base.estado(c.id);
            if (e != null && e.temAcesso()) {
                throw Erro.conflito("Você já tem uma assinatura ativa. Use o link da sua área de membro, "
                        + "que enviamos no seu WhatsApp, ou fale com o suporte.");
            }
            Membro m = membros.membro(c);
            if (pedido.telegramUsuario() != null && !pedido.telegramUsuario().isBlank()) {
                m.telegramUsuario = pedido.telegramUsuario().trim().replaceFirst("^@", "");
            }
        }
        Membro membro = membros.membro(c);

        // Indicação: quem mandou o link (nunca a própria pessoa).
        if (c.indicadoPor == null && pedido.ref() != null && !pedido.ref().isBlank()) {
            Membro indicador = Membro.<Membro>find("storeId = ?1 and codigo = ?2", storeId,
                    pedido.ref().trim().toUpperCase()).firstResult();
            if (indicador != null && !indicador.cliente.id.equals(c.id)) c.indicadoPor = indicador.cliente;
        }

        Cupom cupom = null;
        BigDecimal desconto = BigDecimal.ZERO;
        if (pedido.cupom() != null && !pedido.cupom().isBlank()) {
            cupom = cupomValido(storeId, pedido.cupom());
            desconto = desconto(cupom, plano.preco);
            cupom.usos++;
        }
        Pagamento p = membros.assinar(storeId, c, plano, Membros.hoje(), plano.preco.subtract(desconto));

        Checkout ch = new Checkout();
        ch.storeId = storeId;
        ch.cliente = c;
        ch.plano = plano;
        ch.pagamento = p;
        ch.cupom = cupom;
        ch.preco = plano.preco;
        ch.desconto = desconto;
        ch.indicadoPorCodigo = pedido.ref() != null && !pedido.ref().isBlank() ? pedido.ref().trim().toUpperCase() : null;
        ch.persist();

        if (Pagamento.PAGO.equals(p.status)) automacoes.rodar(storeId); // 100% de desconto
        return new CheckoutFeito(membro.codigo);
    }

    // ---------- Área do membro ----------

    @GET
    @Path("/membro/{codigo}")
    @Transactional
    public AreaMembro area(@PathParam("codigo") String codigo) {
        Membro m = membros.porCodigo(codigo);
        Cliente c = m.cliente;
        Config config = membros.config(m.storeId);
        Membros.Base base = new Membros.Base(m.storeId, config);
        Membros.Estado e = base.estado(c.id);

        // Grupos: os que tem direito e os que já esteve.
        List<GrupoArea> grupos = new ArrayList<>();
        var acessos = Acesso.<Acesso>list("cliente", c).stream().collect(Collectors.toMap(a -> a.grupo.id, a -> a));
        for (Grupo g : base.grupos) {
            if (!g.ativo) continue;
            boolean direito = e.gruposComDireito().contains(g.id);
            Acesso a = acessos.get(g.id);
            if (!direito && (a == null || Acesso.REMOVIDO.equals(a.status))) continue;
            String link = null;
            if (direito) {
                if (g.automatico(config)) link = a != null && Acesso.CONVIDADO.equals(a.status) ? a.conviteLink : null;
                else link = g.linkConvite;
            }
            grupos.add(new GrupoArea(g.id, g.nome, g.plataforma, g.descricao,
                    g.automatico(config) ? "automatico" : "assistido", a != null ? a.status : null, link));
        }

        List<CobrancaArea> cobrancas = Pagamento.<Pagamento>list("cliente = ?1 order by vencimento desc", c).stream()
                .filter(p -> !Pagamento.CANCELADO.equals(p.status))
                .limit(24)
                .map(p -> {
                    String status = Financeiro.statusCobranca(p);
                    PixJson pix = null;
                    if (Pagamento.PENDENTE.equals(p.status) && config.chavePix != null && p.valor.signum() > 0) {
                        String recebedor = config.nomeRecebedor != null ? config.nomeRecebedor : config.nomeNegocio;
                        pix = new PixJson(Pix.copiaECola(config.chavePix, recebedor, config.cidadeRecebedor, p.valor,
                                "GV" + p.id.toString().replace("-", "")), config.chavePix, recebedor);
                    }
                    return new CobrancaArea(p.id, p.assinatura != null ? p.assinatura.plano.nome : p.descricao,
                            numero(p.valor), p.vencimento, status, p.pagoEm, p.formaPagamento, pix);
                })
                .toList();

        // Conteúdos da biblioteca: só para quem tem acesso.
        Set<UUID> vistos = ConteudoView.<ConteudoView>list("cliente", c).stream()
                .map(v -> v.conteudo.id)
                .collect(Collectors.toSet());
        List<ConteudoArea> conteudos = !e.temAcesso() ? List.of()
                : Conteudo.<Conteudo>list("storeId = ?1 and status = ?2 and naAreaMembro = true order by publicadoEm desc",
                                m.storeId, Conteudo.PUBLICADO).stream()
                        .map(x -> new ConteudoArea(x.id, x.titulo, x.texto,
                                x.categoria != null ? x.categoria.nome : null,
                                x.categoria != null ? x.categoria.cor : null, x.midiaUrl, x.midiaTipo, x.link,
                                x.publicadoEm, vistos.contains(x.id)))
                        .toList();

        List<LiveArea> lives = Evento.<Evento>list("storeId = ?1 and cancelado = false order by comecaEm", m.storeId)
                .stream()
                .filter(ev -> !"encerrado".equals(ev.status()) || ev.comecaEm.isAfter(java.time.OffsetDateTime.now().minusDays(7)))
                .filter(ev -> ev.grupo == null || e.gruposComDireito().contains(ev.grupo.id) || !e.temAcesso())
                .map(ev -> new LiveArea(ev.id, ev.titulo, ev.descricao, ev.foto, e.temAcesso() ? ev.link : null,
                        ev.comecaEm, ev.duracaoMinutos, ev.status()))
                .toList();

        return new AreaMembro(
                config.nomeNegocio,
                config.whatsappSuporte,
                endereco.paginaVendas(config.slug, null),
                c.nome,
                m.codigo,
                e.situacao(),
                e.diasAtraso(),
                config.toleranciaDias,
                e.plano() != null ? planoPublico(e.plano(), base) : null,
                e.assinatura() != null ? e.assinatura().status : null,
                e.proxima() != null ? e.proxima().vencimento : null,
                e.pagoAte(),
                grupos,
                cobrancas,
                new TelegramArea(config.robo(), m.telegramId != null, m.telegramUsuario,
                        config.robo() ? Telegram.linkRobo(config.telegramBotUsuario, m.codigo) : null),
                conteudos,
                lives,
                indicacao(config, base, m),
                suporte.listar(m.storeId, c),
                planosAVenda(base),
                config.chavePix != null);
    }

    private IndicacaoArea indicacao(Config config, Membros.Base base, Membro m) {
        Cliente c = m.cliente;
        List<Indicacoes.Comissao> todas = indicacoes.comissoes(m.storeId);
        Indicacoes.Saldo saldo = indicacoes.saldos(m.storeId, todas)
                .getOrDefault(c.id, new Indicacoes.Saldo(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO));
        List<Indicado> indicados = base.clientes.stream()
                .filter(x -> x.indicadoPor != null && x.indicadoPor.id.equals(c.id))
                .sorted(Comparator.comparing((Cliente x) -> x.createdAt).reversed())
                .map(x -> new Indicado(Membros.primeiroNome(x.nome), base.estado(x.id).temAcesso(), x.createdAt))
                .toList();
        List<ComissaoArea> minhas = todas.stream()
                .filter(x -> x.beneficiario().id.equals(c.id))
                .sorted(Comparator.comparing(Indicacoes.Comissao::data).reversed())
                .limit(30)
                .map(x -> new ComissaoArea(x.data(), Membros.primeiroNome(x.pagador().nome), x.nivel(), numero(x.valor())))
                .toList();
        List<SaqueArea> saques = Saque.<Saque>list("cliente = ?1 order by createdAt desc", c).stream()
                .map(s -> new SaqueArea(s.id, s.createdAt, numero(s.valor), s.status, s.motivo))
                .toList();
        ProgramaIndicacao prog = ProgramaIndicacao.<ProgramaIndicacao>find("storeId", m.storeId).firstResult();
        List<Number> pct = prog == null ? List.of(10, 5, 2)
                : List.of(numero(prog.nivel1Pct), numero(prog.nivel2Pct), numero(prog.nivel3Pct));
        return new IndicacaoArea(endereco.paginaVendas(config.slug, m.codigo), pct, indicados, numero(saldo.ganho()),
                numero(saldo.disponivel().max(BigDecimal.ZERO)), numero(saldo.emAnalise()), numero(saldo.sacado()),
                minhas, saques);
    }

    // LABORATÓRIO: simula a confirmação do Pix pelo banco. No projeto
    // principal isto é o webhook do gateway de pagamento do Cliente Plus.
    @POST
    @Path("/membro/{codigo}/cobrancas/{id}/simular-pagamento")
    @Transactional
    public AreaMembro simularPagamento(@PathParam("codigo") String codigo, @PathParam("id") UUID id) {
        Membro m = membros.porCodigo(codigo);
        Pagamento p = membros.pagamento(m.storeId, id);
        if (!p.cliente.id.equals(m.cliente.id)) throw Erro.naoEncontrado("Cobrança não encontrada");
        membros.receber(m.storeId, id, "pix");
        automacoes.rodar(m.storeId);
        return area(codigo);
    }

    // Assinar de novo (ou trocar de plano antes de pagar).
    @POST
    @Path("/membro/{codigo}/assinar")
    @Transactional
    public AreaMembro assinar(@PathParam("codigo") String codigo, Assinar pedido) {
        Membro m = membros.porCodigo(codigo);
        Config config = membros.config(m.storeId);
        Membros.Base base = new Membros.Base(m.storeId, config);
        if (base.estado(m.cliente.id).temAcesso()) throw Erro.conflito("Sua assinatura já está ativa");
        Plano p = membros.plano(m.storeId, pedido != null ? pedido.planoId() : null);
        if (base.gruposDoPlano(p).isEmpty()) throw Erro.invalido("Este plano não está à venda");
        membros.assinar(m.storeId, m.cliente, p, Membros.hoje(), null);
        return area(codigo);
    }

    @POST
    @Path("/membro/{codigo}/cancelar")
    @Transactional
    public AreaMembro cancelar(@PathParam("codigo") String codigo) {
        Membro m = membros.porCodigo(codigo);
        Assinatura a = membros.assinaturaAtiva(m.cliente);
        if (a == null) throw Erro.conflito("Você não tem assinatura ativa");
        membros.cancelar(m.storeId, m.cliente);
        automacoes.rodar(m.storeId);
        return area(codigo);
    }

    // Gera o link de entrada de um grupo do Telegram (robô).
    @POST
    @Path("/membro/{codigo}/grupos/{grupoId}/link")
    @Transactional
    public AreaMembro gerarLink(@PathParam("codigo") String codigo, @PathParam("grupoId") UUID grupoId) {
        Membro m = membros.porCodigo(codigo);
        Config config = membros.config(m.storeId);
        Membros.Base base = new Membros.Base(m.storeId, config);
        if (!base.estado(m.cliente.id).gruposComDireito().contains(grupoId)) {
            throw Erro.invalido("Seu plano não inclui este grupo ou o pagamento está pendente");
        }
        Grupo g = base.grupoPorId.get(grupoId);
        if (!g.automatico(config)) throw Erro.invalido("A equipe vai te adicionar neste grupo");
        try {
            controle.convidarNoTelegram(config, g, m.cliente, m, true, false);
        } catch (Telegram.ErroTelegram e) {
            throw Erro.invalido("Não foi possível gerar o link agora: " + e.getMessage());
        }
        return area(codigo);
    }

    @POST
    @Path("/membro/{codigo}/conteudos/{id}/ver")
    @Transactional
    public void ver(@PathParam("codigo") String codigo, @PathParam("id") UUID id) {
        Membro m = membros.porCodigo(codigo);
        Conteudo x = Conteudo.findById(id);
        if (x == null || !x.storeId.equals(m.storeId)) throw Erro.naoEncontrado("Conteúdo não encontrado");
        ConteudoView v = new ConteudoView();
        v.storeId = m.storeId;
        v.conteudo = x;
        v.cliente = m.cliente;
        v.vistoEm = java.time.OffsetDateTime.now();
        v.persist();
    }

    @POST
    @Path("/membro/{codigo}/saques")
    @Transactional
    public AreaMembro sacar(@PathParam("codigo") String codigo, PedidoSaque pedido) {
        Membro m = membros.porCodigo(codigo);
        if (pedido == null) throw Erro.invalido("Informe o valor");
        financeiro.pedirSaque(m.storeId, m.cliente, pedido.valor(), pedido.chavePix());
        return area(codigo);
    }

    @POST
    @Path("/membro/{codigo}/chamados")
    @Transactional
    public AreaMembro abrirChamado(@PathParam("codigo") String codigo, NovoChamado pedido) {
        Membro m = membros.porCodigo(codigo);
        if (pedido == null) throw Erro.invalido("Escreva sua mensagem");
        suporte.abrir(m.cliente, pedido.assunto(), pedido.texto());
        return area(codigo);
    }

    @POST
    @Path("/membro/{codigo}/chamados/{id}")
    @Transactional
    public AreaMembro responderChamado(@PathParam("codigo") String codigo, @PathParam("id") UUID id, Texto pedido) {
        Membro m = membros.porCodigo(codigo);
        suporte.respostaDoMembro(m.cliente, id, pedido != null ? pedido.texto() : null);
        return area(codigo);
    }
}
