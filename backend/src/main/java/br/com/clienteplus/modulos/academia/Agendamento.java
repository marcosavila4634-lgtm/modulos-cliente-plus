package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Horário marcado na agenda de um profissional.
@Entity
@Table(name = "academia_agendamentos")
public class Agendamento extends EntidadeDaLoja {

    public static final String CANCELADO = "cancelado";

    // null = compromisso interno
    @ManyToOne
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    @ManyToOne
    @JoinColumn(name = "profissional_id")
    public Profissional profissional;

    @ManyToOne
    @JoinColumn(name = "servico_id")
    public Servico servico;

    // "servico" | "avaliacao" | "outro"
    public String tipo;
    public String titulo;
    public OffsetDateTime inicio;
    public OffsetDateTime fim;
    // "agendado" | "confirmado" | "concluido" | "faltou" | "cancelado"
    public String status;
    public String observacao;

    // cobrança gerada ao concluir
    @ManyToOne
    @JoinColumn(name = "venda_id")
    public Venda venda;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
