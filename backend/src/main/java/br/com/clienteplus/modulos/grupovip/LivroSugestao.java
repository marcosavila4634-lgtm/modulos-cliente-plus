package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

// Livro que um membro pediu para adicionar à biblioteca (menu do robô).
@Entity(name = "GrupoVipLivroSugestao")
@Table(name = "grupo_vip_livro_sugestoes")
public class LivroSugestao extends EntidadeDaLoja {

    public static final String PENDENTE = "pendente";
    public static final String ADICIONADO = "adicionado";
    public static final String RECUSADO = "recusado";

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    public String titulo;
    public String autor;
    // "pendente" | "adicionado" | "recusado"
    public String status;

    // o livro que atendeu o pedido
    @ManyToOne
    @JoinColumn(name = "livro_id")
    public Livro livro;

    public OffsetDateTime createdAt;
    public OffsetDateTime respondidaEm;
}
