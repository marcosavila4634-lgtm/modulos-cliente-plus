package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Benefício oferecido aos alunos.
@Entity
@Table(name = "academia_beneficios")
public class Beneficio extends EntidadeDaLoja {

    public String titulo;
    public String descricao;
    // "parceiro" | "indicacao" | "fidelidade" | "aniversario" | "frequencia"
    public String tipo;
    // indicados / meses / check-ins, conforme o tipo
    public Integer regra;
    public String recompensa;
    public String parceiro;
    // cupom
    public String codigo;
    // null = sem prazo
    public LocalDate validade;
    public boolean ativo;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
