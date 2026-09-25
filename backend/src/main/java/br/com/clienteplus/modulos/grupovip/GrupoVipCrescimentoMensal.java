package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalDate;

// Total de membros em um mês.
@Entity
@Table(name = "grupo_vip_crescimento_mensal")
public class GrupoVipCrescimentoMensal extends EntidadeDaLoja {

    // primeiro dia do mês
    public LocalDate mes;
    public int membros;
    // dia da medição, quando o mês ainda está em andamento
    public LocalDate dataReferencia;
}
