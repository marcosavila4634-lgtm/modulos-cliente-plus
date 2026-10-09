package br.com.clienteplus.modulos.artesmarciais;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

// Uma mensagem de um comunicado para uma pessoa.
@Entity(name = "ArtesMarciaisComunicadoEnvio")
@Table(name = "artes_marciais_comunicado_envios")
public class ComunicadoEnvio extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "comunicado_id")
    public Comunicado comunicado;

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    public String nome;
    public String telefone;
    public String texto;
    public OffsetDateTime enviadoEm;
}
