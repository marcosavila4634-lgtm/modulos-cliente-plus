package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;
import org.hibernate.annotations.CreationTimestamp;

// Enquete ou quiz enviado pelo robô nos grupos do Telegram.
@Entity(name = "GrupoVipEnquete")
@Table(name = "grupo_vip_enquetes")
public class Enquete extends EntidadeDaLoja {

    public String pergunta;
    // uma por linha
    public String opcoes;
    // "enquete" | "quiz"
    public String tipo;
    // posição da resposta certa (quiz)
    public Integer correta;
    public String explicacao;
    public boolean anonima;
    public boolean multipla;
    public boolean encerrada;

    @CreationTimestamp
    public OffsetDateTime createdAt;

    public List<String> listaOpcoes() {
        return Arrays.stream(opcoes.split("\n")).map(String::trim).filter(o -> !o.isEmpty()).toList();
    }
}
