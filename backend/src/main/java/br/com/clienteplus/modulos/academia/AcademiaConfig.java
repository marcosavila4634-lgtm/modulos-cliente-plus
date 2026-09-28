package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import org.hibernate.annotations.UpdateTimestamp;

// Configurações da academia (uma por loja). Criada com os valores padrão na
// primeira vez que é lida (Configuracoes.config).
@Entity
@Table(name = "academia_config")
public class AcademiaConfig extends EntidadeDaLoja {

    public String telefone;
    public String email;
    public String endereco;
    public String cnpj;
    // só números, com DDD: botões de WhatsApp da página pública
    public String whatsapp;
    // página pública: /a/<slug> (criado com o nome da academia na 1ª leitura)
    public String slug;
    // pessoas ao mesmo tempo (base da ocupação nos horários de pico)
    public int capacidade = 80;

    public boolean bloquearInadimplentes = true;
    public int toleranciaAtrasoDias = 5;
    public boolean bloquearForaDoHorario = true;
    // entrada repetida dentro deste intervalo não conta como novo check-in
    public int intervaloCheckinMinutos = 60;

    public int validadeFichaSemanas = 8;
    public int reavaliacaoDias = 90;

    @UpdateTimestamp
    public OffsetDateTime updatedAt;
}
