package br.com.clienteplus.modulos.artesmarciais;

import br.com.clienteplus.modulos.academia.Matriculas;
import br.com.clienteplus.modulos.artesmarciais.ArtesMarciaisContrato.*;
import br.com.clienteplus.modulos.comum.Erro;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;

// Rotas do painel do Artes Marciais (o dono do dojo). O que é igual à
// Academia (alunos, check-in, aulas, financeiro...) continua em /api/academia,
// com o cabeçalho X-Modulo: artes-marciais (ver academia/LojaAcademia).
@Path("/artes-marciais")
@Produces(MediaType.APPLICATION_JSON)
public class ArtesMarciaisResource {

    // Dojo de exemplo, até existir login (application.properties).
    @ConfigProperty(name = "artes-marciais.store-id")
    UUID storeId;

    @Inject
    Graduacoes graduacoes;

    @Inject
    Exames exames;

    @Inject
    Eventos eventos;

    @Inject
    Loja loja;

    @Inject
    Equipamentos equipamentos;

    @Inject
    Familias familias;

    @Inject
    Comunicacao comunicacao;

    @Inject
    Presencas presencas;

    @Inject
    PainelLutas painel;

    @Inject
    Matriculas matriculas;

    // ---------- Dashboard e configurações ----------

    @GET
    @Path("/dashboard")
    public DashboardLutas dashboard() {
        return painel.montar(storeId);
    }

    @GET
    @Path("/config")
    public ConfigJson config() {
        ConfigArtesMarciais c = graduacoes.config(storeId);
        return new ConfigJson(c.contarAulasPor, c.idadeAdulto, c.lema, c.codigoPresenca, presencas.linkPresenca(storeId));
    }

    @PUT
    @Path("/config")
    @Transactional
    public ConfigJson salvarConfig(DadosConfig d) {
        ConfigArtesMarciais c = graduacoes.config(storeId);
        if (d == null) throw Erro.invalido("Dados das configurações");
        if (d.contarAulasPor() != null) {
            if (!Set.of("aulas", "checkins").contains(d.contarAulasPor())) throw Erro.invalido("Opção inválida");
            c.contarAulasPor = d.contarAulasPor();
        }
        if (d.idadeAdulto() != null) {
            if (d.idadeAdulto() < 4 || d.idadeAdulto() > 21) throw Erro.invalido("Idade adulta: de 4 a 21 anos");
            c.idadeAdulto = d.idadeAdulto();
        }
        if (d.lema() != null) c.lema = d.lema().trim();
        c.updatedAt = java.time.OffsetDateTime.now();
        return config();
    }

    // Troca o QR Code de presença (o antigo para de funcionar).
    @POST
    @Path("/config/novo-qr")
    @Transactional
    public ConfigJson novoQr() {
        graduacoes.config(storeId).codigoPresenca = Lutas.codigo(10);
        return config();
    }

    // ---------- Modalidades, faixas, currículo ----------

    @GET
    @Path("/modalidades")
    public List<ModalidadeJson> modalidades() {
        return graduacoes.modalidadesJson(storeId);
    }

    @POST
    @Path("/modalidades")
    public List<ModalidadeJson> criarModalidade(DadosModalidade d) {
        graduacoes.salvarModalidade(storeId, null, d);
        return modalidades();
    }

    @PUT
    @Path("/modalidades/{id}")
    public List<ModalidadeJson> salvarModalidade(@PathParam("id") UUID id, DadosModalidade d) {
        graduacoes.salvarModalidade(storeId, id, d);
        return modalidades();
    }

    @POST
    @Path("/modalidades/{id}/faixas")
    public List<ModalidadeJson> criarFaixa(@PathParam("id") UUID id, DadosFaixa d) {
        graduacoes.salvarFaixa(storeId, id, null, d);
        return modalidades();
    }

    @PUT
    @Path("/faixas/{id}")
    public List<ModalidadeJson> salvarFaixa(@PathParam("id") UUID id, DadosFaixa d) {
        graduacoes.salvarFaixa(storeId, null, id, d);
        return modalidades();
    }

    @DELETE
    @Path("/faixas/{id}")
    public List<ModalidadeJson> excluirFaixa(@PathParam("id") UUID id) {
        graduacoes.excluirFaixa(storeId, id);
        return modalidades();
    }

    @PUT
    @Path("/modalidades/{id}/ordem-faixas")
    public List<ModalidadeJson> ordenarFaixas(@PathParam("id") UUID id, NovaOrdem d) {
        graduacoes.ordenarFaixas(storeId, id, d != null ? d.ids() : null);
        return modalidades();
    }

    @GET
    @Path("/aulas-modalidades")
    public List<AulaDaModalidade> aulasModalidades() {
        return graduacoes.aulasDasModalidades(storeId);
    }

    @PUT
    @Path("/aulas/{aulaId}/modalidade")
    public List<AulaDaModalidade> modalidadeDaAula(@PathParam("aulaId") UUID aulaId, DadosAulaModalidade d) {
        graduacoes.definirModalidadeDaAula(storeId, aulaId, d);
        return aulasModalidades();
    }

    @GET
    @Path("/modalidades/{id}/curriculo")
    public List<TecnicaJson> curriculo(@PathParam("id") UUID id) {
        graduacoes.modalidade(storeId, id);
        return graduacoes.curriculo(storeId, id);
    }

    @POST
    @Path("/modalidades/{id}/curriculo")
    public List<TecnicaJson> criarTecnica(@PathParam("id") UUID id, DadosTecnica d) {
        graduacoes.salvarTecnica(storeId, id, null, d);
        return graduacoes.curriculo(storeId, id);
    }

    @PUT
    @Path("/modalidades/{id}/curriculo/{tecnicaId}")
    public List<TecnicaJson> salvarTecnica(@PathParam("id") UUID id, @PathParam("tecnicaId") UUID tecnicaId,
            DadosTecnica d) {
        graduacoes.salvarTecnica(storeId, id, tecnicaId, d);
        return graduacoes.curriculo(storeId, id);
    }

    @DELETE
    @Path("/modalidades/{id}/curriculo/{tecnicaId}")
    public List<TecnicaJson> excluirTecnica(@PathParam("id") UUID id, @PathParam("tecnicaId") UUID tecnicaId) {
        graduacoes.excluirTecnica(storeId, tecnicaId);
        return graduacoes.curriculo(storeId, id);
    }

    // ---------- Graduações ----------

    @GET
    @Path("/graduacoes")
    public PainelGraduacoes graduacoes() {
        return graduacoes.painel(storeId);
    }

    @POST
    @Path("/graduacoes")
    public GraduacaoJson graduar(DadosGraduacao d) {
        return Graduacoes.json(graduacoes.graduar(storeId, d, null));
    }

    // Ficha de luta do aluno (ficha do aluno no painel).
    @GET
    @Path("/alunos/{id}")
    public FichaLutas ficha(@PathParam("id") UUID id) {
        return painel.ficha(storeId, matriculas.aluno(storeId, id));
    }

    @POST
    @Path("/alunos/{id}/modalidades")
    public FichaLutas adicionarModalidade(@PathParam("id") UUID id, DadosAlunoModalidade d) {
        graduacoes.adicionarModalidade(storeId, matriculas.aluno(storeId, id), d);
        return ficha(id);
    }

    @DELETE
    @Path("/alunos/{id}/modalidades/{alunoModalidadeId}")
    public FichaLutas sairDaModalidade(@PathParam("id") UUID id, @PathParam("alunoModalidadeId") UUID am) {
        graduacoes.sairDaModalidade(storeId, am);
        return ficha(id);
    }

    // Faixa principal de cada aluno (lista de alunos).
    @GET
    @Path("/alunos-faixas")
    public List<Progresso> alunosFaixas() {
        return graduacoes.progressos(storeId);
    }

    // ---------- Exames ----------

    @GET
    @Path("/exames")
    public List<ExameResumo> exames() {
        return exames.lista(storeId);
    }

    @POST
    @Path("/exames")
    public ExameDetalhe criarExame(DadosExame d) {
        return exames.detalhe(storeId, exames.salvar(storeId, null, d).id);
    }

    @GET
    @Path("/exames/{id}")
    public ExameDetalhe exame(@PathParam("id") UUID id) {
        return exames.detalhe(storeId, id);
    }

    @PUT
    @Path("/exames/{id}")
    public ExameDetalhe salvarExame(@PathParam("id") UUID id, DadosExame d) {
        exames.salvar(storeId, id, d);
        return exame(id);
    }

    @POST
    @Path("/exames/{id}/candidatos")
    public ExameDetalhe adicionarCandidato(@PathParam("id") UUID id, NovoCandidato d) {
        exames.adicionarCandidato(storeId, id, d);
        return exame(id);
    }

    @DELETE
    @Path("/exames/{id}/candidatos/{candidatoId}")
    public ExameDetalhe removerCandidato(@PathParam("id") UUID id, @PathParam("candidatoId") UUID c) {
        exames.removerCandidato(storeId, id, c);
        return exame(id);
    }

    @PUT
    @Path("/exames/{id}/candidatos/{candidatoId}")
    public ExameDetalhe resultadoCandidato(@PathParam("id") UUID id, @PathParam("candidatoId") UUID c,
            ResultadoCandidato d) {
        exames.resultado(storeId, id, c, d);
        return exame(id);
    }

    @POST
    @Path("/exames/{id}/concluir")
    public ExameDetalhe concluirExame(@PathParam("id") UUID id, ConcluirExame d) {
        exames.concluir(storeId, id, d);
        return exame(id);
    }

    @POST
    @Path("/exames/{id}/cancelar")
    public ExameDetalhe cancelarExame(@PathParam("id") UUID id) {
        exames.cancelar(storeId, id);
        return exame(id);
    }

    // ---------- Eventos ----------

    @GET
    @Path("/eventos")
    public List<EventoResumo> eventos() {
        return eventos.lista(storeId);
    }

    @POST
    @Path("/eventos")
    public EventoDetalhe criarEvento(DadosEvento d) {
        return eventos.detalhe(storeId, eventos.salvar(storeId, null, d).id);
    }

    @GET
    @Path("/eventos/ranking")
    public Ranking ranking(@QueryParam("ano") Integer ano) {
        return eventos.ranking(storeId, ano != null ? ano : Lutas.hoje().getYear());
    }

    @GET
    @Path("/eventos/{id}")
    public EventoDetalhe evento(@PathParam("id") UUID id) {
        return eventos.detalhe(storeId, id);
    }

    @PUT
    @Path("/eventos/{id}")
    public EventoDetalhe salvarEvento(@PathParam("id") UUID id, DadosEvento d) {
        eventos.salvar(storeId, id, d);
        return evento(id);
    }

    @POST
    @Path("/eventos/{id}/cancelar")
    public EventoDetalhe cancelarEvento(@PathParam("id") UUID id) {
        eventos.cancelarEvento(storeId, id);
        return evento(id);
    }

    @POST
    @Path("/eventos/{id}/inscricoes")
    public EventoDetalhe inscrever(@PathParam("id") UUID id, NovaInscricao d) {
        if (d == null || d.alunoId() == null) throw Erro.invalido("Escolha o aluno");
        eventos.inscrever(storeId, id, matriculas.aluno(storeId, d.alunoId()), d.categoria(), d.peso(),
                Boolean.TRUE.equals(d.pago()), d.formaPagamento(), "recepcao");
        return evento(id);
    }

    @GET
    @Path("/eventos/{id}/categoria")
    public java.util.Map<String, String> categoria(@PathParam("id") UUID id, @QueryParam("aluno") UUID alunoId) {
        return java.util.Map.of("categoria", eventos.categoriaSugerida(storeId, eventos.evento(storeId, id),
                matriculas.aluno(storeId, alunoId)));
    }

    @PUT
    @Path("/eventos/{id}/inscricoes/{inscricaoId}")
    public EventoDetalhe resultado(@PathParam("id") UUID id, @PathParam("inscricaoId") UUID i, DadosResultado d) {
        eventos.resultado(storeId, id, i, d);
        return evento(id);
    }

    @DELETE
    @Path("/eventos/{id}/inscricoes/{inscricaoId}")
    public EventoDetalhe cancelarInscricao(@PathParam("id") UUID id, @PathParam("inscricaoId") UUID i) {
        eventos.cancelarInscricao(storeId, id, i);
        return evento(id);
    }

    // ---------- Filiações ----------

    @GET
    @Path("/filiacoes")
    public List<FiliacaoJson> filiacoes() {
        return eventos.filiacoes(storeId);
    }

    @POST
    @Path("/filiacoes")
    public List<FiliacaoJson> criarFiliacao(DadosFiliacao d) {
        eventos.salvarFiliacao(storeId, null, d);
        return filiacoes();
    }

    @PUT
    @Path("/filiacoes/{id}")
    public List<FiliacaoJson> salvarFiliacao(@PathParam("id") UUID id, DadosFiliacao d) {
        eventos.salvarFiliacao(storeId, id, d);
        return filiacoes();
    }

    @DELETE
    @Path("/filiacoes/{id}")
    public List<FiliacaoJson> excluirFiliacao(@PathParam("id") UUID id) {
        eventos.excluirFiliacao(storeId, id);
        return filiacoes();
    }

    // ---------- Loja ----------

    @GET
    @Path("/loja")
    public PainelLoja loja() {
        return loja.painel(storeId);
    }

    @POST
    @Path("/loja/produtos")
    public PainelLoja criarProduto(DadosProduto d) {
        loja.salvar(storeId, null, d);
        return loja();
    }

    @PUT
    @Path("/loja/produtos/{id}")
    public PainelLoja salvarProduto(@PathParam("id") UUID id, DadosProduto d) {
        loja.salvar(storeId, id, d);
        return loja();
    }

    @POST
    @Path("/loja/produtos/{id}/estoque")
    public PainelLoja estoque(@PathParam("id") UUID id, DadosMovimento d) {
        loja.movimentar(storeId, id, d);
        return loja();
    }

    @POST
    @Path("/loja/vendas")
    public PainelLoja vender(NovaVenda d) {
        loja.vender(storeId, d);
        return loja();
    }

    @POST
    @Path("/loja/vendas/{id}/cancelar")
    public PainelLoja cancelarVenda(@PathParam("id") UUID id) {
        loja.cancelar(storeId, id);
        return loja();
    }

    @POST
    @Path("/loja/vendas/{id}/entregar")
    public PainelLoja entregar(@PathParam("id") UUID id) {
        loja.entregar(storeId, id);
        return loja();
    }

    // ---------- Equipamentos ----------

    @GET
    @Path("/equipamentos")
    public List<EquipamentoJson> equipamentos() {
        return equipamentos.lista(storeId);
    }

    @POST
    @Path("/equipamentos")
    public List<EquipamentoJson> criarEquipamento(DadosEquipamento d) {
        equipamentos.salvar(storeId, null, d);
        return equipamentos();
    }

    @PUT
    @Path("/equipamentos/{id}")
    public List<EquipamentoJson> salvarEquipamento(@PathParam("id") UUID id, DadosEquipamento d) {
        equipamentos.salvar(storeId, id, d);
        return equipamentos();
    }

    @DELETE
    @Path("/equipamentos/{id}")
    public List<EquipamentoJson> excluirEquipamento(@PathParam("id") UUID id) {
        equipamentos.excluir(storeId, id);
        return equipamentos();
    }

    @POST
    @Path("/equipamentos/{id}/manutencoes")
    public List<EquipamentoJson> manutencao(@PathParam("id") UUID id, NovaManutencao d) {
        equipamentos.manutencao(storeId, id, d);
        return equipamentos();
    }

    // ---------- Responsáveis (kids) ----------

    @GET
    @Path("/responsaveis")
    public PainelResponsaveis responsaveis() {
        return familias.painel(storeId);
    }

    @POST
    @Path("/responsaveis")
    public PainelResponsaveis criarResponsavel(DadosResponsavelComFilho d) {
        Responsavel r = familias.salvar(storeId, null,
                new DadosResponsavel(d.nome(), d.telefone(), d.email(), d.cpf()));
        if (d.alunoId() != null) familias.adicionarDependente(storeId, r.id, new NovoDependente(d.alunoId(), d.parentesco()));
        return responsaveis();
    }

    public record DadosResponsavelComFilho(String nome, String telefone, String email, String cpf, UUID alunoId,
            String parentesco) {}

    @PUT
    @Path("/responsaveis/{id}")
    public PainelResponsaveis salvarResponsavel(@PathParam("id") UUID id, DadosResponsavel d) {
        familias.salvar(storeId, id, d);
        return responsaveis();
    }

    @DELETE
    @Path("/responsaveis/{id}")
    public PainelResponsaveis excluirResponsavel(@PathParam("id") UUID id) {
        familias.excluir(storeId, id);
        return responsaveis();
    }

    @POST
    @Path("/responsaveis/{id}/dependentes")
    public PainelResponsaveis adicionarDependente(@PathParam("id") UUID id, NovoDependente d) {
        familias.adicionarDependente(storeId, id, d);
        return responsaveis();
    }

    @DELETE
    @Path("/responsaveis/{id}/dependentes/{alunoId}")
    public PainelResponsaveis removerDependente(@PathParam("id") UUID id, @PathParam("alunoId") UUID alunoId) {
        familias.removerDependente(storeId, id, alunoId);
        return responsaveis();
    }

    // ---------- Comunicação ----------

    @GET
    @Path("/comunicados")
    public List<ComunicadoJson> comunicados() {
        return comunicacao.lista(storeId);
    }

    @POST
    @Path("/comunicados/previa")
    public Previa previa(DadosComunicado d) {
        if (d == null) throw Erro.invalido("Dados do comunicado");
        return comunicacao.previa(storeId, d.publico(), d.filtroId(), d.texto());
    }

    @POST
    @Path("/comunicados")
    public ComunicadoDetalhe criarComunicado(DadosComunicado d) {
        return comunicacao.detalhe(storeId, comunicacao.criar(storeId, d).id);
    }

    @GET
    @Path("/comunicados/{id}")
    public ComunicadoDetalhe comunicado(@PathParam("id") UUID id) {
        return comunicacao.detalhe(storeId, id);
    }

    @POST
    @Path("/comunicados/{id}/envios/{envioId}")
    public ComunicadoDetalhe marcarEnviado(@PathParam("id") UUID id, @PathParam("envioId") UUID envioId,
            @QueryParam("desfazer") boolean desfazer) {
        comunicacao.marcarEnviado(storeId, id, envioId, !desfazer);
        return comunicado(id);
    }

    @DELETE
    @Path("/comunicados/{id}")
    public List<ComunicadoJson> excluirComunicado(@PathParam("id") UUID id) {
        comunicacao.excluir(storeId, id);
        return comunicados();
    }

    // ---------- Presença ----------

    @GET
    @Path("/presenca")
    public PainelPresenca presenca() {
        return presencas.painel(storeId);
    }

    @GET
    @Path("/presenca/ranking")
    public List<LinhaRankingPresenca> rankingPresenca() {
        return presencas.rankingDoMes(storeId, 100);
    }

    // Aulas por dia de um período (relatório de frequência por modalidade).
    @GET
    @Path("/presenca/aulas")
    public List<AulaDeHoje> aulasDeHoje(@QueryParam("data") LocalDate data) {
        return presencas.aulasDeHoje(storeId);
    }
}
