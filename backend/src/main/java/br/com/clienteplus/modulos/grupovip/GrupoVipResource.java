package br.com.clienteplus.modulos.grupovip;

import static br.com.clienteplus.modulos.comum.Formatos.data;
import static br.com.clienteplus.modulos.comum.Formatos.diaEHora;
import static br.com.clienteplus.modulos.comum.Formatos.mesAbreviado;
import static br.com.clienteplus.modulos.comum.Formatos.numero;

import br.com.clienteplus.modulos.grupovip.DashboardGrupoVip.*;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@Path("/grupo-vip")
@Produces(MediaType.APPLICATION_JSON)
public class GrupoVipResource {

    // Loja de exemplo, até existir login (application.properties).
    @ConfigProperty(name = "grupo-vip.store-id")
    UUID storeId;

    // Painel do dono dos grupos, montado a partir das tabelas grupo_vip_*.
    @GET
    @Path("/dashboard")
    public DashboardGrupoVip dashboard() {
        GrupoVipPainel painel = GrupoVipPainel.<GrupoVipPainel>find("storeId", storeId)
                .firstResultOptional()
                .orElseThrow(() -> new NotFoundException("Painel de Grupos VIP não encontrado"));

        Map<String, GrupoVipIndicador> ind = GrupoVipIndicador.<GrupoVipIndicador>list("storeId", storeId).stream()
                .collect(Collectors.toMap(i -> i.chave, Function.identity()));

        return new DashboardGrupoVip(
                true,
                new GrupoAtual(painel.nomeGrupoAtual),
                new Gestor(painel.gestorNome, painel.gestorSobrenome, painel.gestorCargo),
                painel.notificacoes,
                painel.frase,
                painel.fraseDestaque,
                new Indicadores(
                        comMesAnterior(ind.get("membros_ativos")),
                        comMesAnterior(ind.get("conteudos_publicados")),
                        comMesAnterior(ind.get("visualizacoes")),
                        comMesAnterior(ind.get("receita_mes")),
                        valor(ind.get("novos_este_mes")),
                        valor(ind.get("ticket_medio"))),
                GrupoVipMembro.<GrupoVipMembro>find("storeId = ?1 order by entrouEm desc", storeId)
                        .page(0, 5)
                        .stream()
                        .map(m -> new MembroRecente(m.nome, m.foto, m.plano, m.grupo.nome, data(m.entrouEm), m.status))
                        .toList(),
                // Últimos 7 meses, do mais antigo para o mais recente.
                GrupoVipCrescimentoMensal.<GrupoVipCrescimentoMensal>find("storeId = ?1 order by mes desc", storeId)
                        .page(0, 7)
                        .list()
                        .reversed()
                        .stream()
                        .map(c -> new CrescimentoMembros(
                                mesAbreviado(c.mes),
                                c.membros,
                                c.dataReferencia != null ? c.dataReferencia.toString() : null))
                        .toList(),
                GrupoVipConteudo.<GrupoVipConteudo>find("storeId = ?1 order by acessos desc", storeId)
                        .page(0, 5)
                        .stream()
                        .map(c -> new ConteudoAcessado(c.titulo, c.acessos))
                        .toList(),
                GrupoVipPlano.<GrupoVipPlano>list("storeId = ?1 order by ordem", storeId).stream()
                        .map(p -> new PlanoMembros(p.nome, p.percentualMembros))
                        .toList(),
                GrupoVipAviso.<GrupoVipAviso>find("storeId = ?1 order by enviadoEm desc", storeId)
                        .page(0, 4)
                        .stream()
                        .map(a -> new Aviso(a.tipo, a.titulo, diaEHora(a.enviadoEm), a.status))
                        .toList(),
                GrupoVipGrupo.<GrupoVipGrupo>find("storeId = ?1 order by membros desc", storeId)
                        .page(0, 5)
                        .stream()
                        .map(g -> new Grupo(g.nome, g.plataforma, g.membros, g.cor))
                        .toList(),
                GrupoVipEvento.<GrupoVipEvento>find("storeId = ?1 order by comecaEm", storeId)
                        .page(0, 3)
                        .stream()
                        .map(e -> new Evento(e.titulo, e.foto, diaEHora(e.comecaEm), e.status))
                        .toList());
    }

    // Indicador ausente no banco aparece zerado no painel.
    private static ComMesAnterior comMesAnterior(GrupoVipIndicador i) {
        if (i == null) return new ComMesAnterior(0, 0, 0);
        return new ComMesAnterior(numero(i.valor), numero(i.variacao), numero(i.mesAnterior));
    }

    private static Number valor(GrupoVipIndicador i) {
        return i == null ? 0 : numero(i.valor);
    }
}
