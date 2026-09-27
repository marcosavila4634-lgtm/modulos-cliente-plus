package br.com.clienteplus.modulos.grupovip;

import static br.com.clienteplus.modulos.comum.Formatos.FUSO;

import br.com.clienteplus.modulos.clienteplus.Assinatura;
import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.clienteplus.Pagamento;
import br.com.clienteplus.modulos.clienteplus.Plano;
import br.com.clienteplus.modulos.comum.Erro;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

// Membros do módulo Grupos VIP e suas assinaturas.
//
// Membro = cliente do Cliente Plus; assinatura e mensalidades = assinaturas e
// pagamentos do Cliente Plus (origem "grupo-vip"). A situação de cada membro
// é calculada a partir dos pagamentos:
//
//   aguardando_pagamento  assinou e ainda não pagou a 1ª mensalidade (sem acesso)
//   em_dia                próxima mensalidade vence daqui a mais de 3 dias
//   vencendo              vence em até 3 dias (continua com acesso)
//   atrasado              venceu há até N dias (tolerância; continua com acesso)
//   bloqueado             atraso maior que a tolerância, ou bloqueio manual (sem acesso)
//   cancelando            cancelou, mas o período pago ainda não acabou (com acesso)
//   sem_plano             sem assinatura (ou o período pago acabou)
//
// Quem tem acesso tem direito a todos os grupos ativos do plano.
@ApplicationScoped
public class Membros {

    public static final String ORIGEM = "grupo-vip";
    public static final int DIAS_VENCENDO = 3;
    static final Set<String> FORMAS_PAGAMENTO = Set.of("dinheiro", "pix", "cartao_credito", "cartao_debito", "boleto");
    static final Set<String> COM_ACESSO = Set.of("em_dia", "vencendo", "atrasado", "cancelando");

    public static LocalDate hoje() {
        return LocalDate.now(FUSO);
    }

    // Situação de um membro, calculada.
    public record Estado(
            Cliente cliente,
            Membro membro,
            // assinatura que vale agora (ativa, ou cancelada ainda no período pago)
            Assinatura assinatura,
            // mensalidade em aberto mais antiga
            Pagamento proxima,
            // até quando o que foi pago cobre (null = nunca pagou)
            LocalDate pagoAte,
            String situacao,
            // dias de atraso da próxima mensalidade (0 se não está atrasada)
            int diasAtraso,
            // "manual" | "atraso" | null
            String motivoBloqueio,
            Set<UUID> gruposComDireito) {

        public boolean temAcesso() {
            return COM_ACESSO.contains(situacao);
        }

        public Plano plano() {
            return assinatura != null ? assinatura.plano : null;
        }
    }

    // Tudo o que é preciso para calcular a situação de todos os membros de uma
    // loja, carregado de uma vez (poucas consultas ao banco).
    public static final class Base {
        public final UUID storeId;
        public final Config config;
        public final List<Grupo> grupos;
        public final Map<UUID, Grupo> grupoPorId;
        public final List<Cliente> clientes;
        public final Map<UUID, Membro> membroPorCliente;
        public final List<Assinatura> assinaturas;
        public final List<Pagamento> pagamentos;
        public final Map<UUID, List<Assinatura>> assinaturasPorCliente;
        public final Map<UUID, List<Pagamento>> pagamentosPorAssinatura;
        public final Map<UUID, List<Grupo>> gruposPorPlano;
        public final Map<UUID, Estado> estados = new HashMap<>();

        Base(UUID storeId, Config config) {
            this.storeId = storeId;
            this.config = config;
            grupos = Grupo.list("storeId = ?1 order by nome", storeId);
            grupoPorId = grupos.stream().collect(Collectors.toMap(g -> g.id, g -> g));
            clientes = Cliente.list("storeId", storeId);
            membroPorCliente = Membro.<Membro>list("storeId", storeId).stream()
                    .collect(Collectors.toMap(m -> m.cliente.id, m -> m));
            assinaturas = Assinatura.list("storeId = ?1 order by createdAt", storeId);
            pagamentos = Pagamento.list("storeId = ?1 order by vencimento", storeId);
            assinaturasPorCliente = assinaturas.stream().collect(Collectors.groupingBy(a -> a.cliente.id));
            pagamentosPorAssinatura = pagamentos.stream()
                    .filter(p -> p.assinatura != null)
                    .collect(Collectors.groupingBy(p -> p.assinatura.id));
            gruposPorPlano = PlanoGrupo.<PlanoGrupo>list("storeId", storeId).stream()
                    .filter(pg -> pg.grupo.ativo)
                    .collect(Collectors.groupingBy(pg -> pg.plano.id,
                            Collectors.mapping(pg -> pg.grupo, Collectors.toList())));
            LocalDate hoje = hoje();
            for (Cliente c : clientes) estados.put(c.id, calcular(c, hoje));
        }

        public Estado estado(UUID clienteId) {
            return estados.get(clienteId);
        }

        public List<Grupo> gruposDoPlano(Plano p) {
            return p == null ? List.of() : gruposPorPlano.getOrDefault(p.id, List.of());
        }

        public List<Pagamento> pagamentosDa(Assinatura a) {
            return pagamentosPorAssinatura.getOrDefault(a.id, List.of());
        }

        // Até quando os pagamentos desta assinatura cobrem (null = nenhum pago).
        public LocalDate pagoAte(Assinatura a) {
            return pagamentosDa(a).stream()
                    .filter(p -> Pagamento.PAGO.equals(p.status))
                    .map(p -> p.vencimento.plusMonths(a.plano.duracaoMeses))
                    .max(Comparator.naturalOrder())
                    .orElse(null);
        }

        private Estado calcular(Cliente c, LocalDate hoje) {
            Membro m = membroPorCliente.get(c.id);
            List<Assinatura> doCliente = assinaturasPorCliente.getOrDefault(c.id, List.of());
            Assinatura ativa = doCliente.stream()
                    .filter(a -> Assinatura.ATIVA.equals(a.status))
                    .reduce((a, b) -> b)
                    .orElse(null);

            Assinatura vale = null;
            Pagamento proxima = null;
            LocalDate pagoAte = null;
            String situacao;
            int atraso = 0;

            if (ativa != null) {
                vale = ativa;
                pagoAte = pagoAte(ativa);
                proxima = pagamentosDa(ativa).stream()
                        .filter(p -> Pagamento.PENDENTE.equals(p.status))
                        .findFirst()
                        .orElse(null);
                if (pagoAte == null) {
                    situacao = "aguardando_pagamento";
                } else if (proxima == null) {
                    situacao = "em_dia";
                } else {
                    long dias = ChronoUnit.DAYS.between(proxima.vencimento, hoje);
                    if (dias <= 0) situacao = -dias <= DIAS_VENCENDO ? "vencendo" : "em_dia";
                    else {
                        atraso = (int) dias;
                        situacao = dias <= config.toleranciaDias ? "atrasado" : "bloqueado";
                    }
                }
            } else {
                // A última assinatura cancelada ainda está no período pago?
                Assinatura ultima = doCliente.isEmpty() ? null : doCliente.get(doCliente.size() - 1);
                LocalDate ate = ultima != null ? pagoAte(ultima) : null;
                if (ate != null && ate.isAfter(hoje)) {
                    vale = ultima;
                    pagoAte = ate;
                    situacao = "cancelando";
                } else {
                    situacao = "sem_plano";
                    if (ultima != null) {
                        vale = null;
                        pagoAte = ate;
                    }
                }
            }

            String motivo = "bloqueado".equals(situacao) ? "atraso" : null;
            if (m != null && m.bloqueado && !"sem_plano".equals(situacao) && !"aguardando_pagamento".equals(situacao)) {
                situacao = "bloqueado";
                motivo = "manual";
            }

            Set<UUID> grupos = new LinkedHashSet<>();
            if (COM_ACESSO.contains(situacao) && vale != null) {
                for (Grupo g : gruposDoPlano(vale.plano)) grupos.add(g.id);
            }
            return new Estado(c, m, vale, proxima, pagoAte, situacao, atraso, motivo, grupos);
        }

        // Quantos clientes tinham algum pagamento cobrindo a data (com a
        // tolerância). Usado no gráfico de crescimento e nos relatórios.
        public int ativosEm(LocalDate dia) {
            Set<UUID> ativos = new java.util.HashSet<>();
            for (Pagamento p : pagamentos) {
                if (!Pagamento.PAGO.equals(p.status) || p.assinatura == null) continue;
                LocalDate fim = p.vencimento.plusMonths(p.assinatura.plano.duracaoMeses).plusDays(config.toleranciaDias);
                if (!p.vencimento.isAfter(dia) && fim.isAfter(dia)) ativos.add(p.cliente.id);
            }
            return ativos.size();
        }
    }

    public Config config(UUID storeId) {
        Config c = Config.<Config>find("storeId", storeId).firstResult();
        if (c == null) throw Erro.naoEncontrado("Grupos VIP ainda não configurado para esta loja");
        return c;
    }

    public Base base(UUID storeId) {
        return new Base(storeId, config(storeId));
    }

    public Cliente cliente(UUID storeId, UUID id) {
        Cliente c = Cliente.findById(id);
        if (c == null || !c.storeId.equals(storeId)) throw Erro.naoEncontrado("Membro não encontrado");
        return c;
    }

    public Membro membro(Cliente c) {
        Membro m = Membro.<Membro>find("cliente", c).firstResult();
        if (m == null) {
            // cliente criado fora do módulo (ex.: no Cliente Plus): cria o perfil
            m = new Membro();
            m.storeId = c.storeId;
            m.cliente = c;
            m.codigo = novoCodigo(c.nome);
            m.observacoes = "";
            m.origem = "manual";
            m.persist();
        }
        return m;
    }

    public Membro porCodigo(String codigo) {
        if (codigo == null) throw Erro.naoEncontrado("Link inválido");
        Membro m = Membro.<Membro>find("codigo", codigo.trim().toUpperCase()).firstResult();
        if (m == null) throw Erro.naoEncontrado("Link inválido ou expirado");
        return m;
    }

    // Código curto e fácil de ler: primeiras letras do nome + 4 caracteres.
    public static String novoCodigo(String nome) {
        String base = Normalizer.normalize(nome == null ? "" : nome, Normalizer.Form.NFD)
                .replaceAll("[^A-Za-z]", "")
                .toUpperCase();
        if (base.length() > 5) base = base.substring(0, 5);
        if (base.isEmpty()) base = "VIP";
        String letras = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
        SecureRandom r = new SecureRandom();
        while (true) {
            StringBuilder sb = new StringBuilder(base);
            for (int i = 0; i < 4; i++) sb.append(letras.charAt(r.nextInt(letras.length())));
            String codigo = sb.toString();
            if (Membro.count("codigo", codigo) == 0) return codigo;
        }
    }

    // ---------- Cadastro ----------

    public record Dados(String nome, String email, String telefone, String cpf, LocalDate dataNascimento,
                        String telegramUsuario, String observacoes) {}

    @Transactional
    public Cliente cadastrar(UUID storeId, Dados dados, String origem) {
        Cliente c = new Cliente();
        c.storeId = storeId;
        preencher(c, dados);
        c.persistAndFlush();
        Membro m = new Membro();
        m.storeId = storeId;
        m.cliente = c;
        m.codigo = novoCodigo(c.nome);
        m.origem = origem;
        m.observacoes = "";
        preencherMembro(m, dados);
        m.persist();
        return c;
    }

    @Transactional
    public Cliente atualizar(UUID storeId, UUID id, Dados dados) {
        Cliente c = cliente(storeId, id);
        preencher(c, dados);
        preencherMembro(membro(c), dados);
        return c;
    }

    private static void preencherMembro(Membro m, Dados d) {
        String tg = limpo(d.telegramUsuario());
        if (tg != null) tg = tg.replaceFirst("^@", "").replaceFirst("^https?://t\\.me/", "");
        if (tg != null && !tg.matches("[A-Za-z0-9_]{4,32}")) throw Erro.invalido("Usuário do Telegram inválido");
        m.telegramUsuario = tg;
        if (d.observacoes() != null) m.observacoes = d.observacoes().trim();
    }

    // Valida e normaliza os dados (telefone e CPF só com números).
    static void preencher(Cliente c, Dados d) {
        if (d == null) throw Erro.invalido("Preencha os dados do membro");
        String nome = limpo(d.nome());
        if (nome == null || nome.length() < 3) throw Erro.invalido("Informe o nome completo");

        String telefone = numeros(d.telefone());
        if (telefone != null && telefone.startsWith("55") && telefone.length() >= 12) telefone = telefone.substring(2);
        if (telefone != null && (telefone.length() < 10 || telefone.length() > 11)) {
            throw Erro.invalido("WhatsApp inválido: use DDD + número");
        }

        String cpf = numeros(d.cpf());
        if (cpf != null && cpf.length() != 11) throw Erro.invalido("CPF inválido: precisa ter 11 números");

        String email = limpo(d.email());
        if (email != null && !email.matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+")) throw Erro.invalido("E-mail inválido");

        if (d.dataNascimento() != null && d.dataNascimento().isAfter(hoje())) {
            throw Erro.invalido("Data de nascimento no futuro");
        }

        UUID eu = c.id != null ? c.id : new UUID(0, 0);
        if (telefone != null && Cliente.count("storeId = ?1 and telefone = ?2 and id <> ?3", c.storeId, telefone, eu) > 0) {
            throw Erro.conflito("Já existe um membro com este WhatsApp");
        }
        if (email != null && Cliente.count("storeId = ?1 and lower(email) = ?2 and id <> ?3", c.storeId,
                email.toLowerCase(), eu) > 0) {
            throw Erro.conflito("Já existe um membro com este e-mail");
        }

        c.nome = nome;
        c.telefone = telefone;
        c.cpf = cpf;
        c.email = email != null ? email.toLowerCase() : null;
        c.dataNascimento = d.dataNascimento();
    }

    static String limpo(String s) {
        if (s == null || s.isBlank()) return null;
        return s.trim().replaceAll("\\s+", " ");
    }

    static String numeros(String s) {
        if (s == null) return null;
        String n = s.replaceAll("\\D", "");
        return n.isEmpty() ? null : n;
    }

    // ---------- Assinatura e pagamentos ----------

    public Plano plano(UUID storeId, UUID planoId) {
        if (planoId == null) throw Erro.invalido("Escolha um plano");
        Plano p = Plano.findById(planoId);
        if (p == null || !p.storeId.equals(storeId)) throw Erro.invalido("Plano não encontrado");
        return p;
    }

    public Assinatura assinaturaAtiva(Cliente c) {
        return Assinatura.<Assinatura>find("cliente = ?1 and status = ?2 order by createdAt desc", c, Assinatura.ATIVA)
                .firstResult();
    }

    // Cria a assinatura e a 1ª mensalidade (vence no início). Se o plano é
    // gratuito (cortesia), a 1ª já nasce paga. valorPrimeira: com desconto de
    // cupom (null = preço do plano).
    @Transactional
    public Pagamento assinar(UUID storeId, Cliente c, Plano plano, LocalDate inicio, BigDecimal valorPrimeira) {
        if (!plano.ativo) throw Erro.invalido("Este plano não está disponível");
        Assinatura atual = assinaturaAtiva(c);
        if (atual != null) {
            boolean nuncaPagou = Pagamento.count("assinatura = ?1 and status = ?2", atual, Pagamento.PAGO) == 0;
            if (!nuncaPagou) {
                throw Erro.conflito("Este membro já tem uma assinatura ativa. Cancele a atual antes de trocar de plano.");
            }
            cancelarAssinatura(atual); // trocou de ideia antes de pagar
        }

        Assinatura a = new Assinatura();
        a.storeId = storeId;
        a.cliente = c;
        a.plano = plano;
        a.valor = plano.preco;
        a.status = Assinatura.ATIVA;
        a.inicio = inicio != null ? inicio : hoje();
        a.persist();

        Pagamento p = novaMensalidade(a, a.inicio, valorPrimeira != null ? valorPrimeira : a.valor);
        if (p.valor.signum() == 0) {
            p.status = Pagamento.PAGO;
            p.pagoEm = OffsetDateTime.now();
            novaMensalidade(a, p.vencimento.plusMonths(plano.duracaoMeses), a.valor);
        }
        return p;
    }

    @Transactional
    public void cancelar(UUID storeId, Cliente c) {
        Assinatura a = assinaturaAtiva(c);
        if (a == null) throw Erro.conflito("Este membro não tem assinatura ativa");
        cancelarAssinatura(a);
    }

    private static void cancelarAssinatura(Assinatura a) {
        a.status = Assinatura.CANCELADA;
        a.canceladaEm = OffsetDateTime.now();
        Pagamento.<Pagamento>list("assinatura = ?1 and status = ?2", a, Pagamento.PENDENTE)
                .forEach(p -> p.status = Pagamento.CANCELADO);
    }

    public Pagamento pagamento(UUID storeId, UUID id) {
        Pagamento p = Pagamento.findById(id);
        if (p == null || !p.storeId.equals(storeId)) throw Erro.naoEncontrado("Cobrança não encontrada");
        return p;
    }

    // Confirma um pagamento. Cria a próxima mensalidade enquanto a assinatura
    // estiver ativa. Devolve true se foi o 1º pagamento da assinatura (boas-vindas).
    @Transactional
    public boolean receber(UUID storeId, UUID pagamentoId, String forma) {
        Pagamento p = pagamento(storeId, pagamentoId);
        if (Pagamento.PAGO.equals(p.status)) throw Erro.conflito("Esta cobrança já foi paga");
        if (Pagamento.CANCELADO.equals(p.status)) throw Erro.conflito("Esta cobrança foi cancelada");
        if (forma == null || !FORMAS_PAGAMENTO.contains(forma)) throw Erro.invalido("Escolha a forma de pagamento");

        Assinatura a = p.assinatura;
        boolean primeiro = a != null && Pagamento.count("assinatura = ?1 and status = ?2", a, Pagamento.PAGO) == 0;
        p.status = Pagamento.PAGO;
        p.pagoEm = OffsetDateTime.now();
        p.formaPagamento = forma;

        if (a != null && Assinatura.ATIVA.equals(a.status)
                && Pagamento.count("assinatura = ?1 and status = ?2", a, Pagamento.PENDENTE) == 0) {
            // Quem paga atrasado mantém o dia de vencimento original.
            novaMensalidade(a, p.vencimento.plusMonths(a.plano.duracaoMeses), a.valor);
        }
        return primeiro;
    }

    private static Pagamento novaMensalidade(Assinatura a, LocalDate vencimento, BigDecimal valor) {
        Pagamento p = new Pagamento();
        p.storeId = a.storeId;
        p.assinatura = a;
        p.cliente = a.cliente;
        p.valor = valor;
        p.vencimento = vencimento;
        p.status = Pagamento.PENDENTE;
        p.origem = ORIGEM;
        p.persist();
        return p;
    }

    @Transactional
    public void bloquear(UUID storeId, UUID clienteId, boolean bloqueado) {
        membro(cliente(storeId, clienteId)).bloqueado = bloqueado;
    }

    // Todos os membros com acesso a um grupo (ou a qualquer grupo, se null).
    public static List<Estado> comAcesso(Base base, UUID grupoId) {
        List<Estado> lista = new ArrayList<>();
        for (Estado e : base.estados.values()) {
            if (!e.temAcesso()) continue;
            if (grupoId == null || e.gruposComDireito().contains(grupoId)) lista.add(e);
        }
        return lista;
    }

    public static String primeiroNome(String nome) {
        if (nome == null) return "";
        int espaco = nome.indexOf(' ');
        return espaco > 0 ? nome.substring(0, espaco) : nome;
    }
}
