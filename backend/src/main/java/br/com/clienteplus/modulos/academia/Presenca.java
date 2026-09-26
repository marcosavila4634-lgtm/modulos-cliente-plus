package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Reserva avulsa de uma aula numa data e/ou a chamada daquele dia.
@Entity
@Table(name = "academia_aula_presencas")
public class Presenca extends EntidadeDaLoja {

    public static final String RESERVADO = "reservado";
    public static final String PRESENTE = "presente";
    public static final String FALTOU = "faltou";
    public static final String CANCELADO = "cancelado";

    @ManyToOne
    @JoinColumn(name = "horario_id")
    public AulaHorario horario;

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    public LocalDate data;
    // false = aluno fixo da turma (a linha guarda só a chamada)
    public boolean avulso;
    public String status;
    // "recepcao" | "area_cliente"
    public String origem;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
