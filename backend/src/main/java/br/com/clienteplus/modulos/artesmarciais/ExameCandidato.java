package br.com.clienteplus.modulos.artesmarciais;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.clienteplus.Pagamento;
import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

// Aluno inscrito num exame de faixa.
@Entity(name = "ArtesMarciaisExameCandidato")
@Table(name = "artes_marciais_exame_candidatos")
public class ExameCandidato extends EntidadeDaLoja {

    @ManyToOne
    @JoinColumn(name = "exame_id")
    public Exame exame;

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    public Cliente cliente;

    @ManyToOne
    @JoinColumn(name = "faixa_id")
    public Faixa faixa;

    public int grau;

    @ManyToOne
    @JoinColumn(name = "pagamento_id")
    public Pagamento pagamento;

    // "pendente" | "aprovado" | "reprovado"
    public String resultado;
    public String observacao;

    @ManyToOne
    @JoinColumn(name = "graduacao_id")
    public Graduacao graduacao;
}
