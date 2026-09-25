package br.com.clienteplus.modulos.comum;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import java.util.UUID;

// Base das tabelas dos módulos: toda linha tem um id (uuid) e pertence a uma
// loja (store_id = o lojista dono dos dados).
@MappedSuperclass
public abstract class EntidadeDaLoja extends PanacheEntityBase {

    @Id
    @GeneratedValue
    public UUID id;

    public UUID storeId;
}
