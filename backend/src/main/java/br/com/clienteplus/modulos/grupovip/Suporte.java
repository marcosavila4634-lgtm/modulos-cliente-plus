package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.Erro;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

// Suporte: o membro abre uma conversa pela área do membro (ou escrevendo para o
// robô do Telegram) e a equipe responde pelo painel. Cada resposta da equipe
// também avisa o membro (caixa de saída); no Telegram ele responde ali mesmo.
@ApplicationScoped
public class Suporte {

    @Inject
    Membros membros;

    @Inject
    Mensageiro mensageiro;

    @Inject
    EnderecoPublico endereco;

    public record MensagemChamado(UUID id, String autor, String texto, OffsetDateTime createdAt) {}

    // status: "aberto" (esperando a equipe) | "respondido" (esperando o membro) | "resolvido"
    // origem: "area" | "telegram"
    public record ChamadoJson(
            UUID id,
            UUID clienteId,
            String nome,
            String telefone,
            String situacao,
            String assunto,
            String status,
            String origem,
            OffsetDateTime createdAt,
            OffsetDateTime atualizadoEm,
            List<MensagemChamado> mensagens) {}

    public List<ChamadoJson> listar(UUID storeId, Cliente somente) {
        List<Chamado> chamados = somente == null
                ? Chamado.list("storeId = ?1 order by atualizadoEm desc", storeId)
                : Chamado.list("cliente = ?1 order by atualizadoEm desc", somente);
        Map<UUID, List<ChamadoMensagem>> msgs = ChamadoMensagem.<ChamadoMensagem>list(
                        "storeId = ?1 order by createdAt", storeId).stream()
                .collect(Collectors.groupingBy(m -> m.chamado.id));
        Membros.Base base = somente == null ? membros.base(storeId) : null;
        return chamados.stream()
                .map(c -> new ChamadoJson(c.id, c.cliente.id, c.cliente.nome, c.cliente.telefone,
                        base != null ? base.estado(c.cliente.id).situacao() : null, c.assunto, c.status, c.origem, c.createdAt,
                        c.atualizadoEm,
                        msgs.getOrDefault(c.id, List.of()).stream()
                                .map(m -> new MensagemChamado(m.id, m.autor, m.texto, m.createdAt))
                                .toList()))
                .toList();
    }

    public Chamado abrir(Cliente c, String assunto, String texto) {
        String a = Membros.limpo(assunto);
        if (a == null) throw Erro.invalido("Escreva o assunto");
        if (a.length() > 120) throw Erro.invalido("Assunto muito longo");
        String t = texto(texto);
        Chamado ch = new Chamado();
        ch.storeId = c.storeId;
        ch.cliente = c;
        ch.assunto = a;
        ch.status = Chamado.ABERTO;
        ch.origem = "area";
        ch.createdAt = OffsetDateTime.now();
        ch.atualizadoEm = ch.createdAt;
        ch.persist();
        adicionar(ch, "membro", t);
        return ch;
    }

    public void respostaDoMembro(Cliente c, UUID chamadoId, String texto) {
        Chamado ch = chamado(c.storeId, chamadoId);
        if (!ch.cliente.id.equals(c.id)) throw Erro.naoEncontrado("Conversa não encontrada");
        adicionar(ch, "membro", texto(texto));
        ch.status = Chamado.ABERTO;
    }

    // Mensagem que o membro escreveu para o robô no privado: entra na conversa
    // em andamento ou abre uma nova. Devolve true se abriu uma conversa nova.
    public boolean doTelegram(Cliente c, String texto) {
        String t = texto(texto);
        Chamado ch = Chamado.<Chamado>find("cliente = ?1 and status <> ?2 order by atualizadoEm desc", c, Chamado.RESOLVIDO)
                .firstResult();
        boolean nova = ch == null;
        if (nova) {
            ch = new Chamado();
            ch.storeId = c.storeId;
            ch.cliente = c;
            String primeira = t.lines().findFirst().orElse(t);
            ch.assunto = primeira.length() > 60 ? primeira.substring(0, 57) + "..." : primeira;
            ch.origem = "telegram";
            ch.createdAt = OffsetDateTime.now();
            ch.persist();
        }
        ch.status = Chamado.ABERTO;
        adicionar(ch, "membro", t);
        return nova;
    }

    public void respostaDaEquipe(UUID storeId, UUID chamadoId, String texto) {
        Chamado ch = chamado(storeId, chamadoId);
        String t = texto(texto);
        adicionar(ch, "equipe", t);
        ch.status = Chamado.RESPONDIDO;

        Config config = membros.config(storeId);
        Membro m = membros.membro(ch.cliente);
        boolean peloTelegram = "telegram".equals(Mensageiro.canal(config, ch.cliente, m));
        String aviso = "Resposta da equipe do " + config.nomeNegocio + " sobre \"" + ch.assunto + "\":\n\n" + t
                + (peloTelegram
                        ? "\n\nPara responder, é só escrever aqui nesta conversa."
                        : "\n\nPara responder: " + endereco.areaMembro(m.codigo));
        Mensagem msg = mensageiro.criar(config, ch.cliente, m, "suporte", aviso, null);
        if (msg != null && "telegram".equals(msg.canal)) mensageiro.enviar(config, msg);
    }

    public void mudarStatus(UUID storeId, UUID chamadoId, String status) {
        Chamado ch = chamado(storeId, chamadoId);
        if (!Chamado.RESOLVIDO.equals(status) && !Chamado.ABERTO.equals(status)) throw Erro.invalido("Situação inválida");
        ch.status = status;
        ch.atualizadoEm = OffsetDateTime.now();
    }

    private static void adicionar(Chamado ch, String autor, String texto) {
        ChamadoMensagem m = new ChamadoMensagem();
        m.storeId = ch.storeId;
        m.chamado = ch;
        m.autor = autor;
        m.texto = texto;
        m.createdAt = OffsetDateTime.now();
        m.persist();
        ch.atualizadoEm = m.createdAt;
    }

    private static String texto(String texto) {
        String t = texto != null ? texto.trim() : "";
        if (t.isEmpty()) throw Erro.invalido("Escreva a mensagem");
        if (t.length() > 4000) throw Erro.invalido("Mensagem muito longa");
        return t;
    }

    private static Chamado chamado(UUID storeId, UUID id) {
        Chamado ch = Chamado.findById(id);
        if (ch == null || !ch.storeId.equals(storeId)) throw Erro.naoEncontrado("Conversa não encontrada");
        return ch;
    }
}
