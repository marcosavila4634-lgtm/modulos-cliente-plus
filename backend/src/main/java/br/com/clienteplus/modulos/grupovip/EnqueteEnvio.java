package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

// Envio de uma enquete a um grupo, com os votos (atualizados pelo robô).
@Entity(name = "GrupoVipEnqueteEnvio")
@Table(name = "grupo_vip_enquete_envios")
public class EnqueteEnvio extends EntidadeDaLoja {

    public static final String ENVIADA = "enviada";
    public static final String FALHOU = "falhou";
    public static final String ENCERRADA = "encerrada";

    @ManyToOne
    @JoinColumn(name = "enquete_id")
    public Enquete enquete;

    @ManyToOne
    @JoinColumn(name = "grupo_id")
    public Grupo grupo;

    @ManyToOne
    @JoinColumn(name = "topico_id")
    public Topico topico;

    public String status;
    public String erro;
    public Long telegramMessageId;
    public String telegramPollId;
    // quantidade por opção, separadas por ";"
    public String votos;
    public int totalVotos;
    public OffsetDateTime enviadaEm;
}
