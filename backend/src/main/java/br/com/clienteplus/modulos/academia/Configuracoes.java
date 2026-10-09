package br.com.clienteplus.modulos.academia;

import static br.com.clienteplus.modulos.comum.Formatos.FUSO;

import br.com.clienteplus.modulos.academia.AcessoContrato.*;
import br.com.clienteplus.modulos.comum.Erro;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

// Configurações da academia e horário de funcionamento. Na primeira leitura,
// cria os valores padrão.
@ApplicationScoped
public class Configuracoes {

    @jakarta.inject.Inject
    br.com.clienteplus.modulos.grupovip.EnderecoPublico endereco;

    static final String[] DIAS = {"Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"};

    @Transactional
    public AcademiaConfig config(UUID storeId) {
        AcademiaConfig c = AcademiaConfig.<AcademiaConfig>find("storeId", storeId).firstResult();
        if (c == null) {
            c = new AcademiaConfig();
            c.storeId = storeId;
            c.persist();
        }
        if (c.slug == null) c.slug = slugLivre(painel(storeId).nomeAcademia, storeId);
        return c;
    }

    // Os 7 dias, de segunda a domingo. Padrão: seg a sex 6h–23h, sáb 8h–14h,
    // dom 8h–12h.
    @Transactional
    public List<HorarioFuncionamento> horarios(UUID storeId) {
        List<HorarioFuncionamento> lista = HorarioFuncionamento.list("storeId", storeId);
        for (int dia = 1; dia <= 7; dia++) {
            final int d = dia;
            if (lista.stream().noneMatch(h -> h.diaSemana == d)) {
                HorarioFuncionamento h = new HorarioFuncionamento();
                h.storeId = storeId;
                h.diaSemana = d;
                h.abre = LocalTime.of(d <= 5 ? 6 : 8, 0);
                h.fecha = LocalTime.of(d <= 5 ? 23 : d == 6 ? 14 : 12, 0);
                h.persist();
                lista = new java.util.ArrayList<>(lista);
                lista.add(h);
            }
        }
        return lista.stream().sorted(Comparator.comparingInt(h -> h.diaSemana)).toList();
    }

    public boolean abertoAgora(UUID storeId) {
        ZonedDateTime agora = ZonedDateTime.now(FUSO);
        int dia = agora.getDayOfWeek().getValue();
        return horarios(storeId).stream()
                .filter(h -> h.diaSemana == dia)
                .anyMatch(h -> h.abertoAs(agora.toLocalTime()));
    }

    static HorarioJson json(HorarioFuncionamento h) {
        return new HorarioJson(
                h.diaSemana,
                DIAS[h.diaSemana - 1],
                h.abre != null ? h.abre.toString() : null,
                h.fecha != null ? h.fecha.toString() : null,
                h.fechado);
    }

    public Tela tela(UUID storeId) {
        AcademiaConfig c = config(storeId);
        return new Tela(painel(storeId), c, horarios(storeId), endereco.base() + "/a/" + c.slug);
    }

    public record Tela(AcademiaPainel painel, AcademiaConfig config, List<HorarioFuncionamento> horarios,
                       String paginaPublica) {
        ConfiguracoesJson json() {
            return new ConfiguracoesJson(
                    painel.nomeAcademia,
                    painel.gestorNome,
                    painel.gestorCargo,
                    painel.frase,
                    config.telefone,
                    config.email,
                    config.endereco,
                    config.cnpj,
                    config.whatsapp,
                    config.slug,
                    paginaPublica,
                    config.capacidade,
                    config.validadeFichaSemanas,
                    config.reavaliacaoDias,
                    horarios.stream().map(Configuracoes::json).toList());
        }
    }

    @Transactional
    public AcademiaPainel painel(UUID storeId) {
        AcademiaPainel p = AcademiaPainel.<AcademiaPainel>find("storeId", storeId).firstResult();
        if (p == null) {
            p = new AcademiaPainel();
            p.storeId = storeId;
            p.nomeAcademia = "Minha academia";
            p.gestorNome = "Gestor";
            p.gestorCargo = "Administrador";
            p.frase = "";
            p.persist();
        }
        return p;
    }

    @Transactional
    public void salvar(UUID storeId, DadosConfiguracoes d) {
        if (d == null) throw Erro.invalido("Preencha as configurações");
        String nome = texto(d.nomeAcademia());
        if (nome == null) throw Erro.invalido("Informe o nome da academia");
        String gestor = texto(d.gestorNome());
        if (gestor == null) throw Erro.invalido("Informe o nome do gestor");
        if (d.capacidade() == null || d.capacidade() < 1 || d.capacidade() > 5000) {
            throw Erro.invalido("Capacidade: informe quantas pessoas cabem ao mesmo tempo (1 a 5000)");
        }
        if (d.validadeFichaSemanas() == null || d.validadeFichaSemanas() < 1 || d.validadeFichaSemanas() > 52) {
            throw Erro.invalido("Validade da ficha: de 1 a 52 semanas");
        }
        if (d.reavaliacaoDias() == null || d.reavaliacaoDias() < 7 || d.reavaliacaoDias() > 730) {
            throw Erro.invalido("Reavaliação física: de 7 a 730 dias");
        }
        String telefone = d.telefone() != null ? d.telefone().replaceAll("\\D", "") : "";
        if (!telefone.isEmpty() && (telefone.length() < 10 || telefone.length() > 11)) {
            throw Erro.invalido("Telefone inválido: use DDD + número");
        }
        String email = texto(d.email());
        if (email != null && !email.matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+")) throw Erro.invalido("E-mail inválido");

        AcademiaPainel p = painel(storeId);
        p.nomeAcademia = nome;
        p.gestorNome = gestor;
        p.gestorCargo = ou(texto(d.gestorCargo()), "Administrador");
        p.frase = ou(texto(d.frase()), "");

        AcademiaConfig c = config(storeId);
        c.telefone = telefone.isEmpty() ? null : telefone;
        c.email = email != null ? email.toLowerCase() : null;
        c.endereco = texto(d.endereco());
        c.cnpj = d.cnpj() != null && !d.cnpj().replaceAll("\\D", "").isEmpty() ? d.cnpj().replaceAll("\\D", "") : null;
        if (c.cnpj != null && c.cnpj.length() != 14) throw Erro.invalido("CNPJ inválido: precisa ter 14 números");
        String zap = d.whatsapp() != null ? d.whatsapp().replaceAll("\\D", "") : "";
        if (zap.startsWith("55") && zap.length() >= 12) zap = zap.substring(2);
        if (!zap.isEmpty() && (zap.length() < 10 || zap.length() > 11)) {
            throw Erro.invalido("WhatsApp inválido: use DDD + número");
        }
        c.whatsapp = zap.isEmpty() ? null : zap;
        c.capacidade = d.capacidade();
        c.validadeFichaSemanas = d.validadeFichaSemanas();
        c.reavaliacaoDias = d.reavaliacaoDias();

        if (d.horarios() != null) {
            List<HorarioFuncionamento> atuais = horarios(storeId);
            for (DadosHorario dh : d.horarios()) {
                HorarioFuncionamento h = atuais.stream()
                        .filter(x -> x.diaSemana == dh.diaSemana())
                        .findFirst()
                        .orElseThrow(() -> Erro.invalido("Dia da semana inválido"));
                String dia = DIAS[h.diaSemana - 1];
                h.fechado = dh.fechado();
                if (!dh.fechado()) {
                    LocalTime abre = hora(dh.abre(), dia);
                    LocalTime fecha = hora(dh.fecha(), dia);
                    if (!fecha.isAfter(abre)) throw Erro.invalido(dia + ": o horário de fechar deve ser depois do de abrir");
                    h.abre = abre;
                    h.fecha = fecha;
                }
            }
        }
    }

    private static LocalTime hora(String s, String dia) {
        if (s == null || s.isBlank()) throw Erro.invalido(dia + ": informe o horário de abrir e de fechar");
        try {
            return LocalTime.parse(s.length() == 5 ? s : s.substring(0, 5));
        } catch (DateTimeParseException | StringIndexOutOfBoundsException e) {
            throw Erro.invalido(dia + ": horário inválido");
        }
    }

    // Endereço da página pública (/a/<slug>): criado aqui com o nome da
    // academia quando a loja é criada. Depois, só a plataforma muda
    // (paginas/PlataformaResource); o lojista não.
    // "Academia Prime" -> "academia-prime" (com número no fim se já existir).
    private static String slugLivre(String nome, UUID storeId) {
        String base = java.text.Normalizer.normalize(nome == null ? "" : nome, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        if (base.length() > 34) base = base.substring(0, 34).replaceAll("-+$", "");
        if (!base.matches(br.com.clienteplus.modulos.paginas.Paginas.ENDERECO)) base = "academia";
        String slug = base;
        for (int n = 2; AcademiaConfig.count("slug = ?1 and storeId <> ?2", slug, storeId) > 0; n++) slug = base + "-" + n;
        return slug;
    }

    private static String texto(String s) {
        if (s == null || s.isBlank()) return null;
        return s.trim().replaceAll("[ \\t]+", " ");
    }

    private static String ou(String s, String padrao) {
        return s != null ? s : padrao;
    }
}
