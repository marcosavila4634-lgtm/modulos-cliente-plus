package br.com.clienteplus.modulos.artesmarciais;

import br.com.clienteplus.modulos.academia.Despesa;
import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Manutenção feita num equipamento.
@Entity(name = "ArtesMarciaisManutencao")
@Table(name = "artes_marciais_manutencoes")
public class Manutencao extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "equipamento_id")
    public Equipamento equipamento;

    public LocalDate data;
    public String descricao;
    public BigDecimal custo;

    @ManyToOne
    @JoinColumn(name = "despesa_id")
    public Despesa despesa;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
