package br.com.clienteplus.modulos.artesmarciais;

import br.com.clienteplus.modulos.academia.Profissional;
import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Uma graduação (faixa ou grau) = um certificado.
@Entity(name = "ArtesMarciaisGraduacao")
@Table(name = "artes_marciais_graduacoes")
public class Graduacao extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    @ManyToOne
    @JoinColumn(name = "modalidade_id")
    public Modalidade modalidade;

    // "inicial" | "faixa" | "grau"
    public String tipo;

    @ManyToOne
    @JoinColumn(name = "faixa_id")
    public Faixa faixa;

    public int grau;

    @ManyToOne
    @JoinColumn(name = "faixa_anterior_id")
    public Faixa faixaAnterior;

    public Integer grauAnterior;
    public LocalDate data;

    @ManyToOne
    @JoinColumn(name = "professor_id")
    public Profissional professor;

    @ManyToOne
    @JoinColumn(name = "exame_id")
    public Exame exame;

    public String observacao;
    public String codigo;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
