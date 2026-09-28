package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.Erro;
import br.com.clienteplus.modulos.grupovip.AcessosContrato.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

// Controle de acesso: compara quem PAGOU (situação do membro) com quem ESTÁ
// em cada grupo e resolve a diferença.
//
//   tem direito e não está          -> "adicionar" (mandar link de entrada)
//   tem direito e já recebeu o link -> "aguardando" (ainda não entrou)
//   não tem direito e está          -> "remover"
//
// Grupos do Telegram com o robô: tudo acontece sozinho (sincronizar). Demais
// grupos (WhatsApp, ou Telegram sem robô): o dono faz e marca na tela.
@ApplicationScoped
public class ControleAcesso {

    @Inject
    Membros membros;

    @Inject
    Telegram telegram;

    @Inject
    Mensageiro mensageiro;

    @Inject
    EnderecoPublico endereco;

    record Chave(UUID grupo, UUID cliente) {}

    public static Map<Chave, Acesso> acessos(UUID storeId) {
        Map<Chave, Acesso> mapa = new HashMap<>();
        for (Acesso a : Acesso.<Acesso>list("storeId", storeId)) mapa.put(new Chave(a.grupo.id, a.cliente.id), a);
        return mapa;
    }

    public List<Pendencia> pendencias(Membros.Base base) {
        Map<Chave, Acesso> acessos = acessos(base.storeId);
        List<Pendencia> lista = new ArrayList<>();
        for (Membros.Estado e : base.estados.values()) {
            for (Grupo g : base.grupos) {
                if (!g.ativo) continue;
                Acesso a = acessos.get(new Chave(g.id, e.cliente().id));
                String status = a != null ? a.status : null;
                boolean direito = e.gruposComDireito().contains(g.id);
                String acao = null;
                if (direito && (status == null || Acesso.REMOVIDO.equals(status))) acao = "adicionar";
                else if (direito && Acesso.CONVIDADO.equals(status)) acao = "aguardando";
                else if (!direito && (Acesso.NO_GRUPO.equals(status) || Acesso.CONVIDADO.equals(status))) acao = "remover";
                if (acao == null) continue;

                Membro m = e.membro();
                boolean automatico = g.automatico(base.config)
                        && (!"remover".equals(acao) || Acesso.CONVIDADO.equals(status) || (m != null && m.telegramId != null));
                OffsetDateTime desde = a != null ? a.atualizadoEm : null;
                lista.add(new Pendencia(
                        e.cliente().id,
                        e.cliente().nome,
                        e.cliente().telefone,
                        m != null ? m.telegramUsuario : null,
                        m != null && m.telegramId != null,
                        g.id,
                        g.nome,
                        g.plataforma,
                        automatico,
                        acao,
                        e.situacao(),
                        "remover".equals(acao) ? motivoRemocao(base, e, g) : null,
                        a != null ? a.conviteLink : null,
                        desde));
            }
        }
        lista.sort(Comparator.comparing(Pendencia::nome));
        return lista;
    }

    static String motivoRemocao(Membros.Base base, Membros.Estado e, Grupo g) {
        return switch (e.situacao()) {
            case "bloqueado" -> "manual".equals(e.motivoBloqueio())
                    ? "Bloqueado manualmente"
                    : "Pagamento atrasado há " + e.diasAtraso() + " dias";
            case "sem_plano" -> e.pagoAte() != null ? "Assinatura encerrada" : "Sem assinatura";
            case "aguardando_pagamento" -> "Ainda não pagou";
            default -> "O plano " + (e.plano() != null ? e.plano().nome : "") + " não inclui este grupo";
        };
    }

    // ---------- Automático (robô do Telegram) ----------

    // Resolve sozinho tudo o que o robô consegue. Chamado pelas automações (a
    // cada minuto), depois de cada pagamento e pelo botão "Sincronizar agora".
    public Sincronizacao sincronizar(UUID storeId) {
        Membros.Base base = membros.base(storeId);
        int convidados = 0;
        int removidos = 0;
        List<String> erros = new ArrayList<>();
        if (!base.config.robo()) return new Sincronizacao(0, 0, erros);

        Map<Chave, Acesso> acessos = acessos(storeId);
        for (Pendencia p : pendencias(base)) {
            if (!p.automatico() || "aguardando".equals(p.acao())) continue;
            Grupo g = base.grupoPorId.get(p.grupoId());
            Membros.Estado e = base.estado(p.clienteId());
            try {
                if ("adicionar".equals(p.acao())) {
                    convidarNoTelegram(base.config, g, e.cliente(), e.membro(), true, true);
                    convidados++;
                } else {
                    Acesso a = acessos.get(new Chave(g.id, p.clienteId()));
                    removerNoTelegram(base.config, g, a, e.membro(), p.motivo());
                    removidos++;
                }
            } catch (Telegram.ErroTelegram ex) {
                erros.add(p.nome() + " (" + g.nome + "): " + ex.getMessage());
            }
        }
        return new Sincronizacao(convidados, removidos, erros);
    }

    // Cria o link de entrada exclusivo e (se avisar) manda para a pessoa.
    String convidarNoTelegram(Config config, Grupo g, Cliente c, Membro m, boolean automatico, boolean avisar) {
        String link = telegram.criarConvite(config.telegramBotToken, g.telegramChatId,
                (m != null ? m.codigo : "") + " " + Membros.primeiroNome(c.nome));
        Acesso a = acesso(g, c);
        if (a.conviteLink != null && Acesso.CONVIDADO.equals(a.status)) {
            try {
                telegram.revogarConvite(config.telegramBotToken, g.telegramChatId, a.conviteLink);
            } catch (Telegram.ErroTelegram ignorado) {
                // link antigo já expirado: tudo bem
            }
        }
        a.status = Acesso.CONVIDADO;
        a.conviteLink = link;
        a.conviteCriadoEm = OffsetDateTime.now();
        a.atualizadoEm = OffsetDateTime.now();
        registrar(g, c, "convite", automatico, "Link de entrada criado pelo robô");

        if (avisar) {
            String texto = "Seu link para entrar no grupo " + g.nome + ":\n" + link
                    + "\n\nToque no link e peça para entrar. A entrada é aprovada automaticamente.";
            mensageiro.criar(config, c, m, "convite", texto, "convite:" + link);
        }
        return link;
    }

    private void removerNoTelegram(Config config, Grupo g, Acesso a, Membro m, String motivo) {
        if (Acesso.CONVIDADO.equals(a.status)) {
            if (a.conviteLink != null) {
                try {
                    telegram.revogarConvite(config.telegramBotToken, g.telegramChatId, a.conviteLink);
                } catch (Telegram.ErroTelegram ignorado) {
                    // já expirado
                }
            }
            marcar(a, Acesso.REMOVIDO);
            registrar(g, a.cliente, "removido", true, "Link de entrada cancelado: " + motivo);
            return;
        }
        if (m == null || m.telegramId == null) throw new Telegram.ErroTelegram("Conta do Telegram desconhecida");
        telegram.removerDoGrupo(config.telegramBotToken, g.telegramChatId, m.telegramId);
        Permissoes.saiu(g, a.cliente);
        marcar(a, Acesso.REMOVIDO);
        registrar(g, a.cliente, "removido", true, motivo);
    }

    // ---------- Ações feitas pelo dono na tela ----------

    public Convite convidar(UUID storeId, UUID grupoId, UUID clienteId) {
        Config config = membros.config(storeId);
        Grupo g = grupo(storeId, grupoId);
        Cliente c = membros.cliente(storeId, clienteId);
        Membro m = membros.membro(c);
        if (g.automatico(config)) {
            String link = convidarNoTelegram(config, g, c, m, false, true);
            return new Convite(link, null);
        }
        Acesso a = acesso(g, c);
        marcar(a, Acesso.CONVIDADO);
        a.conviteLink = g.linkConvite;
        a.conviteCriadoEm = OffsetDateTime.now();
        registrar(g, c, "convite", false, g.linkConvite != null ? "Link do grupo enviado" : "Convite registrado");
        String texto = "Olá, " + Membros.primeiroNome(c.nome) + "! Seu acesso ao grupo " + g.nome + " foi liberado."
                + (g.linkConvite != null ? "\nEntre por este link: " + g.linkConvite : "\nVocê será adicionado(a) em instantes.");
        return new Convite(g.linkConvite, Mensageiro.linkWhatsapp(c.telefone, texto));
    }

    public void marcarEntrou(UUID storeId, UUID grupoId, UUID clienteId) {
        Grupo g = grupo(storeId, grupoId);
        Cliente c = membros.cliente(storeId, clienteId);
        Acesso a = acesso(g, c);
        marcar(a, Acesso.NO_GRUPO);
        a.entrouEm = OffsetDateTime.now();
        registrar(g, c, "entrou", false, "Marcado pelo administrador");
    }

    public void marcarRemovido(UUID storeId, UUID grupoId, UUID clienteId) {
        Grupo g = grupo(storeId, grupoId);
        Cliente c = membros.cliente(storeId, clienteId);
        Acesso a = Acesso.<Acesso>find("grupo = ?1 and cliente = ?2", g, c).firstResult();
        if (a == null || Acesso.REMOVIDO.equals(a.status)) throw Erro.conflito("Esta pessoa não está no grupo");
        marcar(a, Acesso.REMOVIDO);
        registrar(g, c, "removido", false, "Marcado pelo administrador");
    }

    // Remove agora pelo robô (só Telegram automático).
    public void removerAgora(UUID storeId, UUID grupoId, UUID clienteId) {
        Config config = membros.config(storeId);
        Grupo g = grupo(storeId, grupoId);
        if (!g.automatico(config)) throw Erro.invalido("Este grupo não é controlado pelo robô");
        Cliente c = membros.cliente(storeId, clienteId);
        Acesso a = Acesso.<Acesso>find("grupo = ?1 and cliente = ?2", g, c).firstResult();
        if (a == null || Acesso.REMOVIDO.equals(a.status)) throw Erro.conflito("Esta pessoa não está no grupo");
        try {
            removerNoTelegram(config, g, a, membros.membro(c), "Removido pelo administrador");
        } catch (Telegram.ErroTelegram e) {
            throw Erro.invalido(e.getMessage());
        }
    }

    // ---------- Apoio ----------

    Grupo grupo(UUID storeId, UUID id) {
        Grupo g = Grupo.findById(id);
        if (g == null || !g.storeId.equals(storeId)) throw Erro.naoEncontrado("Grupo não encontrado");
        return g;
    }

    static Acesso acesso(Grupo g, Cliente c) {
        Acesso a = Acesso.<Acesso>find("grupo = ?1 and cliente = ?2", g, c).firstResult();
        if (a == null) {
            a = new Acesso();
            a.storeId = g.storeId;
            a.grupo = g;
            a.cliente = c;
            a.status = Acesso.REMOVIDO;
            a.atualizadoEm = OffsetDateTime.now();
            a.persist();
        }
        return a;
    }

    static void marcar(Acesso a, String status) {
        a.status = status;
        a.atualizadoEm = OffsetDateTime.now();
        if (Acesso.REMOVIDO.equals(status)) a.removidoEm = OffsetDateTime.now();
    }

    static void registrar(Grupo g, Cliente c, String acao, boolean automatico, String detalhe) {
        AcessoEvento ev = new AcessoEvento();
        ev.storeId = g.storeId;
        ev.grupo = g;
        ev.cliente = c;
        ev.acao = acao;
        ev.automatico = automatico;
        ev.detalhe = detalhe != null ? detalhe : "";
        ev.momento = OffsetDateTime.now();
        ev.persist();
    }
}
