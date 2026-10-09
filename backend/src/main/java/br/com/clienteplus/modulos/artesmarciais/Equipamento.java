package br.com.clienteplus.modulos.artesmarciais;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Equipamento da academia.
@Entity(name = "ArtesMarciaisEquipamento")
@Table(name = "artes_marciais_equipamentos")
public class Equipamento extends EntidadeDaLoja {

    public String nome;
    public String categoria;
    public int quantidade;
    public String local;
    // "bom" | "atencao" | "manutencao" | "inativo"
    public String estado;
    public Integer intervaloManutencaoDias;
    public LocalDate ultimaManutencao;
    public LocalDate aquisicao;
    public BigDecimal valor;
    public String observacao;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
