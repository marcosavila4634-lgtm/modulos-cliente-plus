package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Conteúdo publicado nos grupos e/ou na biblioteca da área do membro.
@Entity(name = "GrupoVipConteudo")
@Table(name = "grupo_vip_conteudos")
public class Conteudo extends EntidadeDaLoja {

    public static final String RASCUNHO = "rascunho";
    public static final String AGENDADO = "agendado";
    public static final String PUBLICADO = "publicado";

    @ManyToOne
    @JoinColumn(name = "categoria_id")
    public Categoria categoria;

    public String titulo;
    public String texto;
    public String midiaUrl;
    // "imagem" | "video"
    public String midiaTipo;
    public String link;
    // com link: vira botão no post do Telegram
    public String botaoTexto;
    // fixa o post no topo dos grupos do Telegram
    public boolean fixar;
    public String status;
    public OffsetDateTime agendadoPara;
    public OffsetDateTime publicadoEm;
    public boolean naAreaMembro;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
