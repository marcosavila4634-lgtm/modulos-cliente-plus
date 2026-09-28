package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

// Em que passo do menu a pessoa está na conversa com o robô (Atendente.java).
@Entity(name = "GrupoVipConversa")
@Table(name = "grupo_vip_robo_conversas")
public class Conversa extends EntidadeDaLoja {

    public long telegramId;
    // o que o robô espera a pessoa escrever: "busca_nome" | "busca_autor" | "sugestao" | "suporte" | null
    public String etapa;
    // última lista de livros mostrada (para as páginas), ex.: "autor|machado"
    public String lista;
    public OffsetDateTime atualizadoEm;
}
