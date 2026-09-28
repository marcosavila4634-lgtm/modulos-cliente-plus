package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.Erro;
import br.com.clienteplus.modulos.grupovip.MembrosContrato.DadosPermissao;
import br.com.clienteplus.modulos.grupovip.MembrosContrato.PermissaoMembro;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

// Permissões dos membros nos grupos do Telegram com o robô.
//
// O que cada pessoa pode fazer no grupo, nesta ordem:
//   1. administrador (o dono escolheu na ficha): vira administrador com os
//      direitos marcados e o título ao lado do nome
//   2. nível escolhido na ficha do membro (com prazo ou sem)
//   3. atrasado (dentro da tolerância) e a opção "atrasado = só leitura"
//      ligada em Configurações: só lê
//   4. o nível do plano para aquele grupo (Grupos e planos)
//
// Níveis: completo (tudo o que o grupo permite) | sem_midia (só texto) |
// leitura (só lê). O robô aplica pelas Automações (a cada minuto, no máximo
// POR_RODADA pessoas por vez), quando a pessoa entra no grupo e quando o dono
// salva na ficha. "aplicado" guarda o que já foi feito, para não repetir.
@ApplicationScoped
public class Permissoes {

    public static final String COMPLETO = "completo";
    public static final String SEM_MIDIA = "sem_midia";
    public static final String LEITURA = "leitura";
    static final Set<String> NIVEIS = Set.of(COMPLETO, SEM_MIDIA, LEITURA);
    // Direitos de administrador que o dono pode dar (nomes da API do Telegram).
    static final List<String> DIREITOS = List.of("can_delete_messages", "can_restrict_members", "can_pin_messages",
            "can_invite_users", "can_change_info", "can_manage_topics", "can_manage_video_chats");
    static final int POR_RODADA = 25;

    @Inject
    Telegram telegram;

    @Inject
    Membros membros;

    // origem: "plano" | "atraso" | "manual" | "administrador"
    public record Efetiva(String nivel, String origem, boolean administrador, List<String> direitos, String titulo) {
        String assinatura() {
            return administrador ? "admin:" + String.join(",", direitos) + ":" + (titulo != null ? titulo : "") : nivel;
        }
    }

    // Nível de cada plano em cada grupo: "planoId:grupoId" -> nível.
    static Map<String, String> doPlano(UUID storeId) {
        Map<String, String> r = new HashMap<>();
        for (PlanoGrupo pg : PlanoGrupo.<PlanoGrupo>list("storeId", storeId)) r.put(pg.plano.id + ":" + pg.grupo.id, pg.permissao);
        return r;
    }

    static Efetiva calcular(Config config, Membros.Estado e, Grupo g, Permissao p, Map<String, String> planos) {
        if (p != null && p.administrador) return new Efetiva(COMPLETO, "administrador", true, direitos(p), p.titulo);
        if (p != null && p.nivel != null && (p.nivelAte == null || p.nivelAte.isAfter(OffsetDateTime.now()))) {
            return new Efetiva(p.nivel, "manual", false, List.of(), null);
        }
        if (config.atrasadoSomenteLeitura && e != null && "atrasado".equals(e.situacao())) {
            return new Efetiva(LEITURA, "atraso", false, List.of(), null);
        }
        String nivel = e != null && e.plano() != null ? planos.getOrDefault(e.plano().id + ":" + g.id, COMPLETO) : COMPLETO;
        return new Efetiva(nivel, "plano", false, List.of(), null);
    }

    static List<String> direitos(Permissao p) {
        if (p.direitos == null || p.direitos.isBlank()) return List.of();
        return Arrays.stream(p.direitos.split(",")).map(String::trim).filter(DIREITOS::contains).sorted().toList();
    }

    // Já está aplicado no Telegram? (null = o robô nunca mexeu: a pessoa tem o
    // que o grupo permite a todos, que é o mesmo que "completo")
    static boolean emDia(Permissao p, Efetiva ef) {
        String aplicado = p != null ? p.aplicado : null;
        if (aplicado == null) return !ef.administrador() && COMPLETO.equals(ef.nivel());
        return aplicado.equals(ef.assinatura());
    }

    // ---------- Aplicar no Telegram ----------

    record Chave(UUID grupo, UUID cliente) {}

    // Automações: aplica o que mudou para quem está nos grupos. Devolve os erros.
    public List<String> aplicar(Config config) {
        List<String> erros = new ArrayList<>();
        if (!config.robo()) return erros;
        Membros.Base base = membros.base(config.storeId);
        Map<String, String> planos = doPlano(config.storeId);
        Map<Chave, Permissao> todas = new HashMap<>();
        for (Permissao p : Permissao.<Permissao>list("storeId", config.storeId)) todas.put(new Chave(p.grupo.id, p.cliente.id), p);
        OffsetDateTime agora = OffsetDateTime.now();
        int feitas = 0;
        for (Acesso a : Acesso.<Acesso>list("storeId = ?1 and status = ?2", config.storeId, Acesso.NO_GRUPO)) {
            if (!a.grupo.automatico(config)) continue;
            Membro m = base.membroPorCliente.get(a.cliente.id);
            if (m == null || m.telegramId == null) continue;
            Permissao p = todas.get(new Chave(a.grupo.id, a.cliente.id));
            if (p != null && p.nivel != null && p.nivelAte != null && !p.nivelAte.isAfter(agora)) {
                p.nivel = null; // o prazo do nível escolhido acabou: volta ao plano
                p.nivelAte = null;
            }
            Efetiva ef = calcular(config, base.estado(a.cliente.id), a.grupo, p, planos);
            if (emDia(p, ef)) continue;
            // deu erro há pouco: espera 10 minutos para tentar de novo
            if (p != null && p.erro != null && p.tentadoEm != null && p.tentadoEm.isAfter(agora.minusMinutes(10))) continue;
            if (feitas++ >= POR_RODADA) break;
            if (p == null) p = nova(a.grupo, a.cliente);
            String erro = executar(config, a.grupo, m.telegramId, p, ef);
            if (erro != null) erros.add(a.cliente.nome + " (" + a.grupo.nome + "): " + erro);
        }
        return erros;
    }

    // Aplica agora para uma pessoa (salvou na ficha ou acabou de entrar).
    // Devolve o erro (ou null).
    String aplicarUm(Config config, Grupo g, Cliente c) {
        if (!g.automatico(config)) return null;
        Membro m = Membro.<Membro>find("cliente", c).firstResult();
        Acesso a = Acesso.<Acesso>find("grupo = ?1 and cliente = ?2", g, c).firstResult();
        if (m == null || m.telegramId == null || a == null || !Acesso.NO_GRUPO.equals(a.status)) return null;
        Permissao p = Permissao.<Permissao>find("grupo = ?1 and cliente = ?2", g, c).firstResult();
        Efetiva ef = calcular(config, membros.base(config.storeId).estado(c.id), g, p, doPlano(config.storeId));
        if (emDia(p, ef)) return null;
        if (p == null) p = nova(g, c);
        return executar(config, g, m.telegramId, p, ef);
    }

    // A pessoa saiu do grupo: ao voltar, o robô aplica tudo de novo.
    static void saiu(Grupo g, Cliente c) {
        Permissao p = Permissao.<Permissao>find("grupo = ?1 and cliente = ?2", g, c).firstResult();
        if (p != null && p.aplicado != null && !COMPLETO.equals(p.aplicado)) p.aplicado = "?";
    }

    private String executar(Config config, Grupo g, long usuario, Permissao p, Efetiva ef) {
        String token = config.telegramBotToken;
        p.tentadoEm = OffsetDateTime.now();
        try {
            if (ef.administrador()) {
                telegram.promover(token, g.telegramChatId, usuario, ef.direitos());
                if (ef.titulo() != null && !ef.titulo().isBlank()) {
                    telegram.tituloAdministrador(token, g.telegramChatId, usuario, ef.titulo());
                }
            } else {
                if (p.aplicado != null && (p.aplicado.startsWith("admin") || "?".equals(p.aplicado))) {
                    try {
                        telegram.promover(token, g.telegramChatId, usuario, List.of()); // deixa de ser administrador
                    } catch (Telegram.ErroTelegram ignorado) {
                        // não era administrador: tudo bem
                    }
                }
                telegram.restringir(token, g.telegramChatId, usuario, ef.nivel());
            }
            p.aplicado = ef.assinatura();
            p.erro = null;
            return null;
        } catch (Telegram.ErroTelegram e) {
            String t = e.original.toLowerCase();
            String erro;
            if (ef.administrador() && (t.contains("not enough rights") || t.contains("can't promote") || t.contains("right"))) {
                erro = "O robô precisa ser administrador com a permissão \"Adicionar administradores\"";
            } else if (t.contains("user is an administrator") || t.contains("can't restrict") || t.contains("can't remove chat owner")) {
                erro = "Esta pessoa é administradora do grupo (pelo próprio Telegram): para limitar, tire o cargo dela no Telegram";
            } else if (t.contains("title") && ef.administrador()) {
                erro = "Título não aceito pelo Telegram (até 16 letras, sem emoji)";
            } else {
                erro = e.getMessage();
            }
            p.erro = erro;
            return erro;
        }
    }

    private static Permissao nova(Grupo g, Cliente c) {
        Permissao p = new Permissao();
        p.storeId = g.storeId;
        p.grupo = g;
        p.cliente = c;
        p.direitos = "";
        p.persist();
        return p;
    }

    // ---------- Ficha do membro ----------

    static PermissaoMembro json(Config config, Membros.Estado e, Grupo g, Permissao p, Map<String, String> planos) {
        Efetiva ef = calcular(config, e, g, p, planos);
        String doPlano = e != null && e.plano() != null ? planos.getOrDefault(e.plano().id + ":" + g.id, COMPLETO) : COMPLETO;
        boolean nivelValido = p != null && p.nivel != null && (p.nivelAte == null || p.nivelAte.isAfter(OffsetDateTime.now()));
        return new PermissaoMembro(ef.nivel(), ef.origem(), ef.administrador(), p != null ? direitos(p) : List.of(),
                p != null ? p.titulo : null, nivelValido ? p.nivel : null, nivelValido ? p.nivelAte : null, doPlano,
                emDia(p, ef), p != null ? p.erro : null);
    }

    // O dono salvou na ficha. Devolve o erro do Telegram (ou null).
    public String salvar(UUID storeId, UUID clienteId, UUID grupoId, DadosPermissao d) {
        if (d == null) throw Erro.invalido("Preencha as permissões");
        Config config = membros.config(storeId);
        Cliente c = membros.cliente(storeId, clienteId);
        Grupo g = Grupo.findById(grupoId);
        if (g == null || !g.storeId.equals(storeId)) throw Erro.naoEncontrado("Grupo não encontrado");
        if (!g.automatico(config)) throw Erro.invalido("Permissões só em grupos do Telegram com o robô");
        if (d.nivel() != null && !NIVEIS.contains(d.nivel())) throw Erro.invalido("Nível inválido");
        if (d.nivelAte() != null && !d.nivelAte().isAfter(OffsetDateTime.now())) throw Erro.invalido("O prazo precisa ser no futuro");
        Set<String> direitos = new LinkedHashSet<>(d.direitos() != null ? d.direitos() : List.of());
        if (!DIREITOS.containsAll(direitos)) throw Erro.invalido("Direito de administrador inválido");
        if (d.administrador() && direitos.isEmpty()) throw Erro.invalido("Marque pelo menos um direito de administrador");
        String titulo = Membros.limpo(d.titulo());
        if (titulo != null && titulo.length() > 16) throw Erro.invalido("Título de no máximo 16 letras");

        Permissao p = Permissao.<Permissao>find("grupo = ?1 and cliente = ?2", g, c).firstResult();
        if (p == null) p = nova(g, c);
        p.nivel = d.nivel();
        p.nivelAte = d.nivel() != null ? d.nivelAte() : null;
        p.administrador = d.administrador();
        p.direitos = d.administrador() ? String.join(",", direitos.stream().sorted().toList()) : "";
        p.titulo = d.administrador() ? titulo : null;
        p.erro = null;
        return aplicarUm(config, g, c);
    }
}
