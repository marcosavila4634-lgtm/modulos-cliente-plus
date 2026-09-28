package br.com.clienteplus.modulos.paginas;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import org.hibernate.annotations.UpdateTimestamp;

// Página pública personalizada de um módulo (uma por loja e módulo).
@Entity(name = "ModuloPagina")
@Table(name = "modulos_paginas")
public class Pagina extends EntidadeDaLoja {

    public String modulo;
    // JSON (formato em frontend/src/lib/pagina.ts)
    public String rascunho;
    public String publicada;
    public OffsetDateTime publicadaEm;

    @UpdateTimestamp
    public OffsetDateTime updatedAt;
}
