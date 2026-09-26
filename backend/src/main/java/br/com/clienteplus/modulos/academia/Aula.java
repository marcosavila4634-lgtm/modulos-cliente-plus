package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import org.hibernate.annotations.CreationTimestamp;

// Aula coletiva (spinning, funcional, yoga...).
@Entity
@Table(name = "academia_aulas")
public class Aula extends EntidadeDaLoja {

    public String nome;
    public String descricao;

    @ManyToOne
    @JoinColumn(name = "professor_id")
    public Profissional professor;

    public String sala;
    public int capacidade;
    public int duracaoMinutos;
    // nome da cor no painel: "violeta", "azul", "verde", "laranja", "rosa", "ciano"
    public String cor;
    public boolean ativo;

    @OneToMany(mappedBy = "aula", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("diaSemana, horaInicio")
    public List<AulaHorario> horarios = new ArrayList<>();

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
