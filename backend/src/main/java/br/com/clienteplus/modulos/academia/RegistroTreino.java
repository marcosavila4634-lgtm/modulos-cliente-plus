package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Um exercício que o aluno marcou como feito num dia, com a carga usada.
@Entity
@Table(name = "academia_treino_registros")
public class RegistroTreino extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    @ManyToOne
    @JoinColumn(name = "ficha_id")
    public Ficha ficha;

    @ManyToOne
    @JoinColumn(name = "exercicio_id")
    public Exercicio exercicio;

    public String treinoLetra;
    public LocalDate data;
    public boolean feito;
    public BigDecimal cargaKg;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
