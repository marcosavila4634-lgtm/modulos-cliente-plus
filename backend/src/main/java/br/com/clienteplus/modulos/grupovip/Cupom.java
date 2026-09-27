package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Cupom de desconto da página de vendas (vale para o 1º pagamento).
@Entity(name = "GrupoVipCupom")
@Table(name = "grupo_vip_cupons")
public class Cupom extends EntidadeDaLoja {

    public String codigo;
    // "percentual" | "valor"
    public String tipo;
    public BigDecimal valor;
    public LocalDate validade;
    public Integer limiteUsos;
    public int usos;
    public boolean ativo;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
