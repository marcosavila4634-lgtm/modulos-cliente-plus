package br.com.clienteplus.modulos.academia;

import static br.com.clienteplus.modulos.comum.Formatos.numero;

import br.com.clienteplus.modulos.clienteplus.Assinatura;
import br.com.clienteplus.modulos.clienteplus.Plano;
import br.com.clienteplus.modulos.comum.Erro;
import br.com.clienteplus.modulos.grupovip.EnderecoPublico;
import br.com.clienteplus.modulos.paginas.ModuloComPagina;
import br.com.clienteplus.modulos.paginas.Paginas;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;

// Página pública da academia (/a/<slug>): planos, aulas, horários, equipe e
// contato, com a aparência escolhida no editor de páginas comum a todos os
// módulos (pacote paginas). Os planos levam ao WhatsApp da academia (a
// matrícula continua na recepção). Adaptador do frontend:
// frontend/src/lib/pagina-academia.tsx
@ApplicationScoped
@Path("/academia/publico")
@Produces(MediaType.APPLICATION_JSON)
public class PaginaAcademia implements ModuloComPagina {

    public static final String MODULO = "academia";

    public record PlanoPublico(UUID id, String nome, String descricao, Number preco, int duracaoMeses) {}

    public record HorarioPublico(String dia, String abre, String fecha, boolean fechado) {}

    // dia: "Segunda"...; hora: "07:00"
    public record AulaHorarioPublico(int diaSemana, String dia, String hora) {}

    public record AulaPublica(String nome, String descricao, String professor, int duracaoMinutos, String cor,
                              List<AulaHorarioPublico> horarios) {}

    public record ProfissionalPublico(String nome, String especialidade) {}

    public record PaginaAcademiaJson(
            String nome,
            String slug,
            String whatsapp,
            String telefone,
            String email,
            String endereco,
            int alunos,
            List<PlanoPublico> planos,
            List<HorarioPublico> horarios,
            List<AulaPublica> aulas,
            List<ProfissionalPublico> equipe,
            // página personalizada publicada (null = página padrão); formato em
            // frontend/src/lib/pagina.ts
            JsonNode pagina) {}

    @ConfigProperty(name = "academia.store-id")
    UUID storeId;

    @Inject
    Configuracoes configuracoes;

    @Inject
    Paginas paginas;

    @Inject
    EnderecoPublico endereco;

    // ---------- Página pública ----------

    @GET
    @Path("/{slug}")
    @Transactional
    public PaginaAcademiaJson pagina(@PathParam("slug") String slug) {
        AcademiaConfig c = AcademiaConfig.<AcademiaConfig>find("slug", slug == null ? "" : slug.toLowerCase()).firstResult();
        if (c == null) throw Erro.naoEncontrado("Página não encontrada");
        return montar(c.storeId, paginas.publicada(c.storeId, MODULO));
    }

    PaginaAcademiaJson montar(UUID loja, JsonNode pagina) {
        AcademiaConfig c = configuracoes.config(loja);
        List<PlanoPublico> planos = Plano.<Plano>list("storeId = ?1 and ativo = true order by duracaoMeses, preco", loja)
                .stream()
                .filter(p -> p.preco.signum() > 0)
                .map(p -> new PlanoPublico(p.id, p.nome, p.descricao, numero(p.preco), p.duracaoMeses))
                .toList();
        List<HorarioPublico> horarios = configuracoes.horarios(loja).stream()
                .map(h -> new HorarioPublico(Configuracoes.DIAS[h.diaSemana - 1],
                        h.abre != null ? h.abre.toString() : null, h.fecha != null ? h.fecha.toString() : null, h.fechado))
                .toList();
        List<AulaPublica> aulas = Aula.<Aula>list("storeId = ?1 and ativo = true order by nome", loja).stream()
                .map(a -> new AulaPublica(a.nome, a.descricao, a.professor != null ? a.professor.nome : null,
                        a.duracaoMinutos, a.cor,
                        a.horarios.stream()
                                .filter(h -> h.ativo)
                                .sorted(Comparator.comparingInt((AulaHorario h) -> h.diaSemana)
                                        .thenComparing(h -> h.horaInicio))
                                .map(h -> new AulaHorarioPublico(h.diaSemana, Configuracoes.DIAS[h.diaSemana - 1],
                                        h.horaInicio.toString()))
                                .toList()))
                .filter(a -> !a.horarios().isEmpty())
                .toList();
        List<ProfissionalPublico> equipe = Profissional.<Profissional>list("storeId = ?1 and ativo = true order by nome", loja)
                .stream()
                .map(p -> new ProfissionalPublico(p.nome, p.especialidade))
                .toList();
        int alunos = (int) Assinatura.count("storeId = ?1 and status = ?2", loja, Assinatura.ATIVA);
        return new PaginaAcademiaJson(configuracoes.painel(loja).nomeAcademia, c.slug, c.whatsapp, c.telefone, c.email,
                c.endereco, alunos, planos, horarios, aulas, equipe, pagina);
    }

    // ---------- Editor (ModuloComPagina) ----------

    @Override
    public String modulo() {
        return MODULO;
    }

    @Override
    public UUID storeId() {
        return storeId;
    }

    @Override
    public String link() {
        return endereco.base() + "/a/" + configuracoes.config(storeId).slug;
    }

    @Override
    public Object dados() {
        return montar(storeId, null);
    }
}
