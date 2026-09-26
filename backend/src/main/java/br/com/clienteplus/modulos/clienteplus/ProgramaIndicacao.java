package br.com.clienteplus.modulos.clienteplus;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;

// Percentuais de comissão por nível do programa de indicações do lojista.
@Entity
@Table(name = "cp_programa_indicacao")
public class ProgramaIndicacao extends EntidadeDaLoja {

    @Column(name = "nivel1_pct")
    public BigDecimal nivel1Pct;

    @Column(name = "nivel2_pct")
    public BigDecimal nivel2Pct;

    @Column(name = "nivel3_pct")
    public BigDecimal nivel3Pct;
}
