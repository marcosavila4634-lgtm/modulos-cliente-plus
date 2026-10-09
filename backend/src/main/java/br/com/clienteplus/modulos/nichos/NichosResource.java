package br.com.clienteplus.modulos.nichos;

import br.com.clienteplus.modulos.comum.Erro;
import br.com.clienteplus.modulos.nichos.PaginaDeNicho.HorarioNicho;
import br.com.clienteplus.modulos.nichos.PaginaDeNicho.NichoJson;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.List;

// Página pública de cada nicho (/n/<nicho>) e as lojas de exemplo.
// O editor usa as rotas comuns /api/paginas/nicho-<nicho> (pacote paginas).
@Path("/nichos")
@Produces(MediaType.APPLICATION_JSON)
public class NichosResource {

    @Inject
    Instance<PaginaDeNicho> nichos;

    @GET
    @Path("/{nicho}/publico")
    @Transactional
    public NichoJson publico(@PathParam("nicho") String nicho) {
        return nichos.stream()
                .filter(n -> n.nicho().equals(nicho))
                .findFirst()
                .orElseThrow(() -> Erro.naoEncontrado("Página não encontrada"))
                .publico();
    }

    // ---------- Lojas de exemplo (só do laboratório) ----------

    private static List<HorarioNicho> horarios(String semana, String sabado) {
        return List.of(
                new HorarioNicho("Segunda", semana), new HorarioNicho("Terça", semana), new HorarioNicho("Quarta", semana),
                new HorarioNicho("Quinta", semana), new HorarioNicho("Sexta", semana), new HorarioNicho("Sábado", sabado),
                new HorarioNicho("Domingo", "Fechado"));
    }

    @ApplicationScoped
    public static class Barbearia extends PaginaDeNicho {
        @Override
        public String nicho() {
            return "barbearia";
        }

        @Override
        protected NichoJson loja(JsonNode pagina) {
            return new NichoJson(nicho(), "Barbearia Navalha de Ouro", "11999990001", "Rua das Palmeiras, 120 - Centro", 184,
                    "assinantes no clube",
                    List.of(
                            plano("Corte", "Para quem quer o cabelo sempre em dia", 79.90, 1, "Cortes à vontade", "Agendamento pelo celular"),
                            plano("Corte + Barba", "O mais pedido da casa", 119.90, 1, "Cortes à vontade", "Barba à vontade",
                                    "Agendamento pelo celular"),
                            plano("Premium", "Tudo incluído, com prioridade na agenda", 159.90, 1, "Corte e barba à vontade",
                                    "Sobrancelha e pigmentação", "Prioridade na agenda", "10% de desconto em produtos")),
                    horarios("09:00 às 20:00", "09:00 às 18:00"),
                    List.of(new PessoaNicho("Carlos", "Barbeiro"), new PessoaNicho("Jonas", "Barbeiro"),
                            new PessoaNicho("Mateus", "Barbeiro e colorista")),
                    pagina);
        }
    }

    @ApplicationScoped
    public static class Salao extends PaginaDeNicho {
        @Override
        public String nicho() {
            return "salao";
        }

        @Override
        protected NichoJson loja(JsonNode pagina) {
            return new NichoJson(nicho(), "Studio Bella", "11999990002", "Av. das Flores, 455 - Jardim Europa", 132,
                    "clientes no clube",
                    List.of(
                            plano("Escova", "Cabelo arrumado toda semana", 99.90, 1, "4 escovas por mês", "1 hidratação por mês"),
                            plano("Cabelo + Unhas", "O queridinho das clientes", 179.90, 1, "4 escovas por mês", "2 manicures por mês",
                                    "1 hidratação por mês"),
                            plano("Completo", "Para quem não abre mão de nada", 289.90, 1, "Escovas à vontade", "Manicure e pedicure",
                                    "1 coloração de raiz por mês", "15% de desconto em serviços extras")),
                    horarios("09:00 às 19:00", "08:00 às 17:00"),
                    List.of(new PessoaNicho("Fernanda", "Cabeleireira"), new PessoaNicho("Aline", "Manicure"),
                            new PessoaNicho("Bruna", "Maquiadora")),
                    pagina);
        }
    }

    @ApplicationScoped
    public static class Terapeuta extends PaginaDeNicho {
        @Override
        public String nicho() {
            return "terapeuta";
        }

        @Override
        protected NichoJson loja(JsonNode pagina) {
            return new NichoJson(nicho(), "Espaço Equilíbrio", "11999990003", "Rua do Sossego, 88 - Sala 3", 46,
                    "pessoas em acompanhamento",
                    List.of(
                            plano("Cuidado mensal", "Uma pausa por mês", 140.00, 1, "1 sessão de 60 minutos por mês"),
                            plano("Cuidado quinzenal", "Para manter o corpo e a mente em equilíbrio", 250.00, 1,
                                    "2 sessões de 60 minutos por mês", "Aromaterapia incluída"),
                            plano("Cuidado semanal", "Acompanhamento contínuo", 440.00, 1, "4 sessões de 60 minutos por mês",
                                    "Aromaterapia incluída", "Prioridade para remarcar")),
                    horarios("08:00 às 19:00", "08:00 às 12:00"),
                    List.of(new PessoaNicho("Marina Alves", "Massoterapeuta")),
                    pagina);
        }
    }
}
