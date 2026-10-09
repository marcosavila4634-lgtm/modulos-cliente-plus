package br.com.clienteplus.modulos.artesmarciais;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

// Item de uma venda da loja.
@Entity(name = "ArtesMarciaisVendaLojaItem")
@Table(name = "artes_marciais_venda_itens")
public class VendaLojaItem extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "venda_id")
    public VendaLoja venda;

    @ManyToOne
    @JoinColumn(name = "produto_id")
    public Produto produto;

    @ManyToOne
    @JoinColumn(name = "tamanho_id")
    public ProdutoTamanho tamanhoProduto;

    public String nome;
    public String tamanho;
    public int quantidade;
    public BigDecimal precoUnitario;
}
