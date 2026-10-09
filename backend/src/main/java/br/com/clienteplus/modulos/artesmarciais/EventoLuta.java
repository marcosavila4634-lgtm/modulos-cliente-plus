package br.com.clienteplus.modulos.artesmarciais;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Campeonato, seminário, aulão ou confraternização.
@Entity(name = "ArtesMarciaisEventoLuta")
@Table(name = "artes_marciais_eventos")
public class EventoLuta extends EntidadeDaLoja {

    // "campeonato" | "seminario" | "aulao" | "confraternizacao" | "outro"
    public String tipo;
    public String nome;
    public String descricao;

    @ManyToOne
    @JoinColumn(name = "modalidade_id")
    public Modalidade modalidade;

    public LocalDate data;
    public LocalTime hora;
    public String local;
    public String organizador;
    public BigDecimal valorInscricao;
    public Integer vagas;
    public LocalDate inscricoesAte;
    public boolean participaIndicacoes;
    public boolean abertoNoApp;
    // "ativo" | "cancelado"
    public String status;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
