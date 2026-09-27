package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

// Mensagem enviada para um público de membros.
@Entity(name = "GrupoVipAnuncio")
@Table(name = "grupo_vip_anuncios")
public class Anuncio extends EntidadeDaLoja {

    public String titulo;
    public String texto;
    // "conteudo" | "manutencao" | "live" | "material" | "promocao"
    public String tipo;
    // "todos" | "em_dia" | "atrasados" | "sem_acesso" | "plano" | "grupo" | "novos"
    public String publico;
    public UUID publicoRef;
    public int destinatarios;
    public boolean postadoNosGrupos;
    public OffsetDateTime enviadoEm;
}
