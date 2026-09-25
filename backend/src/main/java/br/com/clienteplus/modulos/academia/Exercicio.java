package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Exercício da biblioteca da academia.
@Entity
@Table(name = "academia_exercicios")
public class Exercicio extends EntidadeDaLoja {

    public String nome;
    // "peito" | "costas" | "ombros" | "biceps" | "triceps" | "pernas" | "gluteos"
    // | "panturrilha" | "abdomen" | "cardio" | "corpo_todo" | "alongamento"
    public String grupoMuscular;
    public String equipamento;
    public String instrucoes;
    // imagem e vídeo enviados pela academia (URL do arquivo)
    public String imagemUrl;
    public String videoUrl;
    // link externo (YouTube, Vimeo...)
    public String videoLink;
    public boolean ativo;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
