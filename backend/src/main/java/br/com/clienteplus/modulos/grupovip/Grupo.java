package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Um grupo vendido, no Telegram ou no WhatsApp.
@Entity(name = "GrupoVipGrupo")
@Table(name = "grupo_vip_grupos")
public class Grupo extends EntidadeDaLoja {

    public static final String TELEGRAM = "telegram";
    public static final String WHATSAPP = "whatsapp";

    public String nome;
    public String descricao;
    // "telegram" | "whatsapp"
    public String plataforma;
    // "blue" | "sky" | "violet" | "indigo" | "amber"
    public String cor;
    // link fixo do grupo (modo assistido)
    public String linkConvite;
    // id do grupo no Telegram (modo automático, com o robô administrador)
    public String telegramChatId;
    public boolean ativo;

    // ---------- Controle do grupo pelo robô (GestaoTelegram) ----------
    // posts do robô não podem ser encaminhados nem salvos
    public boolean protegerConteudo;
    // apaga links de quem não é administrador
    public boolean moderarLinks;
    // uma por linha
    public String palavrasProibidas;
    // 0 = só apaga a mensagem
    public int silenciarMinutos;
    // mensagem no grupo quando alguém entra; null = não manda
    public String boasVindasGrupo;
    // apaga os avisos "fulano entrou/saiu"
    public boolean apagarAvisosEntrada;
    // só administradores escrevem
    public boolean travado;
    public LocalTime travaInicio;
    public LocalTime travaFim;
    // último estado aplicado pelo horário
    public Boolean travaHorarioEstado;

    @CreationTimestamp
    public OffsetDateTime createdAt;

    // O robô cuida das entradas e saídas deste grupo?
    public boolean automatico(Config config) {
        return TELEGRAM.equals(plataforma) && config.robo() && telegramChatId != null && !telegramChatId.isBlank();
    }
}
