package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;

// Um indicador do topo do painel (chave = qual indicador).
@Entity
@Table(name = "grupo_vip_indicadores")
public class GrupoVipIndicador extends EntidadeDaLoja {

    // "membros_ativos" | "conteudos_publicados" | "visualizacoes" | "receita_mes"
    // | "novos_este_mes" | "ticket_medio"
    public String chave;
    public BigDecimal valor;
    public BigDecimal variacao;
    public BigDecimal mesAnterior;
}
