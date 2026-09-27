package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

// Um arquivo de um envio em massa.
@Entity(name = "GrupoVipImportacaoItem")
@Table(name = "grupo_vip_importacao_itens")
public class ImportacaoItem extends EntidadeDaLoja {

    public static final String PENDENTE = "pendente";
    public static final String ENVIADO = "enviado";
    public static final String PULADO = "pulado";
    public static final String GRANDE_DEMAIS = "grande_demais";
    public static final String FALHOU = "falhou";

    @ManyToOne
    @JoinColumn(name = "importacao_id")
    public Importacao importacao;

    @ManyToOne
    @JoinColumn(name = "livro_id")
    public Livro livro;

    // telegram: mensagem no grupo de origem (copiada com copyMessage)
    public Long origemMensagemId;
    public String arquivoNome;
    public long tamanho;
    public int ordem;
    public String status;
    public String erro;
    // post no grupo (para apagar junto com o livro)
    public Long telegramMessageId;
    public OffsetDateTime enviadoEm;
}
