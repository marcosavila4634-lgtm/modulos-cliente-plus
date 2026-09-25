package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

// Uma entrada na academia (resultado "liberado" = check-in) ou uma tentativa
// bloqueada vinda de um dispositivo.
@Entity
@Table(name = "academia_acessos")
public class Acesso extends EntidadeDaLoja {

    public static final String LIBERADO = "liberado";
    public static final String BLOQUEADO = "bloqueado";

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    public OffsetDateTime momento;
    // "recepcao" | "catraca" | "leitor_facial" | "leitor_biometrico" | "totem_qr" | "app"
    public String meio;

    @ManyToOne
    @JoinColumn(name = "dispositivo_id")
    public Dispositivo dispositivo;

    public String resultado;
    // "sem_matricula" | "inadimplente" | "fora_do_horario" | "bloqueio_manual"
    public String motivo;
    public boolean liberadoManual;
    public String observacao;
}
