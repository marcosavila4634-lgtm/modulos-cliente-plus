package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Comissão de um profissional paga num mês (competência = dia 1 do mês).
@Entity
@Table(name = "academia_comissoes_pagas")
public class ComissaoPaga extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "profissional_id")
    public Profissional profissional;

    public LocalDate competencia;
    public BigDecimal valor;

    @ManyToOne
    @JoinColumn(name = "despesa_id")
    public Despesa despesa;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
