package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Livro (arquivo) da biblioteca de um grupo.
@Entity(name = "GrupoVipLivro")
@Table(name = "grupo_vip_livros")
public class Livro extends EntidadeDaLoja {

    public static final String DRIVE = "drive";
    public static final String COMPUTADOR = "computador";
    public static final String TELEGRAM = "telegram";

    @ManyToOne
    @JoinColumn(name = "grupo_id")
    public Grupo grupo;

    public String titulo;
    public String arquivoNome;
    // bytes
    public long tamanho;
    // "drive" | "computador" | "telegram" (copiado de outro grupo; md5 = "tg:<file_unique_id>")
    public String origem;
    public String driveId;
    // arquivo enviado pelo painel (guardado no servidor)
    public String arquivoUrl;
    public String md5;
    // guardado no 1º envio; o robô reenvia sem subir de novo
    public String telegramFileId;
    public int pedidos;

    // ---------- Dados do livro (Catalogador) ----------
    public String autor;
    // subpasta do Drive (ou o dono escolhe)
    public String categoria;
    public String genero;
    public String sinopse;
    public String capaUrl;
    public Integer ano;
    // "pendente" | "ok" | "nao_encontrado" | "manual"
    public String dadosStatus = PENDENTE;

    public static final String PENDENTE = "pendente";
    public static final String OK = "ok";
    public static final String NAO_ENCONTRADO = "nao_encontrado";
    public static final String MANUAL = "manual";

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
