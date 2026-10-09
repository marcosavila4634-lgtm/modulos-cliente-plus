package br.com.clienteplus.modulos.artesmarciais;

import static br.com.clienteplus.modulos.artesmarciais.Lutas.hoje;
import static br.com.clienteplus.modulos.artesmarciais.Lutas.ref;
import static br.com.clienteplus.modulos.comum.Formatos.FUSO;

import br.com.clienteplus.modulos.academia.AcademiaPainel;
import br.com.clienteplus.modulos.academia.Aula;
import br.com.clienteplus.modulos.academia.Matriculas;
import br.com.clienteplus.modulos.academia.Profissional;
import br.com.clienteplus.modulos.artesmarciais.ArtesMarciaisContrato.*;
import br.com.clienteplus.modulos.clienteplus.Assinatura;
import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.Erro;
import io.quarkus.hibernate.orm.panache.Panache;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

// Faixas, graus e graduações.
//
// - Cada aluno pode estar em várias modalidades, com uma faixa e um grau em
//   cada uma (artes_marciais_alunos).
// - "Aulas" = presenças marcadas nas aulas da modalidade (chamada ou QR Code)
//   ou, se a academia preferir (Configurações), dias com check-in.
// - Requisitos da faixa atual (para sair dela): tempo mínimo na faixa e aulas
//   desde a faixa; graus: a cada N aulas desde o último grau. A idade mínima
//   é da faixa seguinte.
// - Próxima faixa = a seguinte na ordem que combina com a idade (faixas
//   infantis até a idade adulta das Configurações).
@ApplicationScoped
public class Graduacoes {

    @Inject
    Matriculas matriculas;

    // ---------- Configurações ----------

    @Transactional
    public ConfigArtesMarciais config(UUID storeId) {
        ConfigArtesMarciais c = ConfigArtesMarciais.<ConfigArtesMarciais>find("storeId", storeId).firstResult();
        if (c == null) {
            c = new ConfigArtesMarciais();
            c.storeId = storeId;
            c.contarAulasPor = "aulas";
            c.idadeAdulto = 16;
            c.lema = "Respeito · Disciplina · Evolução · Pessoas mais fortes";
            c.codigoPresenca = Lutas.codigo(10);
            c.updatedAt = OffsetDateTime.now();
            c.persist();
        }
        return c;
    }

    public String nomeAcademia(UUID storeId) {
        AcademiaPainel p = AcademiaPainel.<AcademiaPainel>find("storeId", storeId).firstResult();
        return p != null ? p.nomeAcademia : "Academia";
    }

    // ---------- Contagem de aulas ----------

    // Dias de aula de cada aluno em cada modalidade, em ordem. Com a contagem
    // por check-in, a chave da modalidade é null (vale para todas).
    public static final class Aulas {
        private final Map<String, List<LocalDate>> dias = new HashMap<>();
        private final boolean porCheckin;

        Aulas(boolean porCheckin) {
            this.porCheckin = porCheckin;
        }

        private String chave(UUID cliente, UUID modalidade) {
            return cliente + "|" + (porCheckin ? "*" : modalidade);
        }

        void add(UUID cliente, UUID modalidade, LocalDate dia) {
            dias.computeIfAbsent(chave(cliente, modalidade), k -> new ArrayList<>()).add(dia);
        }

        void ordenar() {
            dias.values().forEach(Collections::sort);
        }

        public int desde(UUID cliente, UUID modalidade, LocalDate inicio) {
            List<LocalDate> lista = dias.get(chave(cliente, modalidade));
            if (lista == null) return 0;
            int pos = Collections.binarySearch(lista, inicio);
            if (pos < 0) return lista.size() + pos + 1;
            while (pos > 0 && lista.get(pos - 1).equals(inicio)) pos--;
            return lista.size() - pos;
        }

        public int entre(UUID cliente, UUID modalidade, LocalDate de, LocalDate ate) {
            return desde(cliente, modalidade, de) - desde(cliente, modalidade, ate.plusDays(1));
        }

        public int total(UUID cliente) {
            if (porCheckin) {
                List<LocalDate> l = dias.get(cliente + "|*");
                return l == null ? 0 : l.size();
            }
            return dias.entrySet().stream()
                    .filter(e -> e.getKey().startsWith(cliente + "|"))
                    .mapToInt(e -> e.getValue().size())
                    .sum();
        }
    }

    public Aulas aulas(UUID storeId) {
        return aulas(storeId, null);
    }

    // clienteId != null: só as aulas desse aluno.
    public Aulas aulas(UUID storeId, UUID clienteId) {
        boolean porCheckin = "checkins".equals(config(storeId).contarAulasPor);
        Aulas a = new Aulas(porCheckin);
        var em = Panache.getEntityManager();
        String soAluno = clienteId != null ? " and x.cliente.id = :cliente" : "";
        if (porCheckin) {
            var q = em.createQuery("select x.cliente.id, x.momento from Acesso x where x.storeId = :loja"
                    + " and x.resultado = 'liberado'" + soAluno, Object[].class).setParameter("loja", storeId);
            if (clienteId != null) q.setParameter("cliente", clienteId);
            Set<String> vistos = new HashSet<>();
            for (Object[] r : q.getResultList()) {
                LocalDate dia = ((OffsetDateTime) r[1]).atZoneSameInstant(FUSO).toLocalDate();
                if (vistos.add(r[0] + "|" + dia)) a.add((UUID) r[0], null, dia);
            }
        } else {
            var q = em.createQuery("select x.cliente.id, am.modalidade.id, x.data from Presenca x,"
                    + " ArtesMarciaisAulaModalidade am where am.aula = x.horario.aula and x.storeId = :loja"
                    + " and x.status = 'presente'" + soAluno, Object[].class).setParameter("loja", storeId);
            if (clienteId != null) q.setParameter("cliente", clienteId);
            for (Object[] r : q.getResultList()) a.add((UUID) r[0], (UUID) r[1], (LocalDate) r[2]);
        }
        a.ordenar();
        return a;
    }

    // ---------- Progresso ----------

    List<Faixa> faixas(Modalidade m) {
        return Faixa.list("modalidade = ?1 and ativo = true order by ordem", m);
    }

    static boolean serve(Faixa f, boolean infantil) {
        return "todos".equals(f.publico) || (infantil ? "infantil" : "adulto").equals(f.publico);
    }

    static Faixa proximaFaixa(Faixa atual, List<Faixa> faixas, boolean infantil) {
        return faixas.stream()
                .filter(f -> f.ordem > atual.ordem && serve(f, infantil))
                .findFirst()
                .orElse(null);
    }

    public Progresso progresso(AlunoModalidade am, Aulas aulas, Map<UUID, List<Faixa>> faixasPorModalidade,
            Set<UUID> comMatricula, ConfigArtesMarciais cfg) {
        Cliente c = am.cliente;
        Faixa f = am.faixa;
        Integer idade = Lutas.idade(c);
        boolean infantil = idade != null && idade < cfg.idadeAdulto;
        List<Faixa> lista = faixasPorModalidade.computeIfAbsent(am.modalidade.id, k -> faixas(am.modalidade));
        Faixa proxima = proximaFaixa(f, lista, infantil);

        LocalDate hoje = hoje();
        int aulasFaixa = aulas.desde(c.id, am.modalidade.id, am.faixaDesde);
        int aulasGrau = aulas.desde(c.id, am.modalidade.id, am.grauDesde);
        int meses = (int) ChronoUnit.MONTHS.between(am.faixaDesde, hoje);

        List<Requisito> reqs = new ArrayList<>();
        if (proxima != null) {
            if (f.mesesMinimos > 0) {
                reqs.add(new Requisito("Tempo na faixa (meses)", meses, f.mesesMinimos, meses >= f.mesesMinimos));
            }
            if (f.aulasMinimas > 0) {
                reqs.add(new Requisito("Aulas na faixa", aulasFaixa, f.aulasMinimas, aulasFaixa >= f.aulasMinimas));
            }
            if (proxima.idadeMinima != null) {
                int i = idade != null ? idade : 0;
                reqs.add(new Requisito("Idade mínima", i, proxima.idadeMinima, i >= proxima.idadeMinima));
            }
        }
        boolean controlaGrau = f.grausMaximos > am.grau && f.aulasPorGrau > 0;
        boolean aptoFaixa = proxima != null && !reqs.isEmpty() && reqs.stream().allMatch(Requisito::ok);
        boolean aptoGrau = controlaGrau && aulasGrau >= f.aulasPorGrau;

        String situacao;
        if (aptoFaixa) situacao = "apto_faixa";
        else if (aptoGrau) situacao = "apto_grau";
        else if (proxima == null && am.grau >= f.grausMaximos) situacao = "ultima_faixa";
        else if (reqs.isEmpty() && !controlaGrau) situacao = "livre";
        else situacao = "em_progresso";

        // Próximo passo: o grau (quando ainda falta grau e ele vem antes) ou a faixa.
        Proximo prox;
        int percentual;
        if (aptoFaixa || (!controlaGrau && proxima != null)) {
            prox = new Proximo("faixa", ref(proxima), 0);
            percentual = reqs.isEmpty() ? 0 : reqs.stream()
                    .mapToInt(r -> r.meta() == 0 ? 100 : Math.min(100, r.atual() * 100 / r.meta()))
                    .min()
                    .orElse(0);
        } else if (controlaGrau) {
            prox = new Proximo("grau", ref(f), am.grau + 1);
            percentual = Math.min(100, aulasGrau * 100 / f.aulasPorGrau);
        } else {
            prox = null;
            percentual = 100;
        }

        return new Progresso(
                am.id,
                ref(c),
                ref(am.modalidade),
                ref(f),
                am.grau,
                f.grausMaximos,
                am.inicio,
                am.faixaDesde,
                am.grauDesde,
                aulasFaixa,
                aulasGrau,
                f.aulasPorGrau,
                meses,
                reqs,
                prox,
                percentual,
                situacao,
                comMatricula.contains(c.id),
                infantil);
    }

    public Set<UUID> comMatriculaAtiva(UUID storeId) {
        return Assinatura.<Assinatura>list("storeId = ?1 and status = ?2", storeId, Assinatura.ATIVA).stream()
                .map(a -> a.cliente.id)
                .collect(Collectors.toSet());
    }

    // Todos os alunos ativos nas modalidades, com o progresso.
    public List<Progresso> progressos(UUID storeId) {
        ConfigArtesMarciais cfg = config(storeId);
        Aulas aulas = aulas(storeId);
        Set<UUID> comMatricula = comMatriculaAtiva(storeId);
        Map<UUID, List<Faixa>> faixas = new HashMap<>();
        return AlunoModalidade.<AlunoModalidade>list("storeId = ?1 and ativo = true", storeId).stream()
                .map(am -> progresso(am, aulas, faixas, comMatricula, cfg))
                .sorted(Comparator.comparing((Progresso p) -> p.aluno().nome(), Lutas.ALFABETICA))
                .toList();
    }

    public List<Progresso> progressosDoAluno(UUID storeId, Cliente aluno) {
        ConfigArtesMarciais cfg = config(storeId);
        Aulas aulas = aulas(storeId, aluno.id);
        Set<UUID> comMatricula = matriculas.matriculaAtiva(aluno) != null ? Set.of(aluno.id) : Set.of();
        Map<UUID, List<Faixa>> faixas = new HashMap<>();
        return AlunoModalidade.<AlunoModalidade>list("cliente = ?1 and ativo = true order by modalidade.ordem", aluno)
                .stream()
                .map(am -> progresso(am, aulas, faixas, comMatricula, cfg))
                .toList();
    }

    public PainelGraduacoes painel(UUID storeId) {
        List<Progresso> lista = progressos(storeId).stream().filter(Progresso::matriculaAtiva).toList();
        YearMonth mes = YearMonth.from(hoje());
        List<Graduacao> doMes = Graduacao.list("storeId = ?1 and tipo <> 'inicial' and data >= ?2", storeId,
                mes.atDay(1));
        List<GraduacaoJson> recentes = Graduacao.<Graduacao>find(
                        "storeId = ?1 and tipo <> 'inicial' order by data desc, createdAt desc", storeId)
                .page(0, 12)
                .list()
                .stream()
                .map(Graduacoes::json)
                .toList();
        return new PainelGraduacoes(
                lista,
                modalidades(storeId).stream().filter(m -> m.ativo).map(Lutas::ref).toList(),
                (int) lista.stream().filter(p -> "apto_faixa".equals(p.situacao())).count(),
                (int) lista.stream().filter(p -> "apto_grau".equals(p.situacao())).count(),
                doMes.size(),
                recentes);
    }

    public static GraduacaoJson json(Graduacao g) {
        return new GraduacaoJson(g.id, ref(g.cliente), ref(g.modalidade), g.tipo, ref(g.faixa), g.grau,
                ref(g.faixaAnterior), g.grauAnterior, g.data, g.professor != null ? g.professor.nome : null, g.codigo,
                g.observacao, g.exame != null ? g.exame.titulo : null);
    }

    public List<GraduacaoJson> historico(Cliente aluno) {
        return Graduacao.<Graduacao>list("cliente = ?1 order by data desc, createdAt desc", aluno).stream()
                .map(Graduacoes::json)
                .toList();
    }

    // ---------- Graduar ----------

    public AlunoModalidade alunoModalidade(UUID storeId, UUID id) {
        AlunoModalidade am = AlunoModalidade.findById(id);
        if (am == null || !am.storeId.equals(storeId)) throw Erro.naoEncontrado("Aluno não encontrado na modalidade");
        return am;
    }

    public Faixa faixa(UUID storeId, UUID id) {
        Faixa f = id != null ? Faixa.findById(id) : null;
        if (f == null || !f.storeId.equals(storeId)) throw Erro.naoEncontrado("Faixa não encontrada");
        return f;
    }

    Profissional professor(UUID storeId, UUID id) {
        if (id == null) return null;
        Profissional p = Profissional.findById(id);
        if (p == null || !p.storeId.equals(storeId)) throw Erro.invalido("Professor não encontrado");
        return p;
    }

    @Transactional
    public Graduacao graduar(UUID storeId, DadosGraduacao d, Exame exame) {
        if (d == null || d.alunoModalidadeId() == null) throw Erro.invalido("Escolha o aluno");
        AlunoModalidade am = alunoModalidade(storeId, d.alunoModalidadeId());
        LocalDate data = d.data() != null ? d.data() : hoje();
        if (data.isAfter(hoje())) throw Erro.invalido("A data da graduação não pode ser no futuro");

        Graduacao g = new Graduacao();
        g.storeId = storeId;
        g.cliente = am.cliente;
        g.modalidade = am.modalidade;
        g.faixaAnterior = am.faixa;
        g.grauAnterior = am.grau;
        g.data = data;
        g.professor = professor(storeId, d.professorId());
        g.exame = exame;
        g.observacao = Lutas.texto(d.observacao());
        g.codigo = codigoLivre();

        if ("grau".equals(d.tipo())) {
            int grau = d.grau() != null ? d.grau() : am.grau + 1;
            if (grau <= 0 || grau > am.faixa.grausMaximos) {
                throw Erro.invalido("A faixa " + am.faixa.nome + " vai até " + am.faixa.grausMaximos + " graus");
            }
            g.tipo = "grau";
            g.faixa = am.faixa;
            g.grau = grau;
            am.grau = grau;
            am.grauDesde = data;
        } else if ("faixa".equals(d.tipo())) {
            Faixa nova = faixa(storeId, d.faixaId());
            if (!nova.modalidade.id.equals(am.modalidade.id)) throw Erro.invalido("A faixa é de outra modalidade");
            if (nova.id.equals(am.faixa.id)) throw Erro.invalido("O aluno já está nesta faixa");
            int grau = d.grau() != null ? d.grau() : 0;
            if (grau < 0 || grau > nova.grausMaximos) throw Erro.invalido("Grau inválido para a faixa " + nova.nome);
            g.tipo = "faixa";
            g.faixa = nova;
            g.grau = grau;
            am.faixa = nova;
            am.grau = grau;
            am.faixaDesde = data;
            am.grauDesde = data;
        } else {
            throw Erro.invalido("Escolha se é um novo grau ou uma nova faixa");
        }
        g.persist();
        return g;
    }

    private static String codigoLivre() {
        String c;
        do {
            c = Lutas.codigo(8);
        } while (Graduacao.count("codigo", c) > 0);
        return c;
    }

    // Coloca o aluno numa modalidade (com a faixa que ele já tem).
    @Transactional
    public AlunoModalidade adicionarModalidade(UUID storeId, Cliente aluno, DadosAlunoModalidade d) {
        if (d == null || d.modalidadeId() == null) throw Erro.invalido("Escolha a modalidade");
        Modalidade m = modalidade(storeId, d.modalidadeId());
        Faixa f = d.faixaId() != null ? faixa(storeId, d.faixaId()) : faixas(m).stream().findFirst()
                .orElseThrow(() -> Erro.conflito("Cadastre as faixas de " + m.nome + " primeiro"));
        if (!f.modalidade.id.equals(m.id)) throw Erro.invalido("A faixa é de outra modalidade");
        int grau = d.grau() != null ? d.grau() : 0;
        if (grau < 0 || grau > f.grausMaximos) throw Erro.invalido("Grau inválido para a faixa " + f.nome);
        LocalDate inicio = d.inicio() != null ? d.inicio() : hoje();
        LocalDate desde = d.faixaDesde() != null ? d.faixaDesde() : inicio;

        AlunoModalidade am = AlunoModalidade.<AlunoModalidade>find("cliente = ?1 and modalidade = ?2", aluno, m)
                .firstResult();
        if (am != null && am.ativo) throw Erro.conflito(aluno.nome + " já treina " + m.nome);
        if (am == null) {
            am = new AlunoModalidade();
            am.storeId = storeId;
            am.cliente = aluno;
            am.modalidade = m;
        }
        am.faixa = f;
        am.grau = grau;
        am.inicio = inicio;
        am.faixaDesde = desde;
        am.grauDesde = desde;
        am.ativo = true;
        am.persist();

        Graduacao g = new Graduacao();
        g.storeId = storeId;
        g.cliente = aluno;
        g.modalidade = m;
        g.tipo = "inicial";
        g.faixa = f;
        g.grau = grau;
        g.data = desde;
        g.observacao = "Início na modalidade";
        g.codigo = codigoLivre();
        g.persist();
        return am;
    }

    @Transactional
    public void sairDaModalidade(UUID storeId, UUID alunoModalidadeId) {
        alunoModalidade(storeId, alunoModalidadeId).ativo = false;
    }

    // ---------- Modalidades e faixas ----------

    public List<Modalidade> modalidades(UUID storeId) {
        return Modalidade.list("storeId = ?1 order by ordem, nome", storeId);
    }

    public Modalidade modalidade(UUID storeId, UUID id) {
        Modalidade m = id != null ? Modalidade.findById(id) : null;
        if (m == null || !m.storeId.equals(storeId)) throw Erro.naoEncontrado("Modalidade não encontrada");
        return m;
    }

    public List<ModalidadeJson> modalidadesJson(UUID storeId) {
        Map<UUID, Long> alunos = AlunoModalidade.<AlunoModalidade>list("storeId = ?1 and ativo = true", storeId)
                .stream()
                .collect(Collectors.groupingBy(am -> am.modalidade.id, Collectors.counting()));
        Map<UUID, List<UUID>> aulas = new HashMap<>();
        for (AulaModalidade a : AulaModalidade.<AulaModalidade>list("storeId", storeId)) {
            aulas.computeIfAbsent(a.modalidade.id, k -> new ArrayList<>()).add(a.aula.id);
        }
        return modalidades(storeId).stream()
                .map(m -> new ModalidadeJson(m.id, m.nome, m.cor, m.ordem, m.ativo,
                        alunos.getOrDefault(m.id, 0L).intValue(),
                        Faixa.<Faixa>list("modalidade = ?1 order by ordem", m).stream().map(Lutas::json).toList(),
                        aulas.getOrDefault(m.id, List.of())))
                .toList();
    }

    @Transactional
    public Modalidade salvarModalidade(UUID storeId, UUID id, DadosModalidade d) {
        if (d == null) throw Erro.invalido("Dados da modalidade");
        Modalidade m;
        if (id == null) {
            m = new Modalidade();
            m.storeId = storeId;
            m.ativo = true;
            m.ordem = (int) Modalidade.count("storeId", storeId) + 1;
        } else {
            m = modalidade(storeId, id);
        }
        m.nome = Lutas.obrigatorio(d.nome(), "Dê um nome para a modalidade");
        String cor = Lutas.cor(d.cor());
        m.cor = cor != null ? cor : m.cor != null ? m.cor : "#ef4444";
        if (d.ativo() != null) m.ativo = d.ativo();
        m.persist();
        if (id == null) ModelosFaixas.criar(storeId, m, d.modelo());
        return m;
    }

    @Transactional
    public Faixa salvarFaixa(UUID storeId, UUID modalidadeId, UUID id, DadosFaixa d) {
        if (d == null) throw Erro.invalido("Dados da faixa");
        Faixa f;
        if (id == null) {
            Modalidade m = modalidade(storeId, modalidadeId);
            f = new Faixa();
            f.storeId = storeId;
            f.modalidade = m;
            f.ativo = true;
            Integer ultima = Faixa.<Faixa>find("modalidade = ?1 order by ordem desc", m).firstResultOptional()
                    .map(x -> x.ordem).orElse(0);
            f.ordem = ultima + 1;
        } else {
            f = faixa(storeId, id);
        }
        f.nome = Lutas.obrigatorio(d.nome(), "Dê um nome para a faixa");
        String cor = Lutas.cor(d.cor());
        if (cor == null) throw Erro.invalido("Escolha a cor da faixa");
        f.cor = cor;
        f.corPonta = Lutas.cor(d.corPonta());
        f.publico = d.publico() != null && Set.of("adulto", "infantil", "todos").contains(d.publico())
                ? d.publico() : "todos";
        f.grausMaximos = limite(d.grausMaximos(), 0, 10, "Graus: de 0 a 10");
        f.mesesMinimos = limite(d.mesesMinimos(), 0, 240, "Tempo mínimo: de 0 a 240 meses");
        f.aulasMinimas = limite(d.aulasMinimas(), 0, 5000, "Aulas mínimas: de 0 a 5000");
        f.aulasPorGrau = limite(d.aulasPorGrau(), 0, 1000, "Aulas por grau: de 0 a 1000");
        f.idadeMinima = d.idadeMinima() != null ? limite(d.idadeMinima(), 0, 99, "Idade mínima inválida") : null;
        f.taxaExame = Lutas.dinheiro(d.taxaExame());
        if (d.ativo() != null) f.ativo = d.ativo();
        f.persist();
        return f;
    }

    private static int limite(Integer v, int min, int max, String erro) {
        int x = v != null ? v : 0;
        if (x < min || x > max) throw Erro.invalido(erro);
        return x;
    }

    @Transactional
    public void ordenarFaixas(UUID storeId, UUID modalidadeId, List<UUID> ids) {
        Modalidade m = modalidade(storeId, modalidadeId);
        if (ids == null) throw Erro.invalido("Informe a ordem");
        int ordem = 1;
        for (UUID id : ids) {
            Faixa f = faixa(storeId, id);
            if (!f.modalidade.id.equals(m.id)) throw Erro.invalido("Faixa de outra modalidade");
            f.ordem = ordem++;
        }
    }

    @Transactional
    public void excluirFaixa(UUID storeId, UUID id) {
        Faixa f = faixa(storeId, id);
        if (AlunoModalidade.count("faixa", f) > 0 || Graduacao.count("faixa = ?1 or faixaAnterior = ?1", f) > 0) {
            f.ativo = false; // tem histórico: só sai da lista
            return;
        }
        Tecnica.delete("faixa", f);
        f.delete();
    }

    // ---------- Aulas das modalidades ----------

    @Transactional
    public void definirModalidadeDaAula(UUID storeId, UUID aulaId, DadosAulaModalidade d) {
        Aula aula = Aula.findById(aulaId);
        if (aula == null || !aula.storeId.equals(storeId)) throw Erro.naoEncontrado("Aula não encontrada");
        AulaModalidade am = AulaModalidade.<AulaModalidade>find("aula", aula).firstResult();
        if (d == null || d.modalidadeId() == null) {
            if (am != null) am.delete();
            return;
        }
        if (am == null) {
            am = new AulaModalidade();
            am.storeId = storeId;
            am.aula = aula;
        }
        am.modalidade = modalidade(storeId, d.modalidadeId());
        am.publico = d.publico() != null && Set.of("adulto", "infantil", "todos").contains(d.publico())
                ? d.publico() : "todos";
        am.persist();
    }

    public List<AulaDaModalidade> aulasDasModalidades(UUID storeId) {
        return AulaModalidade.<AulaModalidade>list("storeId", storeId).stream()
                .map(a -> new AulaDaModalidade(a.aula.id, a.modalidade.id, a.publico))
                .toList();
    }

    // ---------- Currículo ----------

    public static TecnicaJson json(Tecnica t) {
        return new TecnicaJson(t.id, t.modalidade.id, t.faixa.id, t.categoria, t.nome, t.descricao, t.videoUrl,
                t.ordem);
    }

    public List<TecnicaJson> curriculo(UUID storeId, UUID modalidadeId) {
        return Tecnica.<Tecnica>list("storeId = ?1 and modalidade.id = ?2 order by faixa.ordem, ordem, nome",
                        storeId, modalidadeId)
                .stream()
                .map(Graduacoes::json)
                .toList();
    }

    @Transactional
    public Tecnica salvarTecnica(UUID storeId, UUID modalidadeId, UUID id, DadosTecnica d) {
        if (d == null) throw Erro.invalido("Dados da técnica");
        Tecnica t;
        if (id == null) {
            t = new Tecnica();
            t.storeId = storeId;
            t.modalidade = modalidade(storeId, modalidadeId);
            t.ordem = (int) Tecnica.count("modalidade", t.modalidade) + 1;
        } else {
            t = Tecnica.findById(id);
            if (t == null || !t.storeId.equals(storeId)) throw Erro.naoEncontrado("Técnica não encontrada");
        }
        Faixa f = faixa(storeId, d.faixaId());
        if (!f.modalidade.id.equals(t.modalidade.id)) throw Erro.invalido("A faixa é de outra modalidade");
        t.faixa = f;
        t.nome = Lutas.obrigatorio(d.nome(), "Dê um nome para a técnica");
        t.categoria = Lutas.texto(d.categoria());
        t.descricao = Lutas.texto(d.descricao());
        String video = Lutas.texto(d.videoUrl());
        if (!video.isEmpty() && !video.matches("https?://.+")) throw Erro.invalido("O vídeo precisa ser um link (https://...)");
        t.videoUrl = video;
        t.persist();
        return t;
    }

    @Transactional
    public void excluirTecnica(UUID storeId, UUID id) {
        Tecnica t = Tecnica.findById(id);
        if (t == null || !t.storeId.equals(storeId)) throw Erro.naoEncontrado("Técnica não encontrada");
        t.delete();
    }

    // ---------- Certificado (público) ----------

    public Certificado certificado(String codigo) {
        Graduacao g = Graduacao.<Graduacao>find("codigo", codigo == null ? "" : codigo.toUpperCase()).firstResult();
        if (g == null) throw Erro.naoEncontrado("Certificado não encontrado");
        return new Certificado(g.codigo, nomeAcademia(g.storeId), g.cliente.nome, g.modalidade.nome, ref(g.faixa),
                g.grau, g.tipo, g.data, g.professor != null ? g.professor.nome : null,
                g.exame != null ? g.exame.titulo : null);
    }
}
