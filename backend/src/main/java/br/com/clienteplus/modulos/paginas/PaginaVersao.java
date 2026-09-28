package br.com.clienteplus.modulos.paginas;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

// Versão publicada de uma página (as 20 últimas), para voltar atrás.
@Entity(name = "ModuloPaginaVersao")
@Table(name = "modulos_paginas_versoes")
public class PaginaVersao extends EntidadeDaLoja {

    public String modulo;
    public String pagina;
    public OffsetDateTime publicadaEm;
}
