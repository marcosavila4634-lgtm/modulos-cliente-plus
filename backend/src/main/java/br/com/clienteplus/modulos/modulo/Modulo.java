package br.com.clienteplus.modulos.modulo;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;

// Tabela "modulos": catálogo dos módulos do laboratório.
// Contrato com o frontend: frontend/src/lib/api.ts (tipo Modulo).
@Entity
@Table(name = "modulos")
public class Modulo extends PanacheEntityBase {

    @Id
    @GeneratedValue
    public UUID id;

    public String slug;
    public String nome;
    public String segmento;
    public String descricao;

    // "planejado" | "em_desenvolvimento" | "pronto_para_migrar" | "migrado"
    public String status;

    @CreationTimestamp
    @JsonProperty("created_at")
    public OffsetDateTime createdAt;
}
