package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Resgate de um benefício por um aluno.
@Entity
@Table(name = "academia_beneficio_resgates")
public class Resgate extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "beneficio_id")
    public Beneficio beneficio;

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    // "" (uma vez só), "2026" (por ano) ou "2026-09" (por mês)
    public String referencia;
    // "recepcao" | "area_cliente"
    public String origem;
    // null = resgatado, falta entregar
    public OffsetDateTime entregueEm;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
