package br.com.clienteplus.modulos.grupovip;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

// Formato do JSON de conteúdos, categorias, lives e anúncios.
// Contrato com o frontend: frontend/src/lib/grupo-vip-conteudos.ts
public final class ConteudosContrato {

    private ConteudosContrato() {}

    public record Opcao(UUID id, String nome) {}

    // topicos: tópicos do grupo (Telegram no modo fórum); vazio = grupo sem tópicos
    public record GrupoOpcao(UUID id, String nome, String plataforma, boolean automatico, List<Opcao> topicos) {}

    // ---------- Categorias ----------

    public record CategoriaJson(UUID id, String nome, String cor, int conteudos, int visualizacoes) {}

    public record DadosCategoria(String nome, String cor) {}

    // ---------- Conteúdos ----------

    // status: "pendente" | "enviado" | "manual" | "falhou" | "apagado"
    // noTelegram = o robô postou e guarda o post (dá para fixar, editar e apagar)
    // erro também aparece em "enviado" como aviso (ex.: não deu para fixar)
    public record Publicacao(UUID id, UUID grupoId, String grupo, String plataforma, String status, String erro,
                             OffsetDateTime enviadoEm, UUID topicoId, String topico, boolean noTelegram, boolean fixado) {}

    public record ConteudoJson(
            UUID id,
            String titulo,
            String texto,
            UUID categoriaId,
            String categoria,
            String cor,
            String midiaUrl,
            String midiaTipo,
            String link,
            String botaoTexto,
            boolean fixar,
            // "rascunho" | "agendado" | "publicado"
            String status,
            OffsetDateTime agendadoPara,
            OffsetDateTime publicadoEm,
            boolean naAreaMembro,
            OffsetDateTime createdAt,
            List<Publicacao> grupos,
            int visualizacoes,
            int pessoas) {}

    // quando: "agora" | "agendar" | "rascunho"
    // botaoTexto: com link, o link vira um botão no post do Telegram
    // topicos: grupo -> tópico onde postar (grupos com tópicos)
    // atualizarNosGrupos: conteúdo já publicado, edita também os posts do Telegram
    public record DadosConteudo(
            String titulo,
            String texto,
            UUID categoriaId,
            String midiaUrl,
            String midiaTipo,
            String link,
            String botaoTexto,
            boolean fixar,
            List<UUID> grupoIds,
            Map<UUID, UUID> topicos,
            boolean naAreaMembro,
            String quando,
            LocalDateTime agendadoPara,
            boolean atualizarNosGrupos) {}

    public record ListaConteudos(List<ConteudoJson> conteudos, List<CategoriaJson> categorias, List<GrupoOpcao> grupos) {}

    // ---------- Lives e eventos ----------

    // status: "agendado" | "ao_vivo" | "encerrado" | "cancelado"
    public record EventoJson(
            UUID id,
            String titulo,
            String descricao,
            String foto,
            String link,
            OffsetDateTime comecaEm,
            int duracaoMinutos,
            int avisoMinutos,
            OffsetDateTime avisadoEm,
            String status,
            UUID grupoId,
            String grupo) {}

    public record DadosEvento(
            String titulo,
            String descricao,
            String foto,
            String link,
            LocalDateTime comecaEm,
            Integer duracaoMinutos,
            Integer avisoMinutos,
            UUID grupoId) {}

    public record ListaEventos(List<EventoJson> eventos, List<GrupoOpcao> grupos) {}

    // ---------- Anúncios ----------

    public record AnuncioJson(
            UUID id,
            String titulo,
            String texto,
            String tipo,
            String publico,
            UUID publicoRef,
            String publicoNome,
            int destinatarios,
            boolean postadoNosGrupos,
            OffsetDateTime enviadoEm,
            int enviadas,
            int pendentes) {}

    public record DadosAnuncio(String titulo, String texto, String tipo, String publico, UUID publicoRef,
                               boolean postarNosGrupos) {}

    // quantidade = pessoas no público; semCanal = sem Telegram conectado e sem WhatsApp
    public record Publico(int quantidade, int semCanal, int telegram, int whatsapp) {}

    public record ListaAnuncios(List<AnuncioJson> anuncios, List<Opcao> planos, List<Opcao> grupos) {}
}
