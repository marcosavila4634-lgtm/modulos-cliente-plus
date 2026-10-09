package br.com.clienteplus.modulos.artesmarciais;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Entrada ou saída do estoque.
@Entity(name = "ArtesMarciaisMovimentoEstoque")
@Table(name = "artes_marciais_estoque_movimentos")
public class MovimentoEstoque extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "tamanho_id")
    public ProdutoTamanho tamanhoProduto;

    public int quantidade;
    // "entrada" | "venda" | "cancelamento" | "ajuste"
    public String motivo;
    public String observacao;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
