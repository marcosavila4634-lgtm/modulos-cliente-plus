package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.clienteplus.Pagamento;
import br.com.clienteplus.modulos.comum.Erro;
import io.quarkus.logging.Log;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

// Automações: rodam sozinhas a cada minuto (e pelo botão "Rodar agora").
//
//   1. Controle de acesso: o robô convida quem pagou e tira quem ficou sem acesso.
//   2. Mensagens automáticas (cada uma só uma vez por pessoa/cobrança):
//        boas_vindas  1º pagamento confirmado
//        lembrete     N dias antes do vencimento
//        vencido      N dias depois do vencimento (ainda dentro da tolerância)
//        remocao      quando o atraso passa da tolerância e o acesso é cortado
//        reconquista  N dias depois de perder o acesso
//        aniversario  no dia do aniversário (quem tem acesso)
//        live         quando uma live está para começar
//   3. Conteúdos agendados cuja hora chegou.
//   4. Envio das mensagens pendentes do Telegram.
//   5. Trava/libera os grupos do Telegram no horário escolhido.
@ApplicationScoped
public class Automacoes {

    @Inject
    Membros membros;

    @Inject
    ControleAcesso controle;

    @Inject
    Mensageiro mensageiro;

    @Inject
    Conteudos conteudos;

    @Inject
    GestaoTelegram gestao;

    public record Padrao(String titulo, String descricao, int dias, String texto) {}

    // Textos iniciais (o dono edita na tela Automação).
    public static final Map<String, Padrao> PADROES = new LinkedHashMap<>();

    static {
        PADROES.put("boas_vindas", new Padrao("Boas-vindas", "Quando o 1º pagamento é confirmado", 0,
                "Olá, {nome}! 🎉 Seu pagamento foi confirmado e você já faz parte do {negocio}.\n\n"
                        + "Seus grupos: {grupos}\nSeus links de entrada estão aqui: {link_area}\n\n"
                        + "Indique amigos e ganhe comissão todo mês: {link_indicacao}"));
        PADROES.put("lembrete", new Padrao("Lembrete de vencimento", "Dias antes do vencimento", 3,
                "Oi, {nome}! Sua assinatura do plano {plano} ({valor}) vence em {vencimento}. "
                        + "Para continuar nos grupos, pague por aqui: {link_area}"));
        PADROES.put("vencido", new Padrao("Pagamento em atraso", "Dias depois do vencimento", 1,
                "Oi, {nome}. Não encontramos o pagamento de {valor} que venceu em {vencimento}. "
                        + "Você tem até {dias_tolerancia} dias de tolerância antes de sair dos grupos. Pague aqui: {link_area}"));
        PADROES.put("remocao", new Padrao("Acesso encerrado", "Quando o atraso passa da tolerância", 0,
                "{nome}, como o pagamento não foi identificado, seu acesso aos grupos foi encerrado. "
                        + "Para voltar, é só pagar: {link_area}"));
        PADROES.put("reconquista", new Padrao("Volte para o grupo", "Dias depois de perder o acesso", 7,
                "Sentimos sua falta, {nome}! 💛 O {negocio} continua com conteúdo novo toda semana. "
                        + "Volte quando quiser: {link_vendas}"));
        PADROES.put("aniversario", new Padrao("Aniversário", "No dia do aniversário do membro", 0,
                "Feliz aniversário, {nome}! 🎂 Toda a equipe do {negocio} te deseja um dia incrível."));
        PADROES.put("live", new Padrao("Aviso de live", "Antes de cada live (o tempo é definido na live)", 0,
                "🔴 Live: {live}\n{horario}\n\nLink: {link_live}"));
    }

    // Garante que a loja tem todas as automações (cria as que faltam).
    public Map<String, Automacao> garantir(UUID storeId) {
        Map<String, Automacao> porTipo = new LinkedHashMap<>();
        for (Automacao a : Automacao.<Automacao>list("storeId", storeId)) porTipo.put(a.tipo, a);
        Map<String, Automacao> ordenadas = new LinkedHashMap<>();
        PADROES.forEach((tipo, p) -> {
            Automacao a = porTipo.get(tipo);
            if (a == null) {
                a = new Automacao();
                a.storeId = storeId;
                a.tipo = tipo;
                a.ativa = true;
                a.dias = p.dias();
                a.texto = p.texto();
                a.persist();
            }
            ordenadas.put(tipo, a);
        });
        return ordenadas;
    }

    public Automacao salvar(UUID storeId, String tipo, boolean ativa, Integer dias, String texto) {
        Automacao a = garantir(storeId).get(tipo);
        if (a == null) throw Erro.naoEncontrado("Automação não encontrada");
        if (texto == null || texto.isBlank()) throw Erro.invalido("Escreva o texto da mensagem");
        if (texto.length() > 3000) throw Erro.invalido("Texto muito longo (máximo 3.000 letras)");
        int d = dias != null ? dias : a.dias;
        if (d < 0 || d > 90) throw Erro.invalido("Dias entre 0 e 90");
        a.ativa = ativa;
        a.dias = d;
        a.texto = texto.trim();
        return a;
    }

    public record Resultado(int convidados, int removidos, int mensagensCriadas, int mensagensEnviadas,
                            int conteudosPublicados, int livesAvisadas, List<String> erros) {}

    @Scheduled(every = "60s", delayed = "20s", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void aCadaMinuto() {
        List<UUID> lojas = QuarkusTransaction.requiringNew().call(() -> Config.<Config>listAll().stream()
                .map(c -> c.storeId)
                .toList());
        for (UUID loja : lojas) {
            try {
                Resultado r = QuarkusTransaction.requiringNew().call(() -> rodar(loja));
                if (!r.erros().isEmpty()) Log.warnf("Automações Grupos VIP: %s", r.erros());
            } catch (Exception e) {
                Log.warnf("Automações Grupos VIP: %s", e.getMessage());
            }
        }
    }

    public Resultado rodar(UUID storeId) {
        AcessosContrato.Sincronizacao s = controle.sincronizar(storeId);
        Config config = membros.config(storeId);
        Map<String, Automacao> auto = garantir(storeId);
        int criadas = gerarMensagens(config, auto);
        int publicados = conteudos.publicarAgendados(config);
        int lives = conteudos.avisarLives(config, auto.get("live"));
        int enviadas = mensageiro.enviarPendentes(config);
        List<String> erros = new ArrayList<>(s.erros());
        erros.addAll(gestao.aplicarHorarios(config));
        return new Resultado(s.convidados(), s.removidos(), criadas, enviadas, publicados, lives, erros);
    }

    int gerarMensagens(Config config, Map<String, Automacao> auto) {
        Membros.Base base = membros.base(config.storeId);
        LocalDate hoje = Membros.hoje();
        OffsetDateTime doisDias = OffsetDateTime.now().minusDays(2);
        int criadas = 0;

        for (Membros.Estado e : base.estados.values()) {
            List<String[]> enviar = new ArrayList<>(); // [tipo, chave]
            Pagamento prox = e.proxima();
            String sit = e.situacao();

            if (ativa(auto, "boas_vindas") && e.temAcesso() && e.assinatura() != null) {
                boolean recente = base.pagamentosDa(e.assinatura()).stream()
                        .filter(p -> Pagamento.PAGO.equals(p.status) && p.pagoEm != null)
                        .findFirst()
                        .map(p -> p.pagoEm.isAfter(doisDias))
                        .orElse(false);
                if (recente) enviar.add(new String[] {"boas_vindas", "boas_vindas:" + e.assinatura().id});
            }
            if (ativa(auto, "lembrete") && prox != null && ("em_dia".equals(sit) || "vencendo".equals(sit))) {
                long faltam = ChronoUnit.DAYS.between(hoje, prox.vencimento);
                if (faltam >= 0 && faltam <= auto.get("lembrete").dias) {
                    enviar.add(new String[] {"lembrete", "lembrete:" + prox.id});
                }
            }
            if (ativa(auto, "vencido") && prox != null && "atrasado".equals(sit)
                    && e.diasAtraso() >= Math.max(1, auto.get("vencido").dias)) {
                enviar.add(new String[] {"vencido", "vencido:" + prox.id});
            }
            if (ativa(auto, "remocao") && prox != null && "bloqueado".equals(sit) && "atraso".equals(e.motivoBloqueio())) {
                enviar.add(new String[] {"remocao", "remocao:" + prox.id});
            }
            if (ativa(auto, "reconquista") && "sem_plano".equals(sit) && e.pagoAte() != null) {
                long desde = ChronoUnit.DAYS.between(e.pagoAte(), hoje);
                int dias = auto.get("reconquista").dias;
                if (desde >= dias && desde <= dias + 7) {
                    enviar.add(new String[] {"reconquista", "reconquista:" + e.cliente().id + ":" + e.pagoAte()});
                }
            }
            LocalDate nasc = e.cliente().dataNascimento;
            if (ativa(auto, "aniversario") && e.temAcesso() && nasc != null
                    && nasc.getMonth() == hoje.getMonth() && nasc.getDayOfMonth() == hoje.getDayOfMonth()) {
                enviar.add(new String[] {"aniversario", "aniversario:" + e.cliente().id + ":" + hoje.getYear()});
            }

            if (enviar.isEmpty()) continue;
            Map<String, String> vars = mensageiro.variaveis(config, base, e);
            for (String[] item : enviar) {
                String texto = Mensageiro.preencher(auto.get(item[0]).texto, vars);
                if (mensageiro.criar(config, e.cliente(), e.membro(), item[0], texto, item[1]) != null) criadas++;
            }
        }
        return criadas;
    }

    private static boolean ativa(Map<String, Automacao> auto, String tipo) {
        Automacao a = auto.get(tipo);
        return a != null && a.ativa;
    }
}
