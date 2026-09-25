package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalTime;

// Horário de funcionamento de um dia da semana (1 = segunda ... 7 = domingo).
@Entity
@Table(name = "academia_horarios")
public class HorarioFuncionamento extends EntidadeDaLoja {

    public int diaSemana;
    public LocalTime abre;
    public LocalTime fecha;
    public boolean fechado;

    public boolean abertoAs(LocalTime hora) {
        if (fechado || abre == null || fecha == null) return false;
        return !hora.isBefore(abre) && hora.isBefore(fecha);
    }
}
