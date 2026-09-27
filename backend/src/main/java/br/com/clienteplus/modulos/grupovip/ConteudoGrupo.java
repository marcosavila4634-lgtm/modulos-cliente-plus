package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

// Publicação de um conteúdo em um grupo.
@Entity(name = "GrupoVipConteudoGrupo")
@Table(name = "grupo_vip_conteudo_grupos")
public class ConteudoGrupo extends EntidadeDaLoja {

    public static final String PENDENTE = "pendente";
    public static final String ENVIADO = "enviado";
    public static final String MANUAL = "manual";
    public static final String FALHOU = "falhou";
    public static final String APAGADO = "apagado";

    @ManyToOne
    @JoinColumn(name = "conteudo_id")
    public Conteudo conteudo;

    @ManyToOne
    @JoinColumn(name = "grupo_id")
    public Grupo grupo;

    // tópico do grupo (grupos do Telegram no modo fórum)
    @ManyToOne
    @JoinColumn(name = "topico_id")
    public Topico topico;

    public String status;
    public String erro;
    // id do post no Telegram (editar, fixar, apagar)
    public Long telegramMessageId;
    public boolean fixado;
    public OffsetDateTime enviadoEm;
}
