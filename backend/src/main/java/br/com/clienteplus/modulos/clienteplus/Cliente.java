package br.com.clienteplus.modulos.clienteplus;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Cliente do lojista. No módulo Academia, é o aluno.
@Entity
@Table(name = "cp_clientes")
public class Cliente extends EntidadeDaLoja {

    public String nome;
    public String email;
    // só números, com DDD
    public String telefone;
    // só números
    public String cpf;
    public LocalDate dataNascimento;

    // quem indicou este cliente (programa de indicações)
    @ManyToOne
    @JoinColumn(name = "indicado_por_id")
    public Cliente indicadoPor;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
