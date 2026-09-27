package br.com.clienteplus.modulos.grupovip;

import static br.com.clienteplus.modulos.comum.Formatos.FUSO;

import br.com.clienteplus.modulos.clienteplus.Plano;
import br.com.clienteplus.modulos.comum.Erro;
import br.com.clienteplus.modulos.grupovip.ConteudosContrato.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

// Conteúdos (publicados nos grupos e na área do membro), categorias, lives e
// anúncios.
//
// Publicar num grupo do Telegram com o robô: o robô posta sozinho. Nos demais
// (WhatsApp): a publicação fica "manual" e o dono copia o texto, posta no
// grupo e marca como publicada.
@ApplicationScoped
public class Conteudos {

    @Inject
    Membros membros;

    @Inject
    Telegram telegram;

    @Inject
    Mensageiro mensageiro;

    static final Set<String> CORES = Set.of("orange", "sky", "violet", "emerald", "rose", "amber");
    static final Set<String> TIPOS_ANUNCIO = Set.of("conteudo", "manutencao", "live", "material", "promocao");
    static final Set<String> PUBLICOS = Set.of("todos", "em_dia", "atrasados", "sem_acesso", "plano", "grupo", "novos");

    // ---------- Categorias ----------

    public List<CategoriaJson> categorias(UUID storeId) {
        Map<UUID, Long> porCategoria = Conteudo.<Conteudo>list("storeId = ?1 and categoria is not null", storeId).stream()
                .collect(Collectors.groupingBy(c -> c.categoria.id, Collectors.counting()));
        Map<UUID, Long> views = ConteudoView.<ConteudoView>list("storeId = ?1 and conteudo.categoria is not null", storeId)
                .stream()
                .collect(Collectors.groupingBy(v -> v.conteudo.categoria.id, Collectors.counting()));
        return Categoria.<Categoria>list("storeId = ?1 order by nome", storeId).stream()
                .map(c -> new CategoriaJson(c.id, c.nome, c.cor, porCategoria.getOrDefault(c.id, 0L).intValue(),
                        views.getOrDefault(c.id, 0L).intValue()))
                .toList();
    }

    public Categoria salvarCategoria(UUID storeId, UUID id, DadosCategoria d) {
        if (d == null) throw Erro.invalido("Informe o nome da categoria");
        Categoria c = id == null ? new Categoria() : categoria(storeId, id);
        String nome = Membros.limpo(d.nome());
        if (nome == null) throw Erro.invalido("Informe o nome da categoria");
        if (Categoria.count("storeId = ?1 and lower(nome) = ?2 and id <> ?3", storeId, nome.toLowerCase(),
                id != null ? id : new UUID(0, 0)) > 0) {
            throw Erro.conflito("Já existe uma categoria com este nome");
        }
        c.storeId = storeId;
        c.nome = nome;
        c.cor = d.cor() != null && CORES.contains(d.cor()) ? d.cor() : "orange";
        if (id == null) c.persist();
        return c;
    }

    public void excluirCategoria(UUID storeId, UUID id) {
        Categoria c = categoria(storeId, id);
        Conteudo.update("categoria = null where categoria = ?1", c);
        c.delete();
    }

    Categoria categoria(UUID storeId, UUID id) {
        Categoria c = Categoria.findById(id);
        if (c == null || !c.storeId.equals(storeId)) throw Erro.naoEncontrado("Categoria não encontrada");
        return c;
    }

    // ---------- Conteúdos ----------

    public ListaConteudos listar(UUID storeId) {
        Config config = membros.config(storeId);
        Map<UUID, List<ConteudoGrupo>> publicacoes = ConteudoGrupo.<ConteudoGrupo>list("storeId", storeId).stream()
                .collect(Collectors.groupingBy(p -> p.conteudo.id));
        Map<UUID, List<ConteudoView>> views = ConteudoView.<ConteudoView>list("storeId", storeId).stream()
                .collect(Collectors.groupingBy(v -> v.conteudo.id));
        List<ConteudoJson> lista = Conteudo.<Conteudo>list(
                        "storeId = ?1 order by coalesce(publicadoEm, agendadoPara, createdAt) desc", storeId)
                .stream()
                .map(c -> json(c, publicacoes.getOrDefault(c.id, List.of()), views.getOrDefault(c.id, List.of())))
                .toList();
        return new ListaConteudos(lista, categorias(storeId), grupos(storeId, config));
    }

    List<GrupoOpcao> grupos(UUID storeId, Config config) {
        Map<UUID, List<Opcao>> topicos = Topico.<Topico>list("storeId = ?1 order by nome", storeId).stream()
                .collect(Collectors.groupingBy(t -> t.grupo.id,
                        Collectors.mapping(t -> new Opcao(t.id, t.nome), Collectors.toList())));
        return Grupo.<Grupo>list("storeId = ?1 and ativo = true order by nome", storeId).stream()
                .map(g -> new GrupoOpcao(g.id, g.nome, g.plataforma, g.automatico(config),
                        g.automatico(config) ? topicos.getOrDefault(g.id, List.of()) : List.of()))
                .toList();
    }

    ConteudoJson json(Conteudo c) {
        return json(c, ConteudoGrupo.list("conteudo", c), ConteudoView.list("conteudo", c));
    }

    private static ConteudoJson json(Conteudo c, List<ConteudoGrupo> pubs, List<ConteudoView> views) {
        return new ConteudoJson(
                c.id,
                c.titulo,
                c.texto,
                c.categoria != null ? c.categoria.id : null,
                c.categoria != null ? c.categoria.nome : null,
                c.categoria != null ? c.categoria.cor : null,
                c.midiaUrl,
                c.midiaTipo,
                c.link,
                c.botaoTexto,
                c.fixar,
                c.status,
                c.agendadoPara,
                c.publicadoEm,
                c.naAreaMembro,
                c.createdAt,
                pubs.stream()
                        .map(p -> new Publicacao(p.id, p.grupo.id, p.grupo.nome, p.grupo.plataforma, p.status, p.erro,
                                p.enviadoEm, p.topico != null ? p.topico.id : null, p.topico != null ? p.topico.nome : null,
                                p.telegramMessageId != null && ConteudoGrupo.ENVIADO.equals(p.status), p.fixado))
                        .toList(),
                views.size(),
                (int) views.stream().map(v -> v.cliente.id).distinct().count());
    }

    public Conteudo conteudo(UUID storeId, UUID id) {
        Conteudo c = Conteudo.findById(id);
        if (c == null || !c.storeId.equals(storeId)) throw Erro.naoEncontrado("Conteúdo não encontrado");
        return c;
    }

    public Conteudo salvar(UUID storeId, UUID id, DadosConteudo d) {
        if (d == null) throw Erro.invalido("Preencha o conteúdo");
        Config config = membros.config(storeId);
        Conteudo c = id == null ? new Conteudo() : conteudo(storeId, id);
        boolean jaPublicado = Conteudo.PUBLICADO.equals(c.status);

        String titulo = Membros.limpo(d.titulo());
        if (titulo == null) throw Erro.invalido("Informe o título");
        String texto = d.texto() != null ? d.texto().trim() : "";
        String link = Membros.limpo(d.link());
        if (link != null && !link.matches("https?://\\S+")) throw Erro.invalido("O link precisa começar com http:// ou https://");
        String botao = link != null ? Membros.limpo(d.botaoTexto()) : null;
        if (botao != null && botao.length() > 40) throw Erro.invalido("Texto do botão com até 40 letras");
        String midia = Membros.limpo(d.midiaUrl());
        if (midia != null && !"imagem".equals(d.midiaTipo()) && !"video".equals(d.midiaTipo())) {
            throw Erro.invalido("Tipo de mídia inválido");
        }

        c.storeId = storeId;
        c.titulo = titulo;
        c.texto = texto;
        c.link = link;
        c.botaoTexto = botao;
        c.fixar = d.fixar();
        c.midiaUrl = midia;
        c.midiaTipo = midia != null ? d.midiaTipo() : null;
        c.categoria = d.categoriaId() != null ? categoria(storeId, d.categoriaId()) : null;
        c.naAreaMembro = d.naAreaMembro();

        if (jaPublicado) { // já publicado: só o texto/categoria mudam
            if (d.atualizarNosGrupos()) atualizarNosGrupos(config, c);
            return c;
        }

        List<UUID> grupoIds = d.grupoIds() != null ? d.grupoIds() : List.of();
        if (grupoIds.isEmpty() && !c.naAreaMembro) {
            throw Erro.invalido("Escolha pelo menos um grupo ou deixe o conteúdo na área do membro");
        }
        String quando = d.quando() != null ? d.quando() : "agora";
        switch (quando) {
            case "agendar" -> {
                if (d.agendadoPara() == null) throw Erro.invalido("Escolha o dia e a hora da publicação");
                OffsetDateTime em = d.agendadoPara().atZone(FUSO).toOffsetDateTime();
                if (em.isBefore(OffsetDateTime.now().minusMinutes(1))) throw Erro.invalido("A data da publicação já passou");
                c.status = Conteudo.AGENDADO;
                c.agendadoPara = em;
            }
            case "rascunho" -> {
                c.status = Conteudo.RASCUNHO;
                c.agendadoPara = null;
            }
            default -> c.status = Conteudo.RASCUNHO; // publica logo abaixo
        }
        if (id == null) c.persistAndFlush();

        // Troca os grupos de destino.
        ConteudoGrupo.delete("conteudo", c);
        for (UUID gid : new LinkedHashSet<>(grupoIds)) {
            Grupo g = Grupo.findById(gid);
            if (g == null || !g.storeId.equals(storeId)) throw Erro.invalido("Grupo não encontrado");
            ConteudoGrupo p = new ConteudoGrupo();
            p.storeId = storeId;
            p.conteudo = c;
            p.grupo = g;
            p.status = ConteudoGrupo.PENDENTE;
            UUID topicoId = d.topicos() != null ? d.topicos().get(gid) : null;
            if (topicoId != null) {
                Topico t = Topico.findById(topicoId);
                if (t == null || !t.grupo.id.equals(g.id)) throw Erro.invalido("Tópico não encontrado");
                p.topico = t;
            }
            p.persist();
        }
        ConteudoGrupo.flush();
        if ("agora".equals(quando)) publicar(config, c);
        return c;
    }

    // Publica em todos os grupos de destino ainda pendentes.
    public void publicar(Config config, Conteudo c) {
        for (ConteudoGrupo p : ConteudoGrupo.<ConteudoGrupo>list("conteudo = ?1 and status = ?2", c, ConteudoGrupo.PENDENTE)) {
            enviarAoGrupo(config, p);
        }
        c.status = Conteudo.PUBLICADO;
        c.publicadoEm = OffsetDateTime.now();
        c.agendadoPara = null;
    }

    private void enviarAoGrupo(Config config, ConteudoGrupo p) {
        if (!p.grupo.automatico(config)) {
            p.status = ConteudoGrupo.MANUAL;
            return;
        }
        Conteudo c = p.conteudo;
        String token = config.telegramBotToken;
        String chat = p.grupo.telegramChatId;
        Telegram.Opcoes opcoes = new Telegram.Opcoes(p.topico != null ? p.topico.threadId : null,
                p.grupo.protegerConteudo, botoes(c));
        try {
            p.telegramMessageId = c.midiaUrl != null
                    ? telegram.enviarMidia(token, chat, c.midiaTipo, c.midiaUrl, post(c), opcoes)
                    : telegram.enviarTexto(token, chat, post(c), opcoes);
            p.status = ConteudoGrupo.ENVIADO;
            p.enviadoEm = OffsetDateTime.now();
            p.erro = null;
        } catch (Telegram.ErroTelegram e) {
            p.status = ConteudoGrupo.FALHOU;
            p.erro = e.getMessage();
            return;
        }
        if (c.fixar) {
            try {
                telegram.fixar(token, chat, p.telegramMessageId);
                p.fixado = true;
            } catch (Telegram.ErroTelegram e) {
                p.erro = "Publicado, mas não deu para fixar: " + e.getMessage();
            }
        }
    }

    // Texto do post no Telegram. Com botão, o link vai no botão (e não no texto).
    private static String post(Conteudo c) {
        return "<b>" + Telegram.html(c.titulo) + "</b>"
                + (c.texto.isBlank() ? "" : "\n\n" + Telegram.html(c.texto))
                + (c.link != null && c.botaoTexto == null ? "\n\n" + Telegram.html(c.link) : "");
    }

    private static List<Telegram.Botao> botoes(Conteudo c) {
        return c.link != null && c.botaoTexto != null ? List.of(new Telegram.Botao(c.botaoTexto, c.link)) : List.of();
    }

    // Conteúdo já publicado foi editado: troca o texto dos posts no Telegram.
    // A foto/vídeo não muda (o Telegram só deixa trocar o texto).
    private void atualizarNosGrupos(Config config, Conteudo c) {
        for (ConteudoGrupo p : ConteudoGrupo.<ConteudoGrupo>list("conteudo = ?1 and status = ?2", c, ConteudoGrupo.ENVIADO)) {
            if (p.telegramMessageId == null || !p.grupo.automatico(config)) continue;
            try {
                if (c.midiaUrl != null) {
                    telegram.editarLegenda(config.telegramBotToken, p.grupo.telegramChatId, p.telegramMessageId, post(c), botoes(c));
                } else {
                    telegram.editarTexto(config.telegramBotToken, p.grupo.telegramChatId, p.telegramMessageId, post(c), botoes(c));
                }
                p.erro = null;
            } catch (Telegram.ErroTelegram e) {
                p.erro = "Não deu para atualizar o post: " + e.getMessage();
            }
        }
    }

    // Fixa ou desafixa o post no topo do grupo.
    public void fixarPublicacao(UUID storeId, UUID publicacaoId, boolean fixar) {
        ConteudoGrupo p = publicacaoNoTelegram(storeId, publicacaoId);
        Config config = membros.config(storeId);
        try {
            if (fixar) telegram.fixar(config.telegramBotToken, p.grupo.telegramChatId, p.telegramMessageId);
            else telegram.desafixar(config.telegramBotToken, p.grupo.telegramChatId, p.telegramMessageId);
        } catch (Telegram.ErroTelegram e) {
            throw Erro.invalido(e.getMessage());
        }
        p.fixado = fixar;
        p.erro = null;
    }

    // Apaga o post do grupo (o conteúdo continua na área do membro).
    public void apagarPublicacao(UUID storeId, UUID publicacaoId) {
        ConteudoGrupo p = publicacaoNoTelegram(storeId, publicacaoId);
        Config config = membros.config(storeId);
        try {
            telegram.apagarMensagem(config.telegramBotToken, p.grupo.telegramChatId, p.telegramMessageId);
        } catch (Telegram.ErroTelegram e) {
            // já tinha sido apagado no próprio Telegram: só marca
            if (!e.getMessage().startsWith("O post não existe mais")) throw Erro.invalido(e.getMessage());
        }
        p.status = ConteudoGrupo.APAGADO;
        p.fixado = false;
        p.erro = null;
    }

    private ConteudoGrupo publicacaoNoTelegram(UUID storeId, UUID publicacaoId) {
        ConteudoGrupo p = publicacao(storeId, publicacaoId);
        if (p.telegramMessageId == null || !ConteudoGrupo.ENVIADO.equals(p.status)) {
            throw Erro.conflito("Este post não foi feito pelo robô (ou já foi apagado)");
        }
        if (!p.grupo.automatico(membros.config(storeId))) throw Erro.conflito("O robô não cuida mais deste grupo");
        return p;
    }

    public void publicarAgora(UUID storeId, UUID id) {
        Conteudo c = conteudo(storeId, id);
        if (Conteudo.PUBLICADO.equals(c.status)) throw Erro.conflito("Este conteúdo já foi publicado");
        publicar(membros.config(storeId), c);
    }

    // Publicação manual (WhatsApp) feita pelo dono.
    public void marcarPublicado(UUID storeId, UUID publicacaoId) {
        ConteudoGrupo p = publicacao(storeId, publicacaoId);
        p.status = ConteudoGrupo.ENVIADO;
        p.enviadoEm = OffsetDateTime.now();
        p.erro = null;
    }

    public void tentarDeNovo(UUID storeId, UUID publicacaoId) {
        ConteudoGrupo p = publicacao(storeId, publicacaoId);
        enviarAoGrupo(membros.config(storeId), p);
        if (ConteudoGrupo.FALHOU.equals(p.status)) throw Erro.invalido(p.erro);
    }

    private static ConteudoGrupo publicacao(UUID storeId, UUID id) {
        ConteudoGrupo p = ConteudoGrupo.findById(id);
        if (p == null || !p.storeId.equals(storeId)) throw Erro.naoEncontrado("Publicação não encontrada");
        return p;
    }

    public void excluir(UUID storeId, UUID id) {
        conteudo(storeId, id).delete();
    }

    // Conteúdos agendados cuja hora chegou (chamado a cada minuto).
    public int publicarAgendados(Config config) {
        List<Conteudo> prontos = Conteudo.list("storeId = ?1 and status = ?2 and agendadoPara <= ?3",
                config.storeId, Conteudo.AGENDADO, OffsetDateTime.now());
        for (Conteudo c : prontos) publicar(config, c);
        return prontos.size();
    }

    // ---------- Lives e eventos ----------

    public ListaEventos eventos(UUID storeId) {
        Config config = membros.config(storeId);
        List<EventoJson> lista = Evento.<Evento>list("storeId = ?1 order by comecaEm desc", storeId).stream()
                .map(Conteudos::json)
                .toList();
        return new ListaEventos(lista, grupos(storeId, config));
    }

    static EventoJson json(Evento e) {
        return new EventoJson(e.id, e.titulo, e.descricao, e.foto, e.link, e.comecaEm, e.duracaoMinutos,
                e.avisoMinutos, e.avisadoEm, e.status(), e.grupo != null ? e.grupo.id : null,
                e.grupo != null ? e.grupo.nome : null);
    }

    public Evento evento(UUID storeId, UUID id) {
        Evento e = Evento.findById(id);
        if (e == null || !e.storeId.equals(storeId)) throw Erro.naoEncontrado("Live não encontrada");
        return e;
    }

    public Evento salvarEvento(UUID storeId, UUID id, DadosEvento d) {
        if (d == null) throw Erro.invalido("Preencha a live");
        Evento e = id == null ? new Evento() : evento(storeId, id);
        String titulo = Membros.limpo(d.titulo());
        if (titulo == null) throw Erro.invalido("Informe o título");
        if (d.comecaEm() == null) throw Erro.invalido("Informe o dia e a hora");
        OffsetDateTime comeca = d.comecaEm().atZone(FUSO).toOffsetDateTime();
        String link = Membros.limpo(d.link());
        if (link != null && !link.matches("https?://\\S+")) throw Erro.invalido("O link precisa começar com http:// ou https://");
        int duracao = d.duracaoMinutos() != null ? d.duracaoMinutos() : 60;
        int aviso = d.avisoMinutos() != null ? d.avisoMinutos() : 60;
        if (duracao < 5 || duracao > 24 * 60) throw Erro.invalido("Duração entre 5 minutos e 24 horas");
        if (aviso < 0 || aviso > 7 * 24 * 60) throw Erro.invalido("Aviso até 7 dias antes");

        if (e.comecaEm != null && !e.comecaEm.equals(comeca)) e.avisadoEm = null; // mudou a hora: avisa de novo
        e.storeId = storeId;
        e.titulo = titulo;
        e.descricao = d.descricao() != null ? d.descricao().trim() : "";
        e.foto = Membros.limpo(d.foto());
        e.link = link;
        e.comecaEm = comeca;
        e.duracaoMinutos = duracao;
        e.avisoMinutos = aviso;
        e.grupo = d.grupoId() != null ? Grupo.findById(d.grupoId()) : null;
        if (d.grupoId() != null && (e.grupo == null || !e.grupo.storeId.equals(storeId))) {
            throw Erro.invalido("Grupo não encontrado");
        }
        if (id == null) e.persist();
        return e;
    }

    public void cancelarEvento(UUID storeId, UUID id) {
        evento(storeId, id).cancelado = true;
    }

    public void excluirEvento(UUID storeId, UUID id) {
        evento(storeId, id).delete();
    }

    // Avisa as lives que estão para começar: posta nos grupos com o robô e
    // (se a automação "live" estiver ligada) manda no privado de quem tem acesso.
    public int avisarLives(Config config, Automacao automacao) {
        OffsetDateTime agora = OffsetDateTime.now();
        List<Evento> proximas = Evento.list("storeId = ?1 and cancelado = false and avisadoEm is null and comecaEm > ?2",
                config.storeId, agora);
        int avisadas = 0;
        Membros.Base base = null;
        for (Evento ev : proximas) {
            if (agora.isBefore(ev.comecaEm.minusMinutes(ev.avisoMinutos))) continue;
            if (base == null) base = membros.base(config.storeId);
            avisar(config, base, automacao, ev);
            avisadas++;
        }
        return avisadas;
    }

    public void avisarAgora(UUID storeId, UUID id, Automacao automacao) {
        Evento ev = evento(storeId, id);
        if (!"agendado".equals(ev.status()) && !"ao_vivo".equals(ev.status())) {
            throw Erro.conflito("Esta live já terminou ou foi cancelada");
        }
        Config config = membros.config(storeId);
        avisar(config, membros.base(storeId), automacao, ev);
    }

    private void avisar(Config config, Membros.Base base, Automacao automacao, Evento ev) {
        Map<String, String> extra = new HashMap<>();
        extra.put("live", ev.titulo);
        extra.put("horario", Mensageiro.dataHora(ev.comecaEm));
        extra.put("link_live", ev.link != null ? ev.link : "(o link será enviado no grupo)");

        // Post nos grupos (Telegram com o robô).
        String post = "🔴 <b>" + Telegram.html(ev.titulo) + "</b>\n" + Telegram.html(extra.get("horario"))
                + (ev.descricao.isBlank() ? "" : "\n\n" + Telegram.html(ev.descricao))
                + (ev.link != null ? "\n\n" + Telegram.html(ev.link) : "");
        List<Telegram.Botao> botoes = ev.link != null ? List.of(new Telegram.Botao("▶️ Entrar na live", ev.link)) : List.of();
        for (Grupo g : base.grupos) {
            if (!g.ativo || !g.automatico(config)) continue;
            if (ev.grupo != null && !ev.grupo.id.equals(g.id)) continue;
            try {
                telegram.enviarTexto(config.telegramBotToken, g.telegramChatId, post,
                        new Telegram.Opcoes(null, g.protegerConteudo, botoes));
            } catch (Telegram.ErroTelegram ignorado) {
                // o aviso no privado ainda vai
            }
        }

        // Mensagem no privado.
        if (automacao != null && automacao.ativa) {
            for (Membros.Estado e : Membros.comAcesso(base, ev.grupo != null ? ev.grupo.id : null)) {
                Map<String, String> v = mensageiro.variaveis(config, base, e);
                v.putAll(extra);
                mensageiro.criar(config, e.cliente(), e.membro(), "live", Mensageiro.preencher(automacao.texto, v),
                        "live:" + ev.id + ":" + ev.comecaEm.toEpochSecond() + ":" + e.cliente().id);
            }
        }
        ev.avisadoEm = OffsetDateTime.now();
    }

    // ---------- Anúncios ----------

    public ListaAnuncios anuncios(UUID storeId) {
        Map<UUID, String> planos = new HashMap<>();
        Plano.<Plano>list("storeId", storeId)
                .forEach(p -> planos.put(p.id, p.nome));
        Map<UUID, String> grupos = new HashMap<>();
        Grupo.<Grupo>list("storeId", storeId).forEach(g -> grupos.put(g.id, g.nome));

        Map<String, long[]> porAnuncio = new HashMap<>(); // chave "anuncio:<id>" -> [enviadas, pendentes]
        for (Mensagem m : Mensagem.<Mensagem>list("storeId = ?1 and tipo = 'anuncio'", storeId)) {
            if (m.chave == null) continue;
            String id = m.chave.split(":")[1];
            long[] n = porAnuncio.computeIfAbsent(id, k -> new long[2]);
            if (Mensagem.ENVIADA.equals(m.status)) n[0]++;
            else if (Mensagem.PENDENTE.equals(m.status)) n[1]++;
        }

        List<AnuncioJson> lista = Anuncio.<Anuncio>list("storeId = ?1 order by enviadoEm desc", storeId).stream()
                .map(a -> {
                    long[] n = porAnuncio.getOrDefault(a.id.toString(), new long[2]);
                    String nome = a.publicoRef == null ? null
                            : "plano".equals(a.publico) ? planos.get(a.publicoRef) : grupos.get(a.publicoRef);
                    return new AnuncioJson(a.id, a.titulo, a.texto, a.tipo, a.publico, a.publicoRef, nome,
                            a.destinatarios, a.postadoNosGrupos, a.enviadoEm, (int) n[0], (int) n[1]);
                })
                .toList();
        List<Opcao> opcoesPlanos = Plano.<Plano>list("storeId = ?1 order by preco", storeId).stream()
                .map(p -> new Opcao(p.id, p.nome))
                .toList();
        List<Opcao> opcoesGrupos = Grupo.<Grupo>list("storeId = ?1 and ativo = true order by nome", storeId).stream()
                .map(g -> new Opcao(g.id, g.nome))
                .toList();
        return new ListaAnuncios(lista, opcoesPlanos, opcoesGrupos);
    }

    public List<Membros.Estado> publico(Membros.Base base, String publico, UUID ref) {
        if (publico == null || !PUBLICOS.contains(publico)) throw Erro.invalido("Escolha o público");
        if (("plano".equals(publico) || "grupo".equals(publico)) && ref == null) {
            throw Erro.invalido("plano".equals(publico) ? "Escolha o plano" : "Escolha o grupo");
        }
        OffsetDateTime mesPassado = OffsetDateTime.now().minusDays(30);
        List<Membros.Estado> lista = new ArrayList<>();
        for (Membros.Estado e : base.estados.values()) {
            boolean entra = switch (publico) {
                case "todos" -> true;
                case "em_dia" -> e.temAcesso();
                case "atrasados" -> "atrasado".equals(e.situacao())
                        || ("bloqueado".equals(e.situacao()) && "atraso".equals(e.motivoBloqueio()));
                case "sem_acesso" -> !e.temAcesso();
                case "plano" -> e.plano() != null && e.plano().id.equals(ref);
                case "grupo" -> e.gruposComDireito().contains(ref);
                case "novos" -> e.temAcesso() && e.assinatura() != null && e.assinatura().createdAt.isAfter(mesPassado);
                default -> false;
            };
            if (entra) lista.add(e);
        }
        return lista;
    }

    public Publico contarPublico(UUID storeId, String publico, UUID ref) {
        Membros.Base base = membros.base(storeId);
        int telegram = 0;
        int whatsapp = 0;
        int sem = 0;
        List<Membros.Estado> lista = publico(base, publico, ref);
        for (Membros.Estado e : lista) {
            String canal = Mensageiro.canal(base.config, e.cliente(), e.membro());
            if (canal == null) sem++;
            else if (canal.equals("telegram")) telegram++;
            else whatsapp++;
        }
        return new Publico(lista.size(), sem, telegram, whatsapp);
    }

    public Anuncio enviarAnuncio(UUID storeId, DadosAnuncio d) {
        if (d == null) throw Erro.invalido("Preencha o anúncio");
        String titulo = Membros.limpo(d.titulo());
        if (titulo == null) throw Erro.invalido("Informe o título");
        String texto = d.texto() != null ? d.texto().trim() : "";
        if (texto.isEmpty()) throw Erro.invalido("Escreva a mensagem");
        String tipo = d.tipo() != null && TIPOS_ANUNCIO.contains(d.tipo()) ? d.tipo() : "conteudo";

        Membros.Base base = membros.base(storeId);
        List<Membros.Estado> destino = publico(base, d.publico(), d.publicoRef());

        Anuncio a = new Anuncio();
        a.storeId = storeId;
        a.titulo = titulo;
        a.texto = texto;
        a.tipo = tipo;
        a.publico = d.publico();
        a.publicoRef = ("plano".equals(d.publico()) || "grupo".equals(d.publico())) ? d.publicoRef() : null;
        a.postadoNosGrupos = d.postarNosGrupos();
        a.enviadoEm = OffsetDateTime.now();
        a.persist();

        int enviados = 0;
        for (Membros.Estado e : destino) {
            String corpo = titulo + "\n\n" + Mensageiro.preencher(texto, mensageiro.variaveis(base.config, base, e));
            if (mensageiro.criar(base.config, e.cliente(), e.membro(), "anuncio", corpo,
                    "anuncio:" + a.id + ":" + e.cliente().id) != null) {
                enviados++;
            }
        }
        a.destinatarios = enviados;

        if (d.postarNosGrupos()) {
            List<UUID> grupos = switch (a.publico) {
                case "grupo" -> List.of(a.publicoRef);
                case "plano" -> base.gruposPorPlano.getOrDefault(a.publicoRef, List.of()).stream().map(g -> g.id).toList();
                default -> base.grupos.stream().filter(g -> g.ativo).map(g -> g.id).toList();
            };
            if (!grupos.isEmpty()) {
                salvar(storeId, null, new DadosConteudo(titulo, texto, null, null, null, null, null, false, grupos, null,
                        false, "agora", null, false));
            }
        }
        mensageiro.enviarPendentes(base.config);
        return a;
    }
}
