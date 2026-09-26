package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.academia.FinanceiroContrato.*;
import br.com.clienteplus.modulos.clienteplus.Assinatura;
import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.Erro;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import java.text.Collator;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

// Regras dos benefícios. Só alunos com matrícula ativa têm direito.
//
//   parceiro    = todos (cupom de loja parceira)
//   indicacao   = pelo menos <regra> indicados com matrícula ativa (uma vez)
//   fidelidade  = pelo menos <regra> meses desde a primeira matrícula (uma vez)
//   aniversario = no mês do aniversário (uma vez por ano)
//   frequencia  = pelo menos <regra> check-ins no mês (uma vez por mês)
// Benefício vencido (validade antes de hoje) ou desativado não pode ser resgatado.
@ApplicationScoped
public class Beneficios {

    static final Set<String> TIPOS = Set.of("parceiro", "indicacao", "fidelidade", "aniversario", "frequencia");
    private static final Collator ALFABETICA = Collator.getInstance(Locale.of("pt", "BR"));

    // Tudo o que a regra usa, calculado uma vez para a loja.
    record Base(
            List<Cliente> ativos,
            Map<UUID, Integer> indicadosAtivos,
            Map<UUID, LocalDate> primeiraMatricula,
            Map<UUID, Integer> checkinsMes,
            LocalDate hoje) {}

    Base base(UUID storeId) {
        LocalDate hoje = Matriculas.hoje();
        List<Assinatura> todas = Assinatura.list("storeId", storeId);
        Set<UUID> ativosIds = todas.stream()
                .filter(a -> Assinatura.ATIVA.equals(a.status))
                .map(a -> a.cliente.id)
                .collect(Collectors.toSet());
        Map<UUID, LocalDate> primeira = new HashMap<>();
        for (Assinatura a : todas) primeira.merge(a.cliente.id, a.inicio, (x, y) -> x.isBefore(y) ? x : y);

        List<Cliente> clientes = Cliente.list("storeId", storeId);
        Map<UUID, Integer> indicados = new HashMap<>();
        for (Cliente c : clientes) {
            if (c.indicadoPor != null && ativosIds.contains(c.id)) indicados.merge(c.indicadoPor.id, 1, Integer::sum);
        }
        Map<UUID, Integer> checkins = new HashMap<>();
        for (Acesso a : Acesso.<Acesso>list("storeId = ?1 and resultado = ?2 and momento >= ?3",
                storeId, Acesso.LIBERADO, Acessos.inicioDo(hoje.withDayOfMonth(1)))) {
            checkins.merge(a.cliente.id, 1, Integer::sum);
        }
        List<Cliente> ativos = clientes.stream()
                .filter(c -> ativosIds.contains(c.id))
                .sorted(Comparator.comparing((Cliente c) -> c.nome, ALFABETICA))
                .toList();
        return new Base(ativos, indicados, primeira, checkins, hoje);
    }

    static String referencia(Beneficio b, LocalDate hoje) {
        return switch (b.tipo) {
            case "aniversario" -> String.valueOf(hoje.getYear());
            case "frequencia" -> YearMonth.from(hoje).toString();
            default -> "";
        };
    }

    // Quanto o aluno já tem para a regra (indicados, meses, check-ins).
    static int atual(Beneficio b, Cliente c, Base base) {
        return switch (b.tipo) {
            case "indicacao" -> base.indicadosAtivos().getOrDefault(c.id, 0);
            case "fidelidade" -> {
                LocalDate inicio = base.primeiraMatricula().get(c.id);
                yield inicio == null ? 0 : (int) ChronoUnit.MONTHS.between(inicio, base.hoje());
            }
            case "frequencia" -> base.checkinsMes().getOrDefault(c.id, 0);
            case "aniversario" -> c.dataNascimento != null && c.dataNascimento.getMonth() == base.hoje().getMonth() ? 1 : 0;
            default -> 1;
        };
    }

    static int meta(Beneficio b) {
        return switch (b.tipo) {
            case "indicacao", "fidelidade", "frequencia" -> b.regra != null ? b.regra : 1;
            default -> 1;
        };
    }

    static String motivo(Beneficio b, int atual) {
        return switch (b.tipo) {
            case "indicacao" -> atual + (atual == 1 ? " indicado ativo" : " indicados ativos");
            case "fidelidade" -> atual + (atual == 1 ? " mês de casa" : " meses de casa");
            case "frequencia" -> atual + " check-ins no mês";
            case "aniversario" -> "Aniversário neste mês";
            default -> "Aluno ativo";
        };
    }

    static boolean valido(Beneficio b, LocalDate hoje) {
        return b.ativo && (b.validade == null || !b.validade.isBefore(hoje));
    }

    // "Indique mais 2 amigos", "Faltam 3 check-ins este mês"...
    static String progresso(Beneficio b, int atual) {
        int falta = meta(b) - atual;
        return switch (b.tipo) {
            case "indicacao" -> falta == 1 ? "Indique mais 1 amigo" : "Indique mais " + falta + " amigos";
            case "fidelidade" -> falta == 1 ? "Falta 1 mês" : "Faltam " + falta + " meses";
            case "frequencia" -> falta == 1 ? "Falta 1 check-in este mês" : "Faltam " + falta + " check-ins este mês";
            case "aniversario" -> "No mês do seu aniversário";
            default -> "";
        };
    }

    // ---------- Consultas ----------

    public Beneficio beneficio(UUID storeId, UUID id) {
        Beneficio b = Beneficio.findById(id);
        if (b == null || !b.storeId.equals(storeId)) throw Erro.naoEncontrado("Benefício não encontrado");
        return b;
    }

    List<BeneficioJson> listar(UUID storeId) {
        Base base = base(storeId);
        List<Resgate> resgates = Resgate.list("storeId", storeId);
        return Beneficio.<Beneficio>list("storeId", storeId).stream()
                .sorted(Comparator.comparing((Beneficio b) -> !b.ativo).thenComparing(b -> b.titulo, ALFABETICA))
                .map(b -> json(b, base, resgates))
                .toList();
    }

    BeneficioJson json(Beneficio b, Base base, List<Resgate> resgates) {
        String ref = referencia(b, base.hoje());
        List<Resgate> doPeriodo = resgates.stream()
                .filter(r -> r.beneficio.id.equals(b.id) && r.referencia.equals(ref))
                .toList();
        int elegiveis = valido(b, base.hoje())
                ? (int) base.ativos().stream().filter(c -> atual(b, c, base) >= meta(b)).count()
                : 0;
        return new BeneficioJson(b.id, b.titulo, b.descricao, b.tipo, b.regra, b.recompensa, b.parceiro, b.codigo,
                b.validade, b.ativo, elegiveis, doPeriodo.size(),
                (int) doPeriodo.stream().filter(r -> r.entregueEm == null).count());
    }

    public DetalheBeneficio detalhe(UUID storeId, UUID id) {
        Beneficio b = beneficio(storeId, id);
        Base base = base(storeId);
        String ref = referencia(b, base.hoje());
        List<Resgate> resgates = Resgate.list("storeId", storeId);
        Map<UUID, Resgate> porAluno = new HashMap<>();
        for (Resgate r : resgates) {
            if (r.beneficio.id.equals(b.id) && r.referencia.equals(ref)) porAluno.put(r.cliente.id, r);
        }

        List<Elegivel> lista = new ArrayList<>();
        Set<UUID> vistos = new HashSet<>();
        if (valido(b, base.hoje())) {
            for (Cliente c : base.ativos()) {
                int atual = atual(b, c, base);
                if (atual < meta(b)) continue;
                vistos.add(c.id);
                lista.add(elegivel(c, motivo(b, atual), porAluno.get(c.id)));
            }
        }
        // quem resgatou e não está mais na lista (ex.: cancelou a matrícula)
        for (Resgate r : porAluno.values()) {
            if (!vistos.contains(r.cliente.id)) lista.add(elegivel(r.cliente, "Resgatado antes", r));
        }
        lista.sort(Comparator.comparing((Elegivel e) -> "disponivel".equals(e.situacao()) ? 1 : 0)
                .thenComparing(Elegivel::nome, ALFABETICA));
        return new DetalheBeneficio(json(b, base, resgates), ref, lista);
    }

    private static Elegivel elegivel(Cliente c, String motivo, Resgate r) {
        String situacao = r == null ? "disponivel" : r.entregueEm == null ? "resgatado" : "entregue";
        return new Elegivel(c.id, c.nome, motivo, situacao, r != null ? r.id : null, r != null ? r.createdAt : null,
                r != null ? r.origem : null);
    }

    public BeneficiosDoAluno doAluno(UUID storeId, Cliente aluno, String academia) {
        Base base = base(storeId);
        boolean ativo = base.ativos().stream().anyMatch(c -> c.id.equals(aluno.id));
        List<Resgate> resgates = Resgate.list("storeId", storeId);
        List<BeneficioDoAluno> lista = new ArrayList<>();
        for (Beneficio b : Beneficio.<Beneficio>list("storeId", storeId)) {
            if (!valido(b, base.hoje())) continue;
            String ref = referencia(b, base.hoje());
            Resgate r = resgates.stream()
                    .filter(x -> x.beneficio.id.equals(b.id) && x.cliente.id.equals(aluno.id) && x.referencia.equals(ref))
                    .findFirst()
                    .orElse(null);
            int atual = atual(b, aluno, base);
            String situacao = r != null ? (r.entregueEm != null ? "entregue" : "resgatado")
                    : ativo && atual >= meta(b) ? "disponivel" : "bloqueado";
            Integer meta = Set.of("indicacao", "fidelidade", "frequencia").contains(b.tipo) ? meta(b) : null;
            lista.add(new BeneficioDoAluno(json(b, base, resgates), situacao,
                    !ativo ? "Precisa de matrícula ativa" : "bloqueado".equals(situacao) ? progresso(b, atual) : "",
                    Math.min(atual, meta(b)), meta));
        }
        lista.sort(Comparator.comparing((BeneficioDoAluno x) -> switch (x.situacao()) {
            case "disponivel" -> 0;
            case "resgatado" -> 1;
            case "bloqueado" -> 2;
            default -> 3;
        }));
        return new BeneficiosDoAluno(academia, aluno.nome, lista);
    }

    // ---------- Alterações ----------

    @Transactional
    public Beneficio salvar(UUID storeId, UUID id, DadosBeneficio d) {
        Beneficio b;
        if (id == null) {
            b = new Beneficio();
            b.storeId = storeId;
            b.ativo = true;
        } else {
            b = beneficio(storeId, id);
        }
        if (d == null || d.titulo() == null || d.titulo().isBlank()) throw Erro.invalido("Dê um título ao benefício");
        if (d.tipo() == null || !TIPOS.contains(d.tipo())) throw Erro.invalido("Escolha quem tem direito");
        if (d.recompensa() == null || d.recompensa().isBlank()) throw Erro.invalido("Diga o que o aluno ganha");
        boolean precisaRegra = Set.of("indicacao", "fidelidade", "frequencia").contains(d.tipo());
        if (precisaRegra && (d.regra() == null || d.regra() < 1 || d.regra() > 1000)) {
            throw Erro.invalido(switch (d.tipo()) {
                case "indicacao" -> "Quantos indicados ativos o aluno precisa ter?";
                case "fidelidade" -> "Quantos meses de academia o aluno precisa ter?";
                default -> "Quantos check-ins no mês o aluno precisa fazer?";
            });
        }
        if ("parceiro".equals(d.tipo()) && (d.parceiro() == null || d.parceiro().isBlank())) {
            throw Erro.invalido("Informe o nome da loja parceira");
        }
        b.titulo = d.titulo().trim();
        b.descricao = d.descricao() != null ? d.descricao().trim() : "";
        b.tipo = d.tipo();
        b.regra = precisaRegra ? d.regra() : null;
        b.recompensa = d.recompensa().trim();
        b.parceiro = d.parceiro() != null ? d.parceiro().trim() : "";
        b.codigo = d.codigo() != null ? d.codigo().trim().toUpperCase(Locale.ROOT) : "";
        b.validade = d.validade();
        if (d.ativo() != null) b.ativo = d.ativo();
        b.persist();
        return b;
    }

    @Transactional
    public Resgate resgatar(UUID storeId, UUID beneficioId, Cliente aluno, String origem) {
        Beneficio b = beneficio(storeId, beneficioId);
        Base base = base(storeId);
        if (!valido(b, base.hoje())) throw Erro.conflito("Este benefício não está mais disponível");
        if (base.ativos().stream().noneMatch(c -> c.id.equals(aluno.id))) {
            throw Erro.conflito(aluno.nome.split(" ")[0] + " precisa de matrícula ativa");
        }
        int atual = atual(b, aluno, base);
        if (atual < meta(b)) throw Erro.conflito("Ainda não tem direito: " + progresso(b, atual).toLowerCase(Locale.ROOT));
        String ref = referencia(b, base.hoje());
        if (Resgate.count("beneficio = ?1 and cliente = ?2 and referencia = ?3", b, aluno, ref) > 0) {
            throw Erro.conflito("Benefício já resgatado");
        }
        Resgate r = new Resgate();
        r.storeId = storeId;
        r.beneficio = b;
        r.cliente = aluno;
        r.referencia = ref;
        r.origem = origem;
        // cupom de parceiro não precisa ser entregue pela academia
        r.entregueEm = "parceiro".equals(b.tipo) ? OffsetDateTime.now() : null;
        r.persist();
        return r;
    }

    @Transactional
    public void entregar(UUID storeId, UUID resgateId) {
        Resgate r = Resgate.findById(resgateId);
        if (r == null || !r.storeId.equals(storeId)) throw Erro.naoEncontrado("Resgate não encontrado");
        if (r.entregueEm == null) r.entregueEm = OffsetDateTime.now();
    }
}
