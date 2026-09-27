package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.Formatos;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

// Caixa de saída: cria e envia as mensagens para os membros.
//
// Canal escolhido para cada pessoa:
//   - Telegram, se o robô está conectado e a pessoa já conversou com ele
//     (o robô envia sozinho);
//   - WhatsApp, se tem telefone (fica pendente e o dono envia com 1 toque,
//     que abre o WhatsApp com o texto pronto).
//
// No Telegram a mensagem vai com um botão conforme o tipo (ex.: "Pagar agora"
// no lembrete de vencimento).
@ApplicationScoped
public class Mensageiro {

    @Inject
    Telegram telegram;

    @Inject
    EnderecoPublico endereco;

    private static final NumberFormat MOEDA = NumberFormat.getCurrencyInstance(Locale.of("pt", "BR"));
    private static final DateTimeFormatter DATA = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // Cria a mensagem (pendente). null se a pessoa não tem canal ou se a
    // mensagem com esta chave já existe.
    public Mensagem criar(Config config, Cliente c, Membro m, String tipo, String texto, String chave) {
        String canal = canal(config, c, m);
        if (canal == null) return null;
        if (chave != null && Mensagem.count("storeId = ?1 and chave = ?2", c.storeId, chave) > 0) return null;
        Mensagem msg = new Mensagem();
        msg.storeId = c.storeId;
        msg.cliente = c;
        msg.tipo = tipo;
        msg.canal = canal;
        msg.texto = texto;
        msg.status = Mensagem.PENDENTE;
        msg.chave = chave;
        msg.criadaEm = OffsetDateTime.now();
        msg.persist();
        return msg;
    }

    public static String canal(Config config, Cliente c, Membro m) {
        if (config.robo() && m != null && m.telegramId != null) return "telegram";
        if (c.telefone != null) return "whatsapp";
        return null;
    }

    // Envia as mensagens pendentes do Telegram. Devolve quantas foram enviadas.
    public int enviarPendentes(Config config) {
        if (!config.robo()) return 0;
        List<Mensagem> fila = Mensagem.list("storeId = ?1 and status = ?2 and canal = ?3 order by criadaEm",
                config.storeId, Mensagem.PENDENTE, "telegram");
        int enviadas = 0;
        for (Mensagem msg : fila) {
            if (enviar(config, msg)) enviadas++;
        }
        return enviadas;
    }

    public boolean enviar(Config config, Mensagem msg) {
        Membro m = Membro.<Membro>find("cliente", msg.cliente).firstResult();
        if (m == null || m.telegramId == null) {
            msg.status = Mensagem.FALHOU;
            msg.erro = "A pessoa ainda não iniciou conversa com o robô";
            return false;
        }
        try {
            telegram.enviarTexto(config.telegramBotToken, m.telegramId, Telegram.html(msg.texto),
                    new Telegram.Opcoes(null, false, botoes(config, msg.tipo, m)));
            msg.status = Mensagem.ENVIADA;
            msg.enviadaEm = OffsetDateTime.now();
            msg.erro = null;
            return true;
        } catch (Telegram.ErroTelegram e) {
            msg.status = Mensagem.FALHOU;
            msg.erro = e.getMessage();
            return false;
        }
    }

    // Botão embaixo da mensagem, conforme o tipo.
    List<Telegram.Botao> botoes(Config config, String tipo, Membro m) {
        String area = endereco.areaMembro(m.codigo);
        return switch (tipo) {
            case "lembrete", "vencido", "remocao" -> List.of(new Telegram.Botao("💳 Pagar agora", area));
            case "boas_vindas", "anuncio", "aniversario" -> List.of(new Telegram.Botao("📲 Abrir minha área", area));
            case "reconquista" -> List.of(new Telegram.Botao("🔁 Voltar para o grupo", endereco.paginaVendas(config.slug, null)));
            default -> List.of();
        };
    }

    // ---------- Textos ----------

    private static final Pattern VARIAVEL = Pattern.compile("\\{([a-z_]+)\\}");

    // Troca {nome}, {plano}... pelos valores. Variável desconhecida fica como está.
    public static String preencher(String modelo, Map<String, String> valores) {
        Matcher m = VARIAVEL.matcher(modelo);
        StringBuilder sb = new StringBuilder();
        while (m.find()) {
            String v = valores.get(m.group(1));
            m.appendReplacement(sb, Matcher.quoteReplacement(v != null ? v : m.group(0)));
        }
        m.appendTail(sb);
        return sb.toString();
    }

    // Valores das variáveis para um membro.
    public Map<String, String> variaveis(Config config, Membros.Base base, Membros.Estado e) {
        Map<String, String> v = new java.util.HashMap<>();
        v.put("nome", Membros.primeiroNome(e.cliente().nome));
        v.put("negocio", config.nomeNegocio);
        v.put("dias_tolerancia", String.valueOf(config.toleranciaDias));
        v.put("link_vendas", endereco.paginaVendas(config.slug, null));
        if (e.membro() != null) {
            v.put("link_area", endereco.areaMembro(e.membro().codigo));
            v.put("link_indicacao", endereco.paginaVendas(config.slug, e.membro().codigo));
        }
        if (e.plano() != null) {
            v.put("plano", e.plano().nome);
            v.put("grupos", String.join(", ", base.gruposDoPlano(e.plano()).stream().map(g -> g.nome).toList()));
        }
        if (e.proxima() != null) {
            v.put("valor", moeda(e.proxima().valor));
            v.put("vencimento", data(e.proxima().vencimento));
        } else if (e.assinatura() != null) {
            v.put("valor", moeda(e.assinatura().valor));
        }
        return v;
    }

    public static String moeda(BigDecimal valor) {
        return MOEDA.format(valor == null ? BigDecimal.ZERO : valor).replace(' ', ' ');
    }

    public static String data(LocalDate d) {
        return d == null ? "" : d.format(DATA);
    }

    public static String dataHora(OffsetDateTime quando) {
        var local = quando.atZoneSameInstant(Formatos.FUSO);
        return local.format(DateTimeFormatter.ofPattern("dd/MM 'às' HH:mm"));
    }

    // Link do WhatsApp com a mensagem pronta (telefone brasileiro com DDD).
    public static String linkWhatsapp(String telefone, String texto) {
        if (telefone == null) return null;
        return "https://wa.me/55" + telefone + "?text=" + URLEncoder.encode(texto, StandardCharsets.UTF_8).replace("+", "%20");
    }
}
