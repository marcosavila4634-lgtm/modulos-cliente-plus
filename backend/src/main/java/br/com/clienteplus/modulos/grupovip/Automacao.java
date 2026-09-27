package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

// Texto e regra de uma mensagem automática.
@Entity(name = "GrupoVipAutomacao")
@Table(name = "grupo_vip_automacoes")
public class Automacao extends EntidadeDaLoja {

    // "boas_vindas" | "lembrete" | "vencido" | "remocao" | "reconquista" | "aniversario" | "live"
    public String tipo;
    public boolean ativa;
    public int dias;
    public String texto;
}
