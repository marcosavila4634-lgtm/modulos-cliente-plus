package br.com.clienteplus.modulos.artesmarciais;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.clienteplus.Pagamento;
import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Inscrição de um aluno num evento.
@Entity(name = "ArtesMarciaisInscricao")
@Table(name = "artes_marciais_inscricoes")
public class Inscricao extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "evento_id")
    public EventoLuta evento;

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    public String categoria;
    public String faixa;
    public BigDecimal peso;

    @ManyToOne
    @JoinColumn(name = "pagamento_id")
    public Pagamento pagamento;

    // "ouro" | "prata" | "bronze" | "participou" | null
    public String resultado;
    // "recepcao" | "area_aluno"
    public String origem;
    // "inscrito" | "cancelado"
    public String status;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
