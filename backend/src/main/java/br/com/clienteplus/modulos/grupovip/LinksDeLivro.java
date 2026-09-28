package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;

// Links temporários para ler ou baixar um livro que não vai como arquivo
// pelo Telegram (acima de 50 MB, ou o Telegram/Drive falhou).
//
//   - o link é de UMA pessoa e vale HORAS horas (depois ela pede de novo ao robô)
//   - a cada clique o sistema confere se a pessoa ainda tem acesso ao grupo
//     do livro: quem cancelou, foi bloqueado ou passou da tolerância não abre
//     mais, mesmo com o link ainda no prazo
//   - o endereço do Drive nunca aparece: o sistema busca o arquivo e entrega
//     (LivroLinkResource.java)
//
// No projeto principal: Edge Function no lugar do /api/grupo-vip/l/<token>.
@ApplicationScoped
public class LinksDeLivro {

    static final int HORAS = 24;
    private static final SecureRandom SORTE = new SecureRandom();

    @Inject
    EnderecoPublico endereco;

    @Inject
    Membros membros;

    // Cria o link e devolve o endereço.
    String criar(Livro l, Cliente c) {
        // links vencidos há mais de 1 dia não servem para nada
        LivroLink.delete("storeId = ?1 and expiraEm < ?2", l.storeId, OffsetDateTime.now().minusDays(1));
        byte[] b = new byte[18];
        SORTE.nextBytes(b);
        LivroLink link = new LivroLink();
        link.storeId = l.storeId;
        link.token = Base64.getUrlEncoder().withoutPadding().encodeToString(b);
        link.livro = l;
        link.cliente = c;
        link.createdAt = OffsetDateTime.now();
        link.expiraEm = link.createdAt.plusHours(HORAS);
        link.persist();
        return endereco.base() + "/api/grupo-vip/l/" + link.token;
    }

    // O que é preciso para entregar o arquivo (fora da transação).
    public record Arquivo(String origem, String driveId, String arquivoUrl, String nome, long tamanho, String chaveGoogle,
                          String contaGoogle) {}

    // Resultado do clique: o arquivo, ou o motivo de não abrir.
    //   motivo: "invalido" | "expirado" | "sem_acesso"
    public record Clique(Arquivo arquivo, String motivo, String titulo, String areaMembro) {}

    Clique conferir(String token) {
        LivroLink link = token == null ? null : LivroLink.<LivroLink>find("token", token).firstResult();
        if (link == null) return new Clique(null, "invalido", null, null);
        Livro l = link.livro;
        Membro m = Membro.<Membro>find("cliente", link.cliente).firstResult();
        String area = m != null ? endereco.areaMembro(m.codigo) : null;
        if (link.expiraEm.isBefore(OffsetDateTime.now())) return new Clique(null, "expirado", l.titulo, area);
        Membros.Estado e = membros.base(link.storeId).estado(link.cliente.id);
        Livro permitido = e != null && e.temAcesso() ? Biblioteca.doMembro(l, e.gruposComDireito()) : null;
        if (permitido == null) return new Clique(null, "sem_acesso", l.titulo, area);
        Config config = membros.config(link.storeId);
        link.aberturas++;
        return new Clique(new Arquivo(l.origem, l.driveId, l.arquivoUrl, l.arquivoNome, l.tamanho, config.googleApiKey,
                config.googleContaServico), null, l.titulo, area);
    }
}
