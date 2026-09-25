package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

// Um exercício dentro de uma divisão da ficha, com séries, repetições etc.
@Entity
@Table(name = "academia_ficha_exercicios")
public class FichaExercicio extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "treino_id")
    public FichaTreino treino;

    @ManyToOne
    @JoinColumn(name = "exercicio_id")
    public Exercicio exercicio;

    public int ordem;
    public Integer series;
    // "10 a 12", "até a falha", "30 s"
    public String repeticoes;
    // "20 kg", "moderada"
    public String carga;
    public Integer descansoSegundos;
    public String observacao;
}
