package br.com.clienteplus.modulos.academia;

import static br.com.clienteplus.modulos.comum.Formatos.FUSO;
import static br.com.clienteplus.modulos.comum.Formatos.numero;

import br.com.clienteplus.modulos.academia.AlunosContrato.*;
import br.com.clienteplus.modulos.clienteplus.Assinatura;
import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.clienteplus.Pagamento;
import br.com.clienteplus.modulos.clienteplus.Plano;
import br.com.clienteplus.modulos.comum.Erro;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Set;
import java.util.UUID;

// Regras de alunos, matrículas e mensalidades do módulo Academia.
//
// - Ao matricular, é criada a primeira mensalidade (vence no dia do início).
// - Ao receber uma mensalidade, é criada a próxima (vencimento + duração do
//   plano), enquanto a matrícula estiver ativa. Assim sempre existe uma
//   mensalidade em aberto por matrícula.
// - Ao cancelar, as mensalidades em aberto são canceladas.
@ApplicationScoped
public class Matriculas {

    static final Set<String> FORMAS_PAGAMENTO = Set.of("dinheiro", "pix", "cartao_credito", "cartao_debito", "boleto");

    public static LocalDate hoje() {
        return LocalDate.now(FUSO);
    }

    // ---------- Consultas ----------

    public Cliente aluno(UUID storeId, UUID id) {
        Cliente c = Cliente.findById(id);
        if (c == null || !c.storeId.equals(storeId)) throw Erro.naoEncontrado("Aluno não encontrado");
        return c;
    }

    public Assinatura matriculaAtiva(Cliente aluno) {
        return Assinatura.<Assinatura>find("cliente = ?1 and status = ?2", aluno, Assinatura.ATIVA)
                .firstResult();
    }

    public Pagamento proximaMensalidade(Assinatura matricula) {
        if (matricula == null) return null;
        return Pagamento.<Pagamento>find(
                        "assinatura = ?1 and status = ?2 order by vencimento", matricula, Pagamento.PENDENTE)
                .firstResult();
    }

    public static String situacao(Assinatura ativa, Pagamento proxima) {
        if (ativa == null) return "sem_matricula";
        if (proxima != null && proxima.vencimento.isBefore(hoje())) return "em_atraso";
        return "ativo";
    }

    public static Cobranca cobranca(Pagamento p) {
        String status = switch (p.status) {
            case Pagamento.PAGO -> "paga";
            case Pagamento.CANCELADO -> "cancelada";
            default -> p.vencimento.isBefore(hoje()) ? "atrasada" : "pendente";
        };
        return new Cobranca(
                p.id,
                p.cliente.id,
                p.cliente.nome,
                p.assinatura.plano.nome,
                numero(p.valor),
                p.vencimento,
                status,
                p.pagoEm,
                p.formaPagamento);
    }

    public static PlanoJson plano(Plano p) {
        return new PlanoJson(p.id, p.nome, p.descricao, numero(p.preco), p.duracaoMeses);
    }

    public AlunoDetalhe detalhe(Cliente c) {
        Assinatura ativa = matriculaAtiva(c);
        Pagamento proxima = proximaMensalidade(ativa);
        MatriculaAtual matricula = ativa == null
                ? null
                : new MatriculaAtual(
                        ativa.id,
                        plano(ativa.plano),
                        numero(ativa.valor),
                        ativa.inicio,
                        proxima != null ? proxima.vencimento : null);
        return new AlunoDetalhe(
                c.id,
                c.nome,
                c.email,
                c.telefone,
                c.cpf,
                c.dataNascimento,
                c.createdAt,
                situacao(ativa, proxima),
                matricula,
                Pagamento.<Pagamento>list("cliente = ?1 order by vencimento desc", c).stream()
                        .map(Matriculas::cobranca)
                        .toList());
    }

    // ---------- Alterações ----------

    @Transactional
    public Cliente cadastrar(UUID storeId, DadosAluno dados) {
        Cliente c = new Cliente();
        c.storeId = storeId;
        preencher(c, dados);
        c.persistAndFlush(); // grava já, para created_at vir preenchido na resposta
        return c;
    }

    @Transactional
    public Cliente atualizar(UUID storeId, UUID id, DadosAluno dados) {
        Cliente c = aluno(storeId, id);
        preencher(c, dados);
        return c;
    }

    @Transactional
    public void matricular(UUID storeId, UUID alunoId, NovaMatricula pedido) {
        Cliente aluno = aluno(storeId, alunoId);
        if (pedido == null || pedido.planoId() == null) throw Erro.invalido("Escolha um plano");
        Plano plano = Plano.findById(pedido.planoId());
        if (plano == null || !plano.storeId.equals(storeId) || !plano.ativo) {
            throw Erro.invalido("Plano não encontrado");
        }
        if (matriculaAtiva(aluno) != null) {
            throw Erro.conflito("Este aluno já tem uma matrícula ativa. Cancele a atual antes de trocar de plano.");
        }

        Assinatura m = new Assinatura();
        m.storeId = storeId;
        m.cliente = aluno;
        m.plano = plano;
        m.valor = plano.preco;
        m.status = Assinatura.ATIVA;
        m.inicio = pedido.inicio() != null ? pedido.inicio() : hoje();
        m.persist();

        novaMensalidade(m, m.inicio);
    }

    @Transactional
    public void cancelarMatricula(UUID storeId, UUID alunoId) {
        Assinatura m = matriculaAtiva(aluno(storeId, alunoId));
        if (m == null) throw Erro.conflito("Este aluno não tem matrícula ativa");
        m.status = Assinatura.CANCELADA;
        m.canceladaEm = OffsetDateTime.now();
        Pagamento.<Pagamento>list("assinatura = ?1 and status = ?2", m, Pagamento.PENDENTE)
                .forEach(p -> p.status = Pagamento.CANCELADO);
    }

    @Transactional
    public Pagamento receber(UUID storeId, UUID pagamentoId, Receber pedido) {
        Pagamento p = Pagamento.findById(pagamentoId);
        if (p == null || !p.storeId.equals(storeId)) throw Erro.naoEncontrado("Mensalidade não encontrada");
        if (Pagamento.PAGO.equals(p.status)) throw Erro.conflito("Esta mensalidade já foi paga");
        if (Pagamento.CANCELADO.equals(p.status)) throw Erro.conflito("Esta mensalidade foi cancelada");
        String forma = pedido != null ? pedido.formaPagamento() : null;
        if (forma == null || !FORMAS_PAGAMENTO.contains(forma)) throw Erro.invalido("Escolha a forma de pagamento");

        p.status = Pagamento.PAGO;
        p.pagoEm = OffsetDateTime.now();
        p.formaPagamento = forma;

        Assinatura m = p.assinatura;
        boolean temOutraEmAberto = Pagamento.count("assinatura = ?1 and status = ?2", m, Pagamento.PENDENTE) > 0;
        if (Assinatura.ATIVA.equals(m.status) && !temOutraEmAberto) {
            novaMensalidade(m, p.vencimento.plusMonths(m.plano.duracaoMeses));
        }
        return p;
    }

    private static void novaMensalidade(Assinatura m, LocalDate vencimento) {
        Pagamento p = new Pagamento();
        p.storeId = m.storeId;
        p.assinatura = m;
        p.cliente = m.cliente;
        p.valor = m.valor;
        p.vencimento = vencimento;
        p.status = Pagamento.PENDENTE;
        p.origem = "academia";
        p.persist();
    }

    // Valida e normaliza os dados digitados (telefone e CPF só com números).
    private static void preencher(Cliente c, DadosAluno d) {
        if (d == null) throw Erro.invalido("Preencha os dados do aluno");
        String nome = limpo(d.nome());
        if (nome == null || nome.length() < 3) throw Erro.invalido("Informe o nome do aluno");

        String telefone = numeros(d.telefone());
        if (telefone != null && (telefone.length() < 10 || telefone.length() > 11)) {
            throw Erro.invalido("Telefone inválido: use DDD + número");
        }

        String cpf = numeros(d.cpf());
        if (cpf != null && cpf.length() != 11) throw Erro.invalido("CPF inválido: precisa ter 11 números");
        if (cpf != null) {
            boolean repetido = Cliente.count("storeId = ?1 and cpf = ?2 and id <> ?3",
                    c.storeId, cpf, c.id != null ? c.id : new UUID(0, 0)) > 0;
            if (repetido) throw Erro.conflito("Já existe um aluno com este CPF");
        }

        String email = limpo(d.email());
        if (email != null && !email.matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+")) throw Erro.invalido("E-mail inválido");

        if (d.dataNascimento() != null && d.dataNascimento().isAfter(hoje())) {
            throw Erro.invalido("Data de nascimento no futuro");
        }

        c.nome = nome;
        c.telefone = telefone;
        c.cpf = cpf;
        c.email = email != null ? email.toLowerCase() : null;
        c.dataNascimento = d.dataNascimento();
    }

    private static String limpo(String s) {
        if (s == null || s.isBlank()) return null;
        return s.trim().replaceAll("\\s+", " ");
    }

    private static String numeros(String s) {
        if (s == null) return null;
        String n = s.replaceAll("\\D", "");
        return n.isEmpty() ? null : n;
    }
}
