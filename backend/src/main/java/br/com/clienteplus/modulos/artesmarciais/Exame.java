package br.com.clienteplus.modulos.artesmarciais;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Exame de faixa.
@Entity(name = "ArtesMarciaisExame")
@Table(name = "artes_marciais_exames")
public class Exame extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "modalidade_id")
    public Modalidade modalidade;

    public String titulo;
    public LocalDate data;
    public LocalTime hora;
    public String local;
    public String banca;
    // "agendado" | "realizado" | "cancelado"
    public String status;
    public String observacao;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
