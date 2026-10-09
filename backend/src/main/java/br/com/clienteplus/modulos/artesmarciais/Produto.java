package br.com.clienteplus.modulos.artesmarciais;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import org.hibernate.annotations.CreationTimestamp;

// Produto da loja (kimono, faixa, luvas...).
@Entity(name = "ArtesMarciaisProduto")
@Table(name = "artes_marciais_produtos")
public class Produto extends EntidadeDaLoja {

    public String nome;
    public String categoria;
    public String descricao;
    public BigDecimal preco;
    public BigDecimal custo;
    public String foto;
    public boolean participaIndicacoes;
    public boolean ativo;

    @CreationTimestamp
    public OffsetDateTime createdAt;

    @OneToMany(mappedBy = "produto", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordem")
    public List<ProdutoTamanho> tamanhos = new ArrayList<>();
}
