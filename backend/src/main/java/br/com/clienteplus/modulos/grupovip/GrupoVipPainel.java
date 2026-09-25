package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

// Cabeçalho do painel: grupo em destaque, gestor, frases e notificações.
@Entity
@Table(name = "grupo_vip_painel")
public class GrupoVipPainel extends EntidadeDaLoja {

    public String nomeGrupoAtual;
    public String gestorNome;
    public String gestorSobrenome;
    public String gestorCargo;
    public String frase;
    public String fraseDestaque;
    public int notificacoes;
}
