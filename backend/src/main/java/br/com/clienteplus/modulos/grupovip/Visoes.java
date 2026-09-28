package br.com.clienteplus.modulos.grupovip;

import static br.com.clienteplus.modulos.comum.Formatos.numero;

import br.com.clienteplus.modulos.clienteplus.Plano;
import br.com.clienteplus.modulos.grupovip.AcessosContrato.EventoAcesso;
import br.com.clienteplus.modulos.grupovip.MembrosContrato.MensagemJson;
import br.com.clienteplus.modulos.grupovip.MembrosContrato.Opcao;
import br.com.clienteplus.modulos.grupovip.MembrosContrato.PlanoJson;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

// Conversões de entidades para o JSON usadas em várias telas.
final class Visoes {

    private Visoes() {}

    static PlanoJson plano(Plano p, Membros.Base base) {
        List<Opcao> grupos = base.gruposDoPlano(p).stream().map(g -> new Opcao(g.id, g.nome)).toList();
        int assinantes = (int) base.estados.values().stream()
                .filter(e -> e.temAcesso() && e.plano() != null && e.plano().id.equals(p.id))
                .count();
        Map<UUID, String> permissoes = new HashMap<>();
        for (PlanoGrupo pg : PlanoGrupo.<PlanoGrupo>list("plano", p)) permissoes.put(pg.grupo.id, pg.permissao);
        return new PlanoJson(p.id, p.nome, p.descricao, numero(p.preco), p.duracaoMeses, p.participaIndicacoes,
                p.ativo, grupos, assinantes, permissoes);
    }

    static MensagemJson mensagem(Mensagem m) {
        return new MensagemJson(
                m.id,
                m.cliente.id,
                m.cliente.nome,
                m.cliente.telefone,
                m.tipo,
                m.canal,
                m.texto,
                m.status,
                m.erro,
                m.criadaEm,
                m.enviadaEm,
                "whatsapp".equals(m.canal) ? Mensageiro.linkWhatsapp(m.cliente.telefone, m.texto) : null);
    }

    static EventoAcesso evento(AcessoEvento e) {
        return new EventoAcesso(e.id, e.momento, e.cliente.id, e.cliente.nome, e.grupo.id, e.grupo.nome,
                e.grupo.plataforma, e.acao, e.automatico, e.detalhe);
    }
}
