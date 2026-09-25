package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;

// Uma divisão da ficha: Treino A, B, C...
@Entity
@Table(name = "academia_ficha_treinos")
public class FichaTreino extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "ficha_id")
    public Ficha ficha;

    public String letra;
    public String nome;
    public int ordem;

    @OneToMany(mappedBy = "treino", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordem")
    public List<FichaExercicio> exercicios = new ArrayList<>();
}
