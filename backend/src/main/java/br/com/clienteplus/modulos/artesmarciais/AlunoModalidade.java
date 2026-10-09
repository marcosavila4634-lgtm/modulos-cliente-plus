package br.com.clienteplus.modulos.artesmarciais;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Aluno em uma modalidade: faixa e grau atuais.
@Entity(name = "ArtesMarciaisAlunoModalidade")
@Table(name = "artes_marciais_alunos")
public class AlunoModalidade extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    @ManyToOne
    @JoinColumn(name = "modalidade_id")
    public Modalidade modalidade;

    @ManyToOne
    @JoinColumn(name = "faixa_id")
    public Faixa faixa;

    public int grau;
    public LocalDate inicio;
    public LocalDate faixaDesde;
    public LocalDate grauDesde;
    public boolean ativo;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
