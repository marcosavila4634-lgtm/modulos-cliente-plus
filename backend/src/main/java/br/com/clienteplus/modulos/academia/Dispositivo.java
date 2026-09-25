package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Catraca, leitor facial/biométrico ou totem de QR code.
@Entity
@Table(name = "academia_dispositivos")
public class Dispositivo extends EntidadeDaLoja {

    public String nome;
    // "catraca" | "leitor_facial" | "leitor_biometrico" | "totem_qr"
    public String tipo;
    public String fabricante;
    // número de série / IP
    public String identificador;
    // identifica o dispositivo quando ele chama a API de acesso
    public String token;
    public boolean ativo;
    public OffsetDateTime ultimoContato;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
