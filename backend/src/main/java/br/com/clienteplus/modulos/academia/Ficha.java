package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

// Ficha de treino. Sem aluno (cliente) = modelo reaproveitável.
@Entity
@Table(name = "academia_fichas")
public class Ficha extends EntidadeDaLoja {

    public static final String ATIVA = "ativa";
    public static final String ENCERRADA = "encerrada";

    // aluno dono da ficha; null = modelo
    @ManyToOne
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    // modelo de onde a ficha foi copiada
    public UUID modeloOrigemId;

    public String nome;
    public String objetivo;
    public String observacoes;

    @ManyToOne
    @JoinColumn(name = "professor_id")
    public Profissional professor;

    public LocalDate inicio;
    public LocalDate validade;
    public String status;

    @OneToMany(mappedBy = "ficha", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordem")
    public List<FichaTreino> treinos = new ArrayList<>();

    @CreationTimestamp
    public OffsetDateTime createdAt;

    @UpdateTimestamp
    public OffsetDateTime updatedAt;

    public boolean modelo() {
        return cliente == null;
    }
}
