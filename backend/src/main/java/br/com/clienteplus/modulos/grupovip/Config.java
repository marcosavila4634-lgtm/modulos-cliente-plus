package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Dados do negócio, página de vendas, Pix e robô do Telegram (1 por loja).
@Entity(name = "GrupoVipConfig")
@Table(name = "grupo_vip_config")
public class Config extends EntidadeDaLoja {

    public String nomeNegocio;
    // página de vendas: /g/<slug>
    public String slug;
    public String descricaoPagina;
    // um benefício por linha
    public String beneficios;
    public String fotoCapa;
    public String gestorNome;
    public String gestorSobrenome;
    public String gestorCargo;
    public String frase;
    public String fraseDestaque;
    // dias de atraso antes de perder o acesso
    public int toleranciaDias;
    public String chavePix;
    public String nomeRecebedor;
    public String cidadeRecebedor;
    public String whatsappSuporte;
    // SEGREDO: nunca vai para o navegador
    public String telegramBotToken;
    public String telegramBotUsuario;
    public long telegramUltimoUpdate;
    // Telegram do dono (recebe as mensagens de apoio da cópia entre grupos)
    public Long telegramDonoId;
    // código do link que liga o Telegram do dono (/start dono_<codigo>)
    public String telegramDonoCodigo;
    // SEGREDO: chave do Google para ler pastas públicas do Drive (Biblioteca)
    public String googleApiKey;

    @CreationTimestamp
    public OffsetDateTime createdAt;

    public boolean robo() {
        return telegramBotToken != null && !telegramBotToken.isBlank();
    }
}
