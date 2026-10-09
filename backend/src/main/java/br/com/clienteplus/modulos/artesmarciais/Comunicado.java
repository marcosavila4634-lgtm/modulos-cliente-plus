package br.com.clienteplus.modulos.artesmarciais;

import br.com.clienteplus.modulos.comum.EntidadeDaLoja;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import org.hibernate.annotations.CreationTimestamp;

// Aviso por WhatsApp e/ou no mural da área do aluno.
@Entity(name = "ArtesMarciaisComunicado")
@Table(name = "artes_marciais_comunicados")
public class Comunicado extends EntidadeDaLoja {

    public String titulo;
    public String texto;
    public String publico;
    public java.util.UUID filtroId;
    public boolean whatsapp;
    public boolean mural;
    public LocalDate muralAte;

    @CreationTimestamp
    public OffsetDateTime createdAt;
}
