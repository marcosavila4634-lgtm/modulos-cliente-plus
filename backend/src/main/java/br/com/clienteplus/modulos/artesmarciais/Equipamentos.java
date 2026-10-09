package br.com.clienteplus.modulos.artesmarciais;

import static br.com.clienteplus.modulos.artesmarciais.Lutas.hoje;
import static br.com.clienteplus.modulos.comum.Formatos.numero;

import br.com.clienteplus.modulos.academia.Despesa;
import br.com.clienteplus.modulos.artesmarciais.ArtesMarciaisContrato.*;
import br.com.clienteplus.modulos.comum.Erro;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

// Equipamentos da academia e as manutenções. Manutenção com custo pode virar
// uma despesa paga (Financeiro > Despesas, categoria "manutencao").
@ApplicationScoped
public class Equipamentos {

    static final Set<String> CATEGORIAS = Set.of("tatame", "saco", "luvas", "protecao", "aparador", "manequim",
            "som_video", "outro");
    static final Set<String> ESTADOS = Set.of("bom", "atencao", "manutencao", "inativo");

    public Equipamento equipamento(UUID storeId, UUID id) {
        Equipamento e = id != null ? Equipamento.findById(id) : null;
        if (e == null || !e.storeId.equals(storeId)) throw Erro.naoEncontrado("Equipamento não encontrado");
        return e;
    }

    static LocalDate proxima(Equipamento e) {
        if (e.intervaloManutencaoDias == null) return null;
        LocalDate base = e.ultimaManutencao != null ? e.ultimaManutencao
                : e.aquisicao != null ? e.aquisicao : e.createdAt.toLocalDate();
        return base.plusDays(e.intervaloManutencaoDias);
    }

    static EquipamentoJson json(Equipamento e) {
        LocalDate prox = proxima(e);
        List<ManutencaoJson> ms = Manutencao.<Manutencao>list("equipamento = ?1 order by data desc", e).stream()
                .map(m -> new ManutencaoJson(m.id, m.data, m.descricao, m.custo != null ? numero(m.custo) : null))
                .toList();
        return new EquipamentoJson(e.id, e.nome, e.categoria, e.quantidade, e.local, e.estado,
                e.intervaloManutencaoDias, e.ultimaManutencao, prox,
                !"inativo".equals(e.estado) && prox != null && prox.isBefore(hoje()), e.aquisicao,
                e.valor != null ? numero(e.valor) : null, e.observacao, ms);
    }

    public List<EquipamentoJson> lista(UUID storeId) {
        return Equipamento.<Equipamento>list("storeId = ?1 order by local, nome", storeId).stream()
                .map(Equipamentos::json)
                .toList();
    }

    // Quantos precisam de atenção (manutenção, estado ruim ou revisão vencida).
    public long precisamAtencao(UUID storeId) {
        return lista(storeId).stream()
                .filter(e -> "manutencao".equals(e.estado()) || "atencao".equals(e.estado()) || e.manutencaoVencida())
                .count();
    }

    @Transactional
    public Equipamento salvar(UUID storeId, UUID id, DadosEquipamento d) {
        if (d == null) throw Erro.invalido("Dados do equipamento");
        Equipamento e;
        if (id == null) {
            e = new Equipamento();
            e.storeId = storeId;
        } else {
            e = equipamento(storeId, id);
        }
        e.nome = Lutas.obrigatorio(d.nome(), "Dê um nome para o equipamento");
        e.categoria = d.categoria() != null && CATEGORIAS.contains(d.categoria()) ? d.categoria() : "outro";
        if (d.quantidade() != null && d.quantidade() < 0) throw Erro.invalido("Quantidade inválida");
        e.quantidade = d.quantidade() != null ? d.quantidade() : 1;
        e.local = Lutas.texto(d.local());
        e.estado = d.estado() != null && ESTADOS.contains(d.estado()) ? d.estado() : "bom";
        if (d.intervaloManutencaoDias() != null && d.intervaloManutencaoDias() < 1) {
            throw Erro.invalido("Revisão: deixe vazio ou use 1 dia ou mais");
        }
        e.intervaloManutencaoDias = d.intervaloManutencaoDias();
        e.ultimaManutencao = d.ultimaManutencao();
        e.aquisicao = d.aquisicao();
        e.valor = d.valor() != null ? Lutas.dinheiro(d.valor()) : null;
        e.observacao = Lutas.texto(d.observacao());
        e.persist();
        return e;
    }

    @Transactional
    public void excluir(UUID storeId, UUID id) {
        Equipamento e = equipamento(storeId, id);
        Manutencao.delete("equipamento", e);
        e.delete();
    }

    @Transactional
    public void manutencao(UUID storeId, UUID id, NovaManutencao d) {
        Equipamento e = equipamento(storeId, id);
        if (d == null) throw Erro.invalido("Dados da manutenção");
        LocalDate data = d.data() != null ? d.data() : hoje();
        if (data.isAfter(hoje())) throw Erro.invalido("A data não pode ser no futuro");
        Manutencao m = new Manutencao();
        m.storeId = storeId;
        m.equipamento = e;
        m.data = data;
        m.descricao = Lutas.obrigatorio(d.descricao(), "Descreva o que foi feito");
        m.custo = d.custo() != null && d.custo().signum() > 0 ? Lutas.dinheiro(d.custo()) : null;
        if (m.custo != null && Boolean.TRUE.equals(d.lancarDespesa())) {
            Despesa x = new Despesa();
            x.storeId = storeId;
            x.descricao = "Manutenção: " + e.nome;
            x.categoria = "manutencao";
            x.fornecedor = "";
            x.valor = m.custo;
            x.vencimento = data;
            x.status = Despesa.PAGA;
            x.pagoEm = OffsetDateTime.now();
            x.formaPagamento = d.formaPagamento() != null ? d.formaPagamento() : "pix";
            x.recorrente = false;
            x.observacao = m.descricao;
            x.persist();
            m.despesa = x;
        }
        m.persist();
        if (e.ultimaManutencao == null || !data.isBefore(e.ultimaManutencao)) e.ultimaManutencao = data;
        e.estado = d.estado() != null && ESTADOS.contains(d.estado()) ? d.estado() : "bom";
    }
}
