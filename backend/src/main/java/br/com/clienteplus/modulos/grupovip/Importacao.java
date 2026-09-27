package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Envio em massa de livros (pasta do Drive ou arquivos do computador) para um grupo.
@Entity(name = "GrupoVipImportacao")
@Table(name = "grupo_vip_importacoes")
public class Importacao extends EntidadeDaLoja {

    public static final String RECEBENDO = "recebendo";
    public static final String LISTANDO = "listando";
    public static final String ENVIANDO = "enviando";
    public static final String PAUSADA = "pausada";
    public static final String CONCLUIDA = "concluida";
    public static final String FALHOU = "falhou";

    @ManyToOne
    @JoinColumn(name = "grupo_id")
    public Grupo grupo;

    @ManyToOne
    @JoinColumn(name = "topico_id")
    public Topico topico;

    // "drive" | "computador" | "telegram" (acervo de outro grupo)
    public String origem;

    // telegram: grupo de onde o acervo é copiado
    @ManyToOne
    @JoinColumn(name = "origem_grupo_id")
    public Grupo origemGrupo;

    // telegram: também fotos, vídeos e áudios (senão, só documentos)
    public boolean copiarMidias;
    // telegram: mensagens lidas do grupo de origem (da primeira até a última)
    public Long varreduraDe;
    public Long varreduraAte;
    public Long varreduraAtual;
    // mensagens que o Telegram não deixou copiar (conteúdo protegido)
    public int protegidas;
    public String pastaUrl;
    public String pastaNome;
    // false: só entra na biblioteca do robô
    public boolean postarNoGrupo;
    public String status;
    public String erro;
    // respeita o limite de envios do Telegram
    public OffsetDateTime proximoEm;

    @CreationTimestamp
    public OffsetDateTime createdAt;

    public OffsetDateTime concluidaEm;
}
