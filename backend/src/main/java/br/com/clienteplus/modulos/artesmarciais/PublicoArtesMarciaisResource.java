package br.com.clienteplus.modulos.artesmarciais;

import br.com.clienteplus.modulos.academia.AcademiaConfig;
import br.com.clienteplus.modulos.academia.Configuracoes;
import br.com.clienteplus.modulos.academia.Matriculas;
import br.com.clienteplus.modulos.artesmarciais.ArtesMarciaisContrato.*;
import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.clienteplus.Pagamento;
import br.com.clienteplus.modulos.comum.Erro;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.List;
import java.util.UUID;

// Páginas sem o painel: certificado (qualquer pessoa confere pelo código),
// presença pelo QR Code, área do aluno e área do responsável.
//
// No projeto principal, a área do aluno e a do responsável viram abas na área
// do cliente do Cliente Plus (com login). Aqui o aluno é escolhido pelo id e o
// responsável pelo código do link.
@Path("/artes-marciais/publico")
@Produces(MediaType.APPLICATION_JSON)
public class PublicoArtesMarciaisResource {

    @Inject
    Graduacoes graduacoes;

    @Inject
    Presencas presencas;

    @Inject
    PainelLutas painel;

    @Inject
    Eventos eventos;

    @Inject
    Loja loja;

    @Inject
    Comunicacao comunicacao;

    @Inject
    Matriculas matriculas;

    @Inject
    Configuracoes configuracoes;

    @GET
    @Path("/certificados/{codigo}")
    public Certificado certificado(@PathParam("codigo") String codigo) {
        return graduacoes.certificado(codigo);
    }

    @GET
    @Path("/presenca/{codigo}")
    public PaginaPresenca presenca(@PathParam("codigo") String codigo) {
        return presencas.pagina(codigo);
    }

    @POST
    @Path("/presenca/{codigo}")
    public RespostaPresenca marcarPresenca(@PathParam("codigo") String codigo, PedidoPresenca d) {
        return presencas.marcar(codigo, d);
    }

    // ---------- Área do aluno ----------

    Cliente aluno(UUID id) {
        Cliente c = Cliente.findById(id);
        if (c == null || ConfigArtesMarciais.count("storeId", c.storeId) == 0) throw Erro.naoEncontrado("Aluno não encontrado");
        return c;
    }

    String whatsapp(UUID storeId) {
        AcademiaConfig c = configuracoes.config(storeId);
        return c.whatsapp;
    }

    @GET
    @Path("/aluno/{id}")
    public AreaAluno area(@PathParam("id") UUID id) {
        Cliente c = aluno(id);
        UUID loja = c.storeId;
        FichaLutas ficha = painel.ficha(loja, c);
        List<TecnicaJson> curriculo = ficha.modalidades().stream()
                .flatMap(p -> graduacoes.curriculo(loja, p.modalidade().id()).stream())
                .toList();
        List<EventoResumo> abertos = eventos.lista(loja).stream()
                .filter(e -> e.abertoNoApp() && "inscricoes_abertas".equals(e.fase()))
                .toList();
        return new AreaAluno(graduacoes.nomeAcademia(loja), whatsapp(loja), ficha, curriculo, abertos,
                comunicacao.mural(loja, c), this.loja.vitrine(loja), presencas.rankingDoMes(loja, 10));
    }

    @POST
    @Path("/aluno/{id}/inscricoes")
    public AreaAluno inscrever(@PathParam("id") UUID id, InscricaoAluno d) {
        Cliente c = aluno(id);
        if (d == null || d.eventoId() == null) throw Erro.invalido("Escolha o evento");
        EventoLuta e = eventos.evento(c.storeId, d.eventoId());
        if (!e.abertoNoApp) throw Erro.conflito("A inscrição deste evento é feita na recepção");
        eventos.inscrever(c.storeId, e.id, c, d.categoria(), d.peso(), false, null, "area_aluno");
        return area(id);
    }

    @DELETE
    @Path("/aluno/{id}/inscricoes/{inscricaoId}")
    @Transactional
    public AreaAluno cancelarInscricao(@PathParam("id") UUID id, @PathParam("inscricaoId") UUID inscricaoId) {
        Cliente c = aluno(id);
        Inscricao i = Inscricao.findById(inscricaoId);
        if (i == null || !i.cliente.id.equals(c.id)) throw Erro.naoEncontrado("Inscrição não encontrada");
        eventos.cancelarInscricao(c.storeId, i.evento.id, i.id);
        return area(id);
    }

    // ---------- Área do responsável ----------

    @GET
    @Path("/responsavel/{codigo}")
    public AreaResponsavel responsavel(@PathParam("codigo") String codigo) {
        Responsavel r = Responsavel.<Responsavel>find("codigo", codigo).firstResult();
        if (r == null) throw Erro.naoEncontrado("Link do responsável inválido");
        UUID loja = r.storeId;
        List<FilhoResumo> filhos = Dependente.<Dependente>list("responsavel", r).stream()
                .map(d -> {
                    FichaLutas f = painel.ficha(loja, d.cliente);
                    int mes = f.conquistas().isEmpty() ? 0 : presencasNoMes(loja, d.cliente);
                    List<CobrancaAberta> cobrancas = Pagamento.<Pagamento>list(
                                    "cliente = ?1 and status = 'pendente' order by vencimento", d.cliente).stream()
                            .map(p -> new CobrancaAberta(p.id,
                                    p.assinatura != null ? "Mensalidade - " + p.assinatura.plano.nome : p.descricao,
                                    br.com.clienteplus.modulos.comum.Formatos.numero(p.valor), p.vencimento,
                                    Lutas.situacao(p)))
                            .toList();
                    return new FilhoResumo(f, mes, cobrancas);
                })
                .toList();
        List<AvisoMural> avisos = comunicacao.mural(loja, null).stream()
                .limit(5)
                .toList();
        return new AreaResponsavel(graduacoes.nomeAcademia(loja), whatsapp(loja), r.nome, filhos, avisos);
    }

    int presencasNoMes(UUID loja, Cliente c) {
        var hoje = Lutas.hoje();
        Graduacoes.Aulas a = graduacoes.aulas(loja, c.id);
        return AlunoModalidade.<AlunoModalidade>list("cliente = ?1 and ativo = true", c).stream()
                .mapToInt(am -> a.entre(c.id, am.modalidade.id, hoje.withDayOfMonth(1), hoje))
                .sum();
    }
}
