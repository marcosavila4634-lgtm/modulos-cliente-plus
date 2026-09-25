package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.academia.TreinosContrato.*;
import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.Erro;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

// Regras de profissionais, exercícios e fichas de treino.
//
// - Ficha sem aluno = modelo. Ficha de aluno tem início e validade (padrão:
//   8 semanas, muda em Configurações) e um professor responsável.
// - Cada aluno tem no máximo uma ficha ativa: ao montar uma nova, a anterior
//   é encerrada (continua no histórico).
// - Situação: vencida (validade antes de hoje), vence_em_breve (até 7 dias)
//   ou em_dia.
@ApplicationScoped
public class Treinos {

    static final int MAX_DIVISOES = 7;

    @Inject
    Configuracoes configuracoes;

    static final Set<String> GRUPOS = Set.of("peito", "costas", "ombros", "biceps", "triceps", "pernas",
            "gluteos", "panturrilha", "abdomen", "cardio", "corpo_todo", "alongamento");

    // ---------- Situação e conversões ----------

    public static String situacao(Ficha f) {
        if (f.validade == null) return "em_dia";
        LocalDate hoje = Matriculas.hoje();
        if (f.validade.isBefore(hoje)) return "vencida";
        if (!f.validade.isAfter(hoje.plusDays(7))) return "vence_em_breve";
        return "em_dia";
    }

    // "A, B, C"
    static String divisoes(Ficha f) {
        return f.treinos.stream().map(t -> t.letra).collect(Collectors.joining(", "));
    }

    public static FichaResumo resumo(Ficha f) {
        return new FichaResumo(
                f.id,
                f.nome,
                f.professor != null ? f.professor.nome : null,
                f.inicio,
                f.validade,
                situacao(f),
                divisoes(f));
    }

    static ExercicioJson json(Exercicio e) {
        return new ExercicioJson(e.id, e.nome, e.grupoMuscular, e.equipamento, e.instrucoes,
                e.imagemUrl, e.videoUrl, e.videoLink, e.ativo);
    }

    static FichaJson json(Ficha f) {
        return new FichaJson(
                f.id,
                f.modelo(),
                f.cliente != null ? new Referencia(f.cliente.id, f.cliente.nome) : null,
                f.nome,
                f.objetivo,
                f.observacoes,
                f.professor != null ? new Referencia(f.professor.id, f.professor.nome) : null,
                f.inicio,
                f.validade,
                f.modelo() ? "em_dia" : situacao(f),
                f.status,
                f.updatedAt,
                f.treinos.stream()
                        .map(t -> new TreinoJson(t.id, t.letra, t.nome, t.exercicios.stream()
                                .map(i -> new ItemJson(i.id, json(i.exercicio), i.series, i.repeticoes,
                                        i.carga, i.descansoSegundos, i.observacao))
                                .toList()))
                        .toList());
    }

    // ---------- Consultas ----------

    public Ficha ficha(UUID storeId, UUID id) {
        Ficha f = Ficha.findById(id);
        if (f == null || !f.storeId.equals(storeId)) throw Erro.naoEncontrado("Ficha não encontrada");
        return f;
    }

    public Ficha fichaAtiva(Cliente aluno) {
        return Ficha.<Ficha>find("cliente = ?1 and status = ?2", aluno, Ficha.ATIVA).firstResult();
    }

    // ---------- Profissionais ----------

    @Transactional
    public Profissional salvarProfissional(UUID storeId, UUID id, DadosProfissional d) {
        Profissional p;
        if (id == null) {
            p = new Profissional();
            p.storeId = storeId;
            p.ativo = true;
        } else {
            p = Profissional.findById(id);
            if (p == null || !p.storeId.equals(storeId)) throw Erro.naoEncontrado("Profissional não encontrado");
        }
        if (d == null || texto(d.nome()) == null || texto(d.nome()).length() < 3) {
            throw Erro.invalido("Informe o nome do profissional");
        }
        String telefone = d.telefone() != null ? d.telefone().replaceAll("\\D", "") : "";
        if (!telefone.isEmpty() && (telefone.length() < 10 || telefone.length() > 11)) {
            throw Erro.invalido("Telefone inválido: use DDD + número");
        }
        p.nome = texto(d.nome());
        p.especialidade = ou(texto(d.especialidade()), "");
        p.telefone = telefone.isEmpty() ? null : telefone;
        p.email = texto(d.email()) != null ? texto(d.email()).toLowerCase() : null;
        p.registro = texto(d.registro());
        if (d.ativo() != null) p.ativo = d.ativo();
        p.persist();
        return p;
    }

    // ---------- Exercícios ----------

    @Transactional
    public Exercicio salvarExercicio(UUID storeId, UUID id, DadosExercicio d) {
        Exercicio e;
        if (id == null) {
            e = new Exercicio();
            e.storeId = storeId;
            e.ativo = true;
        } else {
            e = Exercicio.findById(id);
            if (e == null || !e.storeId.equals(storeId)) throw Erro.naoEncontrado("Exercício não encontrado");
        }
        if (d == null || texto(d.nome()) == null) throw Erro.invalido("Informe o nome do exercício");
        if (d.grupoMuscular() == null || !GRUPOS.contains(d.grupoMuscular())) {
            throw Erro.invalido("Escolha o grupo muscular");
        }
        String link = texto(d.videoLink());
        if (link != null && !link.matches("(?i)https?://.+")) {
            throw Erro.invalido("O link do vídeo precisa começar com http:// ou https://");
        }
        e.nome = texto(d.nome());
        e.grupoMuscular = d.grupoMuscular();
        e.equipamento = ou(texto(d.equipamento()), "");
        e.instrucoes = d.instrucoes() != null ? d.instrucoes().trim() : "";
        e.imagemUrl = texto(d.imagemUrl());
        e.videoUrl = texto(d.videoUrl());
        e.videoLink = link;
        if (d.ativo() != null) e.ativo = d.ativo();
        e.persist();
        return e;
    }

    // ---------- Fichas ----------

    // Cria um modelo (sem aluno) ou a ficha de um aluno, vazia ou copiada de
    // um modelo. A ficha ativa anterior do aluno é encerrada.
    @Transactional
    public Ficha criarFicha(UUID storeId, NovaFicha pedido, Cliente aluno) {
        Ficha modelo = null;
        if (pedido != null && pedido.modeloId() != null) {
            modelo = ficha(storeId, pedido.modeloId());
            if (!modelo.modelo()) throw Erro.invalido("Escolha um modelo de treino");
        }

        Ficha f = new Ficha();
        f.storeId = storeId;
        f.cliente = aluno;
        f.status = Ficha.ATIVA;
        if (modelo != null) {
            f.modeloOrigemId = modelo.id;
            f.nome = modelo.nome;
            f.objetivo = modelo.objetivo;
            f.observacoes = modelo.observacoes;
            f.professor = modelo.professor;
            for (FichaTreino mt : modelo.treinos) {
                FichaTreino t = novoTreino(f, mt.nome);
                for (FichaExercicio mi : mt.exercicios) {
                    novoItem(t, mi.exercicio, mi.series, mi.repeticoes, mi.carga, mi.descansoSegundos, mi.observacao);
                }
            }
        } else {
            f.nome = aluno != null ? "Treino de " + aluno.nome.split(" ")[0] : "Novo modelo";
            f.objetivo = "";
            f.observacoes = "";
            novoTreino(f, "");
        }

        if (aluno != null) {
            Ficha anterior = fichaAtiva(aluno);
            if (anterior != null) anterior.status = Ficha.ENCERRADA;
            f.inicio = Matriculas.hoje();
            f.validade = f.inicio.plusWeeks(configuracoes.config(storeId).validadeFichaSemanas);
        }
        f.persistAndFlush(); // grava já, para a resposta trazer os ids
        return f;
    }

    // Troca todo o conteúdo da ficha pelo que veio do editor.
    @Transactional
    public Ficha salvarFicha(UUID storeId, UUID id, DadosFicha d) {
        Ficha f = ficha(storeId, id);
        if (d == null || texto(d.nome()) == null) throw Erro.invalido("Dê um nome para a ficha");
        if (d.professorId() == null) throw Erro.invalido("Escolha o professor responsável");
        Profissional professor = Profissional.findById(d.professorId());
        if (professor == null || !professor.storeId.equals(storeId)) throw Erro.invalido("Professor não encontrado");
        List<DadosTreino> treinos = d.treinos() != null ? d.treinos() : List.of();
        if (treinos.isEmpty()) throw Erro.invalido("A ficha precisa de pelo menos um treino");
        if (treinos.size() > MAX_DIVISOES) throw Erro.invalido("No máximo " + MAX_DIVISOES + " treinos (A a G)");
        if (!f.modelo()) {
            if (d.inicio() == null || d.validade() == null) throw Erro.invalido("Informe o início e a validade");
            if (d.validade().isBefore(d.inicio())) throw Erro.invalido("A validade deve ser depois do início");
        }

        f.nome = texto(d.nome());
        f.objetivo = ou(texto(d.objetivo()), "");
        f.observacoes = d.observacoes() != null ? d.observacoes().trim() : "";
        f.professor = professor;
        f.inicio = f.modelo() ? null : d.inicio();
        f.validade = f.modelo() ? null : d.validade();

        f.treinos.clear();
        Ficha.getEntityManager().flush(); // apaga as divisões antigas antes de gravar as novas
        for (DadosTreino dt : treinos) {
            FichaTreino t = novoTreino(f, ou(texto(dt.nome()), ""));
            for (DadosItem di : dt.exercicios() != null ? dt.exercicios() : List.<DadosItem>of()) {
                Exercicio e = di.exercicioId() != null ? Exercicio.findById(di.exercicioId()) : null;
                if (e == null || !e.storeId.equals(storeId)) throw Erro.invalido("Exercício não encontrado");
                if (di.series() != null && (di.series() < 1 || di.series() > 20)) {
                    throw Erro.invalido("Séries de " + e.nome + ": use de 1 a 20");
                }
                if (di.descansoSegundos() != null && (di.descansoSegundos() < 0 || di.descansoSegundos() > 900)) {
                    throw Erro.invalido("Descanso de " + e.nome + ": use de 0 a 900 segundos");
                }
                novoItem(t, e, di.series(), ou(texto(di.repeticoes()), ""), ou(texto(di.carga()), ""),
                        di.descansoSegundos(), ou(texto(di.observacao()), ""));
            }
        }
        f.updatedAt = OffsetDateTime.now();
        Ficha.getEntityManager().flush(); // grava já, para a resposta trazer os ids
        return f;
    }

    // Modelo: apaga (fichas copiadas dele continuam). Ficha de aluno: encerra.
    @Transactional
    public void excluirFicha(UUID storeId, UUID id) {
        Ficha f = ficha(storeId, id);
        if (f.modelo()) {
            f.delete();
        } else {
            f.status = Ficha.ENCERRADA;
        }
    }

    private static FichaTreino novoTreino(Ficha f, String nome) {
        FichaTreino t = new FichaTreino();
        t.storeId = f.storeId;
        t.ficha = f;
        t.ordem = f.treinos.size() + 1;
        t.letra = String.valueOf((char) ('A' + f.treinos.size()));
        t.nome = nome;
        f.treinos.add(t);
        return t;
    }

    private static void novoItem(FichaTreino t, Exercicio e, Integer series, String repeticoes, String carga,
            Integer descanso, String observacao) {
        FichaExercicio i = new FichaExercicio();
        i.storeId = t.storeId;
        i.treino = t;
        i.exercicio = e;
        i.ordem = t.exercicios.size() + 1;
        i.series = series;
        i.repeticoes = repeticoes != null ? repeticoes : "";
        i.carga = carga != null ? carga : "";
        i.descansoSegundos = descanso;
        i.observacao = observacao != null ? observacao : "";
        t.exercicios.add(i);
    }

    private static String texto(String s) {
        if (s == null || s.isBlank()) return null;
        return s.trim().replaceAll("[ \\t]+", " ");
    }

    private static String ou(String s, String padrao) {
        return s != null ? s : padrao;
    }
}
