package br.com.clienteplus.modulos.artesmarciais;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

// Sistemas de faixas prontos para criar uma modalidade com um clique. O dono
// pode mudar tudo depois (nomes, cores, requisitos, taxas).
//
// Ordem: faixas infantis ficam entre a branca e a primeira faixa adulta; a
// próxima faixa de um aluno é a seguinte na ordem que combina com a idade dele.
public final class ModelosFaixas {

    private ModelosFaixas() {}

    record Modelo(String nome, String cor, String corPonta, String publico, int graus, int meses, int aulas,
            int aulasPorGrau, Integer idadeMinima, int taxa) {}

    private static Modelo adulto(String nome, String cor, int graus, int meses, int aulas, int porGrau, Integer idade,
            int taxa) {
        return new Modelo(nome, cor, null, "adulto", graus, meses, aulas, porGrau, idade, taxa);
    }

    private static Modelo kids(String nome, String cor, String ponta) {
        return new Modelo(nome, cor, ponta, "infantil", 4, 4, 50, 16, null, 60);
    }

    private static Modelo nivel(String nome, String cor, String ponta, int meses, int aulas, int taxa) {
        return new Modelo(nome, cor, ponta, "todos", 0, meses, aulas, 0, null, taxa);
    }

    private static final String BRANCA = "#f4f4f5";
    private static final String CINZA = "#9ca3af";
    private static final String AMARELA = "#facc15";
    private static final String LARANJA = "#f97316";
    private static final String VERDE = "#16a34a";
    private static final String AZUL = "#2563eb";
    private static final String ROXA = "#7e22ce";
    private static final String MARROM = "#78350f";
    private static final String PRETA = "#111111";
    private static final String VERMELHA = "#dc2626";
    private static final String AZUL_CLARA = "#38bdf8";

    // Jiu-Jitsu (padrão IBJJF): adulto branca → preta com 4 graus; kids com as
    // faixas cinza, amarela, laranja e verde (com listra branca/preta).
    static List<Modelo> jiuJitsu() {
        return List.of(
                new Modelo("Branca", BRANCA, null, "todos", 4, 12, 120, 30, null, 0),
                kids("Cinza e branca", CINZA, BRANCA), kids("Cinza", CINZA, null), kids("Cinza e preta", CINZA, PRETA),
                kids("Amarela e branca", AMARELA, BRANCA), kids("Amarela", AMARELA, null),
                kids("Amarela e preta", AMARELA, PRETA), kids("Laranja e branca", LARANJA, BRANCA),
                kids("Laranja", LARANJA, null), kids("Laranja e preta", LARANJA, PRETA),
                kids("Verde e branca", VERDE, BRANCA), kids("Verde", VERDE, null), kids("Verde e preta", VERDE, PRETA),
                adulto("Azul", AZUL, 4, 24, 200, 40, 16, 120),
                adulto("Roxa", ROXA, 4, 18, 180, 40, 16, 150),
                adulto("Marrom", MARROM, 4, 12, 150, 35, 18, 180),
                adulto("Preta", PRETA, 6, 36, 0, 0, 19, 250));
    }

    static List<Modelo> judo() {
        return List.of(
                nivel("Branca", BRANCA, null, 4, 40, 0), nivel("Cinza", CINZA, null, 6, 48, 60),
                nivel("Azul", AZUL, null, 6, 48, 60), nivel("Amarela", AMARELA, null, 6, 48, 80),
                nivel("Laranja", LARANJA, null, 8, 60, 80), nivel("Verde", VERDE, null, 10, 72, 100),
                nivel("Roxa", ROXA, null, 12, 90, 120), nivel("Marrom", MARROM, null, 18, 120, 150),
                nivel("Preta", PRETA, null, 0, 0, 250));
    }

    static List<Modelo> karate() {
        return List.of(
                nivel("Branca", BRANCA, null, 4, 36, 0), nivel("Amarela", AMARELA, null, 6, 48, 70),
                nivel("Vermelha", VERMELHA, null, 6, 48, 70), nivel("Laranja", LARANJA, null, 6, 48, 80),
                nivel("Verde", VERDE, null, 8, 60, 90), nivel("Roxa", ROXA, null, 10, 72, 100),
                nivel("Marrom", MARROM, null, 18, 120, 150), nivel("Preta", PRETA, null, 0, 0, 250));
    }

    static List<Modelo> taekwondo() {
        return List.of(
                nivel("Branca", BRANCA, null, 3, 30, 0), nivel("Branca ponta amarela", BRANCA, AMARELA, 3, 30, 60),
                nivel("Amarela", AMARELA, null, 3, 30, 60), nivel("Amarela ponta verde", AMARELA, VERDE, 3, 30, 60),
                nivel("Verde", VERDE, null, 4, 36, 70), nivel("Verde ponta azul", VERDE, AZUL, 4, 36, 70),
                nivel("Azul", AZUL, null, 5, 45, 80), nivel("Azul ponta vermelha", AZUL, VERMELHA, 5, 45, 80),
                nivel("Vermelha", VERMELHA, null, 6, 54, 100),
                nivel("Vermelha ponta preta", VERMELHA, PRETA, 8, 60, 120), nivel("Preta", PRETA, null, 0, 0, 250));
    }

    // Muay Thai: prajied (braçadeiras), da branca à preta.
    static List<Modelo> muayThai() {
        return List.of(
                nivel("Branca", BRANCA, null, 3, 30, 0), nivel("Branca e vermelha", BRANCA, VERMELHA, 4, 36, 70),
                nivel("Vermelha", VERMELHA, null, 4, 36, 70),
                nivel("Vermelha e azul-clara", VERMELHA, AZUL_CLARA, 5, 45, 80),
                nivel("Azul-clara", AZUL_CLARA, null, 5, 45, 80),
                nivel("Azul-clara e azul-escura", AZUL_CLARA, "#1e3a8a", 6, 54, 90),
                nivel("Azul-escura", "#1e3a8a", null, 8, 60, 100),
                nivel("Azul-escura e preta", "#1e3a8a", PRETA, 12, 90, 120), nivel("Preta", PRETA, null, 0, 0, 250));
    }

    // Boxe, MMA e outras sem faixa: níveis.
    static List<Modelo> niveis() {
        return List.of(
                nivel("Iniciante", "#71717a", null, 3, 30, 0), nivel("Intermediário", AZUL, null, 6, 60, 0),
                nivel("Avançado", VERMELHA, null, 12, 100, 0), nivel("Competidor", "#eab308", null, 0, 0, 0));
    }

    static List<Modelo> modelo(String nome) {
        if (nome == null) return List.of();
        return switch (nome) {
            case "jiu-jitsu" -> jiuJitsu();
            case "judo" -> judo();
            case "karate" -> karate();
            case "taekwondo" -> taekwondo();
            case "muay-thai" -> muayThai();
            case "niveis" -> niveis();
            default -> List.of();
        };
    }

    static void criar(UUID storeId, Modalidade m, String modelo) {
        int ordem = 1;
        for (Modelo f : modelo(modelo)) {
            Faixa x = new Faixa();
            x.storeId = storeId;
            x.modalidade = m;
            x.nome = f.nome();
            x.cor = f.cor();
            x.corPonta = f.corPonta();
            x.publico = f.publico();
            x.ordem = ordem++;
            x.grausMaximos = f.graus();
            x.mesesMinimos = f.meses();
            x.aulasMinimas = f.aulas();
            x.aulasPorGrau = f.aulasPorGrau();
            x.idadeMinima = f.idadeMinima();
            x.taxaExame = BigDecimal.valueOf(f.taxa());
            x.ativo = true;
            x.persist();
        }
    }
}
