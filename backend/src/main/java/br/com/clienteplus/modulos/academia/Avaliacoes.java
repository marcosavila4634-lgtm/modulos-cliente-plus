package br.com.clienteplus.modulos.academia;

import static br.com.clienteplus.modulos.comum.Formatos.numero;

import br.com.clienteplus.modulos.academia.AvaliacoesContrato.*;
import br.com.clienteplus.modulos.academia.TreinosContrato.Referencia;
import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.Erro;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;

// Regras da avaliação física.
//
// - IMC = peso / altura². Classificação da OMS.
// - % de gordura: digitado (bioimpedância) ou calculado pelas 7 dobras
//   (densidade de Jackson & Pollock, % pela fórmula de Siri).
// - Massa gorda = peso × % gordura; massa magra = peso − massa gorda.
// - Reavaliação: a cada N dias (Configurações). Passou do prazo = "pendente".
@ApplicationScoped
public class Avaliacoes {

    static final Set<String> METODOS = Set.of("nenhum", "bioimpedancia", "dobras_pollock7");

    @Inject
    Configuracoes configuracoes;

    // ---------- Cálculos ----------

    static BigDecimal imc(BigDecimal peso, BigDecimal alturaCm) {
        BigDecimal m = alturaCm.divide(BigDecimal.valueOf(100));
        return peso.divide(m.multiply(m), 1, RoundingMode.HALF_UP);
    }

    static String classificacaoImc(BigDecimal imc) {
        double v = imc.doubleValue();
        if (v < 18.5) return "abaixo";
        if (v < 25) return "normal";
        if (v < 30) return "sobrepeso";
        if (v < 35) return "obesidade_1";
        if (v < 40) return "obesidade_2";
        return "obesidade_3";
    }

    // % de gordura pelas 7 dobras. null se faltar alguma dobra ou a idade.
    static BigDecimal pollock7(Dobras d, String sexo, Integer idade) {
        if (d == null || idade == null) return null;
        List<BigDecimal> dobras = Stream.of(d.peitoral(), d.axilar(), d.triceps(), d.subescapular(), d.abdominal(),
                        d.suprailiaca(), d.coxa())
                .toList();
        if (dobras.stream().anyMatch(x -> x == null)) return null;
        double s = dobras.stream().mapToDouble(BigDecimal::doubleValue).sum();
        double densidade = "F".equals(sexo)
                ? 1.097 - 0.00046971 * s + 0.00000056 * s * s - 0.00012828 * idade
                : 1.112 - 0.00043499 * s + 0.00000055 * s * s - 0.00028826 * idade;
        double pct = (4.95 / densidade - 4.50) * 100;
        return BigDecimal.valueOf(Math.max(2, Math.min(60, pct))).setScale(1, RoundingMode.HALF_UP);
    }

    static Integer idadeEm(Cliente c, LocalDate data) {
        if (c.dataNascimento == null) return null;
        return Period.between(c.dataNascimento, data).getYears();
    }

    public String situacao(LocalDate ultima, int reavaliacaoDias) {
        if (ultima == null) return "sem_avaliacao";
        return ultima.plusDays(reavaliacaoDias).isBefore(Matriculas.hoje()) ? "pendente" : "em_dia";
    }

    // ---------- Conversões ----------

    static AvaliacaoJson json(Avaliacao a) {
        BigDecimal imc = imc(a.peso, a.alturaCm);
        BigDecimal gorda = a.gorduraPct != null
                ? a.peso.multiply(a.gorduraPct).divide(BigDecimal.valueOf(100), 1, RoundingMode.HALF_UP)
                : null;
        BigDecimal rcq = a.medidaCintura != null && a.medidaQuadril != null && a.medidaQuadril.signum() > 0
                ? a.medidaCintura.divide(a.medidaQuadril, 2, RoundingMode.HALF_UP)
                : null;
        return new AvaliacaoJson(
                a.id,
                new Referencia(a.cliente.id, a.cliente.nome),
                a.profissional != null ? new Referencia(a.profissional.id, a.profissional.nome) : null,
                a.data,
                a.sexo,
                a.idade,
                numero(a.peso),
                numero(a.alturaCm),
                numero(imc),
                classificacaoImc(imc),
                a.metodoGordura,
                a.gorduraPct != null ? numero(a.gorduraPct) : null,
                gorda != null ? numero(gorda) : null,
                gorda != null ? numero(a.peso.subtract(gorda).setScale(1, RoundingMode.HALF_UP)) : null,
                rcq != null ? numero(rcq) : null,
                new Dobras(limpo(a.dobraPeitoral), limpo(a.dobraAxilar), limpo(a.dobraTriceps),
                        limpo(a.dobraSubescapular), limpo(a.dobraAbdominal), limpo(a.dobraSuprailiaca),
                        limpo(a.dobraCoxa)),
                new Medidas(limpo(a.medidaPeitoral), limpo(a.medidaCintura), limpo(a.medidaAbdomen),
                        limpo(a.medidaQuadril), limpo(a.medidaBracoDireito), limpo(a.medidaBracoEsquerdo),
                        limpo(a.medidaCoxaDireita), limpo(a.medidaCoxaEsquerda), limpo(a.medidaPanturrilha)),
                a.pressaoSistolica,
                a.pressaoDiastolica,
                a.fcRepouso,
                a.objetivo,
                a.restricoes,
                a.observacoes);
    }

    // 72.50 -> 72.5 (sem notação científica)
    private static BigDecimal limpo(BigDecimal v) {
        if (v == null) return null;
        BigDecimal s = v.stripTrailingZeros();
        return s.scale() < 0 ? s.setScale(0) : s;
    }

    // ---------- Consultas ----------

    public Avaliacao avaliacao(UUID storeId, UUID id) {
        Avaliacao a = Avaliacao.findById(id);
        if (a == null || !a.storeId.equals(storeId)) throw Erro.naoEncontrado("Avaliação não encontrada");
        return a;
    }

    public List<Avaliacao> doAluno(Cliente aluno) {
        return Avaliacao.list("cliente = ?1 order by data desc, createdAt desc", aluno);
    }

    public HistoricoAvaliacoes historico(UUID storeId, Cliente aluno) {
        int dias = configuracoes.config(storeId).reavaliacaoDias;
        List<Avaliacao> lista = doAluno(aluno);
        LocalDate ultima = lista.isEmpty() ? null : lista.get(0).data;
        return new HistoricoAvaliacoes(
                new Referencia(aluno.id, aluno.nome),
                idadeEm(aluno, Matriculas.hoje()),
                lista.isEmpty() ? null : lista.get(0).sexo,
                situacao(ultima, dias),
                ultima != null ? ultima.plusDays(dias) : null,
                lista.stream().map(Avaliacoes::json).toList());
    }

    // ---------- Alterações ----------

    @Transactional
    public Avaliacao salvar(UUID storeId, UUID id, Cliente aluno, DadosAvaliacao d) {
        if (d == null) throw Erro.invalido("Preencha a avaliação");
        Avaliacao a;
        if (id == null) {
            a = new Avaliacao();
            a.storeId = storeId;
            a.cliente = aluno;
        } else {
            a = avaliacao(storeId, id);
        }

        LocalDate data = d.data() != null ? d.data() : Matriculas.hoje();
        if (data.isAfter(Matriculas.hoje())) throw Erro.invalido("A data da avaliação não pode ser no futuro");
        if (!"M".equals(d.sexo()) && !"F".equals(d.sexo())) throw Erro.invalido("Informe o sexo (usado nos cálculos)");
        if (d.peso() == null || d.peso().doubleValue() < 20 || d.peso().doubleValue() > 350) {
            throw Erro.invalido("Peso inválido: informe em kg (ex.: 72,5)");
        }
        if (d.alturaCm() == null || d.alturaCm().doubleValue() < 90 || d.alturaCm().doubleValue() > 250) {
            throw Erro.invalido("Altura inválida: informe em centímetros (ex.: 175)");
        }
        String metodo = d.metodoGordura() != null ? d.metodoGordura() : "nenhum";
        if (!METODOS.contains(metodo)) throw Erro.invalido("Método de % de gordura inválido");

        Integer idade = idadeEm(a.cliente, data);
        if (idade == null) idade = d.idade();
        if (idade != null && (idade < 5 || idade > 110)) throw Erro.invalido("Idade inválida");

        BigDecimal gordura = null;
        if ("bioimpedancia".equals(metodo)) {
            if (d.gorduraPct() == null || d.gorduraPct().doubleValue() < 2 || d.gorduraPct().doubleValue() > 70) {
                throw Erro.invalido("Informe o % de gordura medido (2 a 70)");
            }
            gordura = d.gorduraPct().setScale(1, RoundingMode.HALF_UP);
        } else if ("dobras_pollock7".equals(metodo)) {
            if (idade == null) throw Erro.invalido("Informe a idade do aluno para calcular pelas dobras");
            gordura = pollock7(d.dobras(), d.sexo(), idade);
            if (gordura == null) throw Erro.invalido("Preencha as 7 dobras para calcular o % de gordura");
        }

        Profissional prof = null;
        if (d.profissionalId() != null) {
            prof = Profissional.findById(d.profissionalId());
            if (prof == null || !prof.storeId.equals(storeId)) throw Erro.invalido("Profissional não encontrado");
        }

        validarFaixa(d.pressaoSistolica(), 60, 260, "Pressão (máxima)");
        validarFaixa(d.pressaoDiastolica(), 30, 180, "Pressão (mínima)");
        validarFaixa(d.fcRepouso(), 25, 220, "Frequência cardíaca");

        a.profissional = prof;
        a.data = data;
        a.sexo = d.sexo();
        a.idade = idade;
        a.peso = d.peso().setScale(2, RoundingMode.HALF_UP);
        a.alturaCm = d.alturaCm().setScale(1, RoundingMode.HALF_UP);
        a.metodoGordura = metodo;
        a.gorduraPct = gordura;

        Dobras db = d.dobras() != null ? d.dobras() : new Dobras(null, null, null, null, null, null, null);
        a.dobraPeitoral = medida(db.peitoral(), 1, 80, "Dobra peitoral");
        a.dobraAxilar = medida(db.axilar(), 1, 80, "Dobra axilar média");
        a.dobraTriceps = medida(db.triceps(), 1, 80, "Dobra tricipital");
        a.dobraSubescapular = medida(db.subescapular(), 1, 80, "Dobra subescapular");
        a.dobraAbdominal = medida(db.abdominal(), 1, 80, "Dobra abdominal");
        a.dobraSuprailiaca = medida(db.suprailiaca(), 1, 80, "Dobra suprailíaca");
        a.dobraCoxa = medida(db.coxa(), 1, 80, "Dobra da coxa");

        Medidas m = d.medidas() != null ? d.medidas() : new Medidas(null, null, null, null, null, null, null, null, null);
        a.medidaPeitoral = medida(m.peitoral(), 40, 250, "Peitoral");
        a.medidaCintura = medida(m.cintura(), 40, 250, "Cintura");
        a.medidaAbdomen = medida(m.abdomen(), 40, 250, "Abdômen");
        a.medidaQuadril = medida(m.quadril(), 40, 250, "Quadril");
        a.medidaBracoDireito = medida(m.bracoDireito(), 10, 80, "Braço direito");
        a.medidaBracoEsquerdo = medida(m.bracoEsquerdo(), 10, 80, "Braço esquerdo");
        a.medidaCoxaDireita = medida(m.coxaDireita(), 20, 120, "Coxa direita");
        a.medidaCoxaEsquerda = medida(m.coxaEsquerda(), 20, 120, "Coxa esquerda");
        a.medidaPanturrilha = medida(m.panturrilha(), 15, 80, "Panturrilha");

        a.pressaoSistolica = d.pressaoSistolica();
        a.pressaoDiastolica = d.pressaoDiastolica();
        a.fcRepouso = d.fcRepouso();
        a.objetivo = texto(d.objetivo());
        a.restricoes = texto(d.restricoes());
        a.observacoes = texto(d.observacoes());
        a.persistAndFlush();
        return a;
    }

    @Transactional
    public void excluir(UUID storeId, UUID id) {
        avaliacao(storeId, id).delete();
    }

    private static BigDecimal medida(BigDecimal v, double min, double max, String nome) {
        if (v == null) return null;
        if (v.doubleValue() < min || v.doubleValue() > max) {
            throw Erro.invalido(nome + ": valor fora do normal (" + (int) min + " a " + (int) max + ")");
        }
        return v.setScale(1, RoundingMode.HALF_UP);
    }

    private static void validarFaixa(Integer v, int min, int max, String nome) {
        if (v != null && (v < min || v > max)) throw Erro.invalido(nome + ": use de " + min + " a " + max);
    }

    private static String texto(String s) {
        return s != null ? s.trim() : "";
    }
}
