package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;

// Aluno fixo de um horário de aula (a turma).
@Entity
@Table(name = "academia_turma_alunos")
public class TurmaAluno extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "horario_id")
    public AulaHorario horario;

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    public LocalDate desde;
    public boolean ativo;
}
