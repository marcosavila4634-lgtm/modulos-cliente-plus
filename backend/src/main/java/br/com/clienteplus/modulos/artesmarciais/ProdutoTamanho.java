package br.com.clienteplus.modulos.artesmarciais;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

// Tamanho de um produto, com o estoque.
@Entity(name = "ArtesMarciaisProdutoTamanho")
@Table(name = "artes_marciais_produto_tamanhos")
public class ProdutoTamanho extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "produto_id")
    public Produto produto;

    public String tamanho;
    public int estoque;
    public int estoqueMinimo;
    public int ordem;
}
