package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

// Link temporário e pessoal para ler ou baixar um livro (LinksDeLivro.java).
@Entity(name = "GrupoVipLivroLink")
@Table(name = "grupo_vip_livro_links")
public class LivroLink extends EntidadeDaLoja {

    public String token;

    @ManyToOne
    @JoinColumn(name = "livro_id")
    public Livro livro;

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    public OffsetDateTime expiraEm;
    public int aberturas;
    public OffsetDateTime createdAt;
}
