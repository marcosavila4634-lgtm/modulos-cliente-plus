package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

// Uma mensagem da caixa de saída.
@Entity(name = "GrupoVipMensagem")
@Table(name = "grupo_vip_mensagens")
public class Mensagem extends EntidadeDaLoja {

    public static final String PENDENTE = "pendente";
    public static final String ENVIADA = "enviada";
    public static final String FALHOU = "falhou";
    public static final String DESCARTADA = "descartada";

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    public String tipo;
    // "telegram" | "whatsapp"
    public String canal;
    public String texto;
    public String status;
    public String erro;
    // evita repetir a mesma mensagem automática
    public String chave;
    public OffsetDateTime criadaEm;
    public OffsetDateTime enviadaEm;
}
