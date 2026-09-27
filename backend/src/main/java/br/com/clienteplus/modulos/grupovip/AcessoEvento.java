package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

// Histórico de entradas e saídas.
@Entity(name = "GrupoVipAcessoEvento")
@Table(name = "grupo_vip_acesso_eventos")
public class AcessoEvento extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "grupo_id")
    public Grupo grupo;

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    // "convite" | "entrou" | "removido" | "recusado"
    public String acao;
    public boolean automatico;
    public String detalhe;
    public OffsetDateTime momento;
}
