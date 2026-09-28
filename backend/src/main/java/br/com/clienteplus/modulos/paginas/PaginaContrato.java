package br.com.clienteplus.modulos.paginas;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

// Formato do JSON do editor da página pública (/api/paginas/<modulo>).
// Contrato com o frontend: frontend/src/lib/pagina.ts
public final class PaginaContrato {

    private PaginaContrato() {}

    public record Versao(UUID id, OffsetDateTime publicadaEm) {}

    public record Editor(
            // o que o dono está editando; null = ainda não mexeu (o editor usa a
            // publicada ou a página padrão do módulo)
            JsonNode rascunho,
            JsonNode publicada,
            // há alterações no rascunho que ainda não estão no ar
            boolean pendente,
            OffsetDateTime publicadaEm,
            String link,
            // dados do módulo (nome, planos...) para a prévia
            Object dados,
            List<Versao> versoes) {}

    public record Salvo(boolean pendente) {}
}
