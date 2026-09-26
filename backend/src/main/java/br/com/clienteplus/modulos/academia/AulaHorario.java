package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalTime;

// Um horário da aula na semana (1 = segunda ... 7 = domingo).
@Entity
@Table(name = "academia_aula_horarios")
public class AulaHorario extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "aula_id")
    public Aula aula;

    public int diaSemana;
    public LocalTime horaInicio;
    // false = tirado da grade (a linha fica por causa do histórico)
    public boolean ativo;
}
