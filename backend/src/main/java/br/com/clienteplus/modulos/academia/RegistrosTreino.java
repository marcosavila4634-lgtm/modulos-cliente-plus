package br.com.clienteplus.modulos.academia;

import static br.com.clienteplus.modulos.comum.Formatos.numero;

import br.com.clienteplus.modulos.academia.TreinosContrato.*;
import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.Erro;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

// Exercícios que o aluno marca como feitos (área do cliente) e a carga usada.
//
// - Só da ficha ativa e só no dia de hoje.
// - Desmarcar sem carga anotada apaga o registro.
// - Dia treinado = dia com pelo menos um exercício feito.
@ApplicationScoped
public class RegistrosTreino {

    @Inject
    Treinos treinos;

    public List<RegistroJson> deHoje(Cliente aluno) {
        return RegistroTreino.<RegistroTreino>list("cliente = ?1 and data = ?2", aluno, Matriculas.hoje()).stream()
                .map(r -> new RegistroJson(r.treinoLetra, r.exercicio.id, r.feito, r.cargaKg != null ? numero(r.cargaKg) : null))
                .toList();
    }

    public List<UltimaCarga> ultimasCargas(Cliente aluno) {
        Map<UUID, RegistroTreino> ultima = new HashMap<>();
        for (RegistroTreino r : RegistroTreino.<RegistroTreino>list(
                "cliente = ?1 and cargaKg is not null order by data", aluno)) {
            ultima.put(r.exercicio.id, r);
        }
        return ultima.values().stream()
                .map(r -> new UltimaCarga(r.exercicio.id, numero(r.cargaKg), r.data))
                .toList();
    }

    public int diasTreinadosNoMes(Cliente aluno) {
        LocalDate inicio = YearMonth.from(Matriculas.hoje()).atDay(1);
        return (int) RegistroTreino.<RegistroTreino>list("cliente = ?1 and feito = true and data >= ?2", aluno, inicio)
                .stream()
                .map(r -> r.data)
                .distinct()
                .count();
    }

    @Transactional
    public void registrar(UUID storeId, Cliente aluno, DadosRegistro d) {
        Ficha ficha = treinos.fichaAtiva(aluno);
        if (ficha == null) throw Erro.conflito("Você não tem ficha de treino ativa");
        if (d == null || d.letra() == null || d.exercicioId() == null) throw Erro.invalido("Escolha o exercício");
        FichaTreino treino = ficha.treinos.stream()
                .filter(t -> t.letra.equals(d.letra()))
                .findFirst()
                .orElseThrow(() -> Erro.invalido("Treino " + d.letra() + " não existe na sua ficha"));
        FichaExercicio item = treino.exercicios.stream()
                .filter(i -> i.exercicio.id.equals(d.exercicioId()))
                .findFirst()
                .orElseThrow(() -> Erro.invalido("Este exercício não está no treino " + d.letra()));
        BigDecimal carga = d.cargaKg();
        if (carga != null && (carga.signum() < 0 || carga.doubleValue() > 1000)) throw Erro.invalido("Carga inválida (kg)");

        LocalDate hoje = Matriculas.hoje();
        RegistroTreino r = RegistroTreino.<RegistroTreino>find(
                        "cliente = ?1 and ficha = ?2 and treinoLetra = ?3 and exercicio = ?4 and data = ?5",
                        aluno, ficha, d.letra(), item.exercicio, hoje)
                .firstResult();
        boolean feito = !Boolean.FALSE.equals(d.feito());
        if (!feito && carga == null) {
            if (r != null) r.delete();
            return;
        }
        if (r == null) {
            r = new RegistroTreino();
            r.storeId = storeId;
            r.cliente = aluno;
            r.ficha = ficha;
            r.exercicio = item.exercicio;
            r.treinoLetra = d.letra();
            r.data = hoje;
        }
        r.feito = feito;
        r.cargaKg = carga != null ? carga.setScale(2, RoundingMode.HALF_UP) : null;
        r.persist();
    }

    // Para o professor: frequência de treino e a evolução da carga por exercício.
    public TreinosFeitos treinosFeitos(Cliente aluno) {
        LocalDate hoje = Matriculas.hoje();
        List<RegistroTreino> todos = RegistroTreino.list("cliente = ?1 and feito = true order by data", aluno);
        LocalDate inicioMes = YearMonth.from(hoje).atDay(1);
        int diasMes = (int) todos.stream().map(r -> r.data).filter(d -> !d.isBefore(inicioMes)).distinct().count();
        int dias30 = (int) todos.stream().map(r -> r.data).filter(d -> !d.isBefore(hoje.minusDays(29))).distinct().count();
        LocalDate ultimo = todos.isEmpty() ? null : todos.get(todos.size() - 1).data;

        List<EvolucaoExercicio> exercicios = todos.stream()
                .filter(r -> r.cargaKg != null)
                .collect(Collectors.groupingBy(r -> r.exercicio.id))
                .values()
                .stream()
                .filter(lista -> !lista.isEmpty())
                .map(lista -> {
                    Exercicio e = lista.get(0).exercicio;
                    // uma carga por dia (a maior, se marcou em dois treinos)
                    Map<LocalDate, BigDecimal> porDia = new java.util.TreeMap<>();
                    for (RegistroTreino r : lista) porDia.merge(r.data, r.cargaKg, BigDecimal::max);
                    return new EvolucaoExercicio(e.id, e.nome, e.grupoMuscular, porDia.entrySet().stream()
                            .map(x -> new PontoCarga(x.getKey(), numero(x.getValue())))
                            .toList());
                })
                .sorted(Comparator.comparing((EvolucaoExercicio x) -> x.pontos().size()).reversed()
                        .thenComparing(EvolucaoExercicio::nome))
                .toList();
        return new TreinosFeitos(diasMes, dias30, ultimo, exercicios);
    }
}
