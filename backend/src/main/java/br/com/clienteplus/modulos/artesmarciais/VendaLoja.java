package br.com.clienteplus.modulos.artesmarciais;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.clienteplus.Pagamento;
import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import org.hibernate.annotations.CreationTimestamp;

// Venda da loja a um aluno (gera um pagamento avulso).
@Entity(name = "ArtesMarciaisVendaLoja")
@Table(name = "artes_marciais_vendas")
public class VendaLoja extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    @ManyToOne
    @JoinColumn(name = "pagamento_id")
    public Pagamento pagamento;

    public BigDecimal total;
    // "ativa" | "cancelada"
    public String status;
    public boolean entregue;
    public String observacao;

    @CreationTimestamp
    public OffsetDateTime createdAt;

    @OneToMany(mappedBy = "venda", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("nome")
    public List<VendaLojaItem> itens = new ArrayList<>();
}
