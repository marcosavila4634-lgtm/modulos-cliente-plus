package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.Erro;
import br.com.clienteplus.modulos.grupovip.TelegramContrato.*;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

// Enquetes e quiz nos grupos do Telegram. O robô envia a enquete, o Telegram
// avisa a cada voto (RoboTelegram -> atualizarVotos) e o painel mostra o
// resultado somando todos os grupos. Encerrar fecha a votação nos grupos.
@ApplicationScoped
public class Enquetes {

    @Inject
    Membros membros;

    @Inject
    Telegram telegram;

    @Inject
    Conteudos conteudos;

    public ListaEnquetes listar(UUID storeId) {
        Config config = membros.config(storeId);
        Map<UUID, List<EnqueteEnvio>> envios = EnqueteEnvio.<EnqueteEnvio>list("storeId = ?1 order by enviadaEm", storeId).stream()
                .collect(Collectors.groupingBy(e -> e.enquete.id));
        List<EnqueteJson> lista = Enquete.<Enquete>list("storeId = ?1 order by createdAt desc", storeId).stream()
                .map(e -> json(e, envios.getOrDefault(e.id, List.of())))
                .toList();
        return new ListaEnquetes(lista,
                conteudos.grupos(storeId, config).stream().filter(ConteudosContrato.GrupoOpcao::automatico).toList(),
                config.robo());
    }

    private static EnqueteJson json(Enquete e, List<EnqueteEnvio> envios) {
        List<String> opcoes = e.listaOpcoes();
        int[] soma = new int[opcoes.size()];
        int total = 0;
        List<EnvioJson> lista = new ArrayList<>();
        for (EnqueteEnvio v : envios) {
            List<Integer> votos = votos(v.votos, opcoes.size());
            for (int i = 0; i < soma.length; i++) soma[i] += votos.get(i);
            total += v.totalVotos;
            lista.add(new EnvioJson(v.id, v.grupo.id, v.grupo.nome, v.topico != null ? v.topico.nome : null, v.status, v.erro,
                    votos, v.totalVotos));
        }
        return new EnqueteJson(e.id, e.pergunta, opcoes, e.tipo, e.correta, e.explicacao, e.anonima, e.multipla, e.encerrada,
                e.createdAt, lista, Arrays.stream(soma).boxed().toList(), total);
    }

    private static List<Integer> votos(String texto, int tamanho) {
        List<Integer> v = new ArrayList<>();
        String[] partes = texto == null || texto.isBlank() ? new String[0] : texto.split(";");
        for (int i = 0; i < tamanho; i++) v.add(i < partes.length ? Integer.parseInt(partes[i]) : 0);
        return v;
    }

    public Enquete criar(UUID storeId, DadosEnquete d) {
        if (d == null) throw Erro.invalido("Preencha a enquete");
        Config config = membros.config(storeId);
        if (!config.robo()) throw Erro.conflito("Conecte o robô do Telegram em Configurações para enviar enquetes");
        String pergunta = Membros.limpo(d.pergunta());
        if (pergunta == null) throw Erro.invalido("Escreva a pergunta");
        if (pergunta.length() > 300) throw Erro.invalido("Pergunta com até 300 letras");
        List<String> opcoes = d.opcoes() == null ? List.of()
                : d.opcoes().stream().map(o -> o == null ? "" : o.trim()).filter(o -> !o.isEmpty()).toList();
        if (opcoes.size() < 2) throw Erro.invalido("Escreva pelo menos 2 opções");
        if (opcoes.size() > 10) throw Erro.invalido("No máximo 10 opções");
        if (opcoes.stream().anyMatch(o -> o.length() > 100)) throw Erro.invalido("Cada opção com até 100 letras");
        boolean quiz = "quiz".equals(d.tipo());
        if (quiz && (d.correta() == null || d.correta() < 0 || d.correta() >= opcoes.size())) {
            throw Erro.invalido("Marque qual é a resposta certa");
        }
        String explicacao = quiz ? Membros.limpo(d.explicacao()) : null;
        if (explicacao != null && explicacao.length() > 200) throw Erro.invalido("Explicação com até 200 letras");
        List<UUID> grupoIds = d.grupoIds() != null ? new ArrayList<>(new LinkedHashSet<>(d.grupoIds())) : List.of();
        if (grupoIds.isEmpty()) throw Erro.invalido("Escolha pelo menos um grupo");

        Enquete e = new Enquete();
        e.storeId = storeId;
        e.pergunta = pergunta;
        e.opcoes = String.join("\n", opcoes);
        e.tipo = quiz ? "quiz" : "enquete";
        e.correta = quiz ? d.correta() : null;
        e.explicacao = explicacao;
        e.anonima = d.anonima();
        e.multipla = !quiz && d.multipla();
        e.persist();

        String zeros = String.join(";", opcoes.stream().map(o -> "0").toList());
        for (UUID gid : grupoIds) {
            Grupo g = Grupo.findById(gid);
            if (g == null || !g.storeId.equals(storeId)) throw Erro.invalido("Grupo não encontrado");
            if (!g.automatico(config)) throw Erro.invalido("O robô não cuida do grupo " + g.nome);
            EnqueteEnvio v = new EnqueteEnvio();
            v.storeId = storeId;
            v.enquete = e;
            v.grupo = g;
            v.votos = zeros;
            v.enviadaEm = OffsetDateTime.now();
            UUID topicoId = d.topicos() != null ? d.topicos().get(gid) : null;
            if (topicoId != null) {
                Topico t = Topico.findById(topicoId);
                if (t == null || !t.grupo.id.equals(g.id)) throw Erro.invalido("Tópico não encontrado");
                v.topico = t;
            }
            try {
                JsonNode msg = telegram.enviarEnquete(config.telegramBotToken, g.telegramChatId, pergunta, opcoes, e.tipo,
                        e.correta, explicacao, e.anonima, e.multipla,
                        new Telegram.Opcoes(v.topico != null ? v.topico.threadId : null, g.protegerConteudo, List.of()));
                v.telegramMessageId = msg.path("message_id").asLong();
                v.telegramPollId = msg.path("poll").path("id").asText();
                v.status = EnqueteEnvio.ENVIADA;
            } catch (Telegram.ErroTelegram ex) {
                v.status = EnqueteEnvio.FALHOU;
                v.erro = ex.getMessage();
            }
            v.persist();
        }
        return e;
    }

    // O Telegram mandou a situação da enquete (a cada voto e ao encerrar).
    void atualizarVotos(UUID storeId, JsonNode poll) {
        EnqueteEnvio v = EnqueteEnvio.<EnqueteEnvio>find("storeId = ?1 and telegramPollId = ?2", storeId, poll.path("id").asText())
                .firstResult();
        if (v == null) return;
        guardar(v, poll);
    }

    private static void guardar(EnqueteEnvio v, JsonNode poll) {
        List<String> votos = new ArrayList<>();
        for (JsonNode o : poll.path("options")) votos.add(String.valueOf(o.path("voter_count").asInt()));
        v.votos = String.join(";", votos);
        v.totalVotos = poll.path("total_voter_count").asInt();
        if (poll.path("is_closed").asBoolean(false)) v.status = EnqueteEnvio.ENCERRADA;
    }

    // Encerra a votação em todos os grupos.
    public void encerrar(UUID storeId, UUID id) {
        Enquete e = enquete(storeId, id);
        Config config = membros.config(storeId);
        for (EnqueteEnvio v : EnqueteEnvio.<EnqueteEnvio>list("enquete = ?1 and status = ?2", e, EnqueteEnvio.ENVIADA)) {
            if (!v.grupo.automatico(config)) continue;
            try {
                guardar(v, telegram.encerrarEnquete(config.telegramBotToken, v.grupo.telegramChatId, v.telegramMessageId));
                v.status = EnqueteEnvio.ENCERRADA;
            } catch (Telegram.ErroTelegram ex) {
                v.status = EnqueteEnvio.ENCERRADA; // já estava encerrada ou apagada no Telegram
                v.erro = ex.getMessage();
            }
        }
        e.encerrada = true;
    }

    // Apaga a enquete daqui e tenta apagar dos grupos.
    public void excluir(UUID storeId, UUID id) {
        Enquete e = enquete(storeId, id);
        Config config = membros.config(storeId);
        for (EnqueteEnvio v : EnqueteEnvio.<EnqueteEnvio>list("enquete", e)) {
            if (v.telegramMessageId == null || !v.grupo.automatico(config)) continue;
            try {
                telegram.apagarMensagem(config.telegramBotToken, v.grupo.telegramChatId, v.telegramMessageId);
            } catch (Telegram.ErroTelegram ignorado) {
                // já apagada no Telegram
            }
        }
        e.delete();
    }

    private static Enquete enquete(UUID storeId, UUID id) {
        Enquete e = Enquete.findById(id);
        if (e == null || !e.storeId.equals(storeId)) throw Erro.naoEncontrado("Enquete não encontrada");
        return e;
    }
}
