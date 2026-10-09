package br.com.clienteplus.modulos.artesmarciais;

import static br.com.clienteplus.modulos.artesmarciais.Lutas.hoje;

import br.com.clienteplus.modulos.academia.Acesso;
import br.com.clienteplus.modulos.academia.Aula;
import br.com.clienteplus.modulos.academia.TurmaAluno;
import br.com.clienteplus.modulos.artesmarciais.ArtesMarciaisContrato.*;
import br.com.clienteplus.modulos.clienteplus.Assinatura;
import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.clienteplus.Pagamento;
import br.com.clienteplus.modulos.comum.Erro;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

// Comunicados: a academia escreve um aviso e escolhe o público. Cada pessoa
// recebe o texto com o próprio nome (WhatsApp: a recepção toca "Enviar" e o
// WhatsApp abre com a mensagem pronta) e o aviso aparece no mural da área do
// aluno. Alunos kids recebem pelo responsável.
@ApplicationScoped
public class Comunicacao {

    static final Set<String> PUBLICOS = Set.of("todos", "modalidade", "faixa", "aula", "inadimplentes",
            "aniversariantes", "kids", "sem_frequencia");

    @Inject
    Graduacoes graduacoes;

    record Destino(Cliente aluno, String nome, String telefone, String faixa) {}

    // Alunos (com matrícula ativa) do público escolhido.
    List<Cliente> alunos(UUID storeId, String publico, UUID filtroId) {
        List<Cliente> ativos = Assinatura.<Assinatura>list("storeId = ?1 and status = ?2", storeId, Assinatura.ATIVA)
                .stream().map(a -> a.cliente).distinct().toList();
        Set<UUID> ids = ativos.stream().map(c -> c.id).collect(Collectors.toSet());
        LocalDate hoje = hoje();
        return switch (publico) {
            case "todos" -> ativos;
            case "modalidade" -> AlunoModalidade.<AlunoModalidade>list("storeId = ?1 and ativo = true and modalidade.id = ?2",
                    storeId, filtroId).stream().map(am -> am.cliente).filter(c -> ids.contains(c.id)).distinct().toList();
            case "faixa" -> AlunoModalidade.<AlunoModalidade>list("storeId = ?1 and ativo = true and faixa.id = ?2",
                    storeId, filtroId).stream().map(am -> am.cliente).filter(c -> ids.contains(c.id)).distinct().toList();
            case "aula" -> TurmaAluno.<TurmaAluno>list("storeId = ?1 and ativo = true and horario.aula.id = ?2",
                    storeId, filtroId).stream().map(t -> t.cliente).filter(c -> ids.contains(c.id)).distinct().toList();
            case "inadimplentes" -> Pagamento.<Pagamento>list(
                            "storeId = ?1 and status = 'pendente' and vencimento < ?2 and assinatura is not null", storeId, hoje)
                    .stream().map(p -> p.cliente).filter(c -> ids.contains(c.id)).distinct().toList();
            case "aniversariantes" -> ativos.stream()
                    .filter(c -> c.dataNascimento != null && c.dataNascimento.getMonth() == hoje.getMonth())
                    .toList();
            case "kids" -> {
                int adulto = graduacoes.config(storeId).idadeAdulto;
                yield ativos.stream().filter(c -> {
                    Integer i = Lutas.idade(c);
                    return i != null && i < adulto;
                }).toList();
            }
            case "sem_frequencia" -> {
                Map<UUID, OffsetDateTime> ultima = new HashMap<>();
                for (Acesso a : Acesso.<Acesso>list("storeId = ?1 and resultado = 'liberado'", storeId)) {
                    ultima.merge(a.cliente.id, a.momento, (x, y) -> x.isAfter(y) ? x : y);
                }
                OffsetDateTime limite = OffsetDateTime.now().minusDays(14);
                yield ativos.stream().filter(c -> ultima.get(c.id) == null || ultima.get(c.id).isBefore(limite)).toList();
            }
            default -> throw Erro.invalido("Público inválido");
        };
    }

    List<Destino> destinos(UUID storeId, String publico, UUID filtroId) {
        int adulto = graduacoes.config(storeId).idadeAdulto;
        Map<UUID, Responsavel> responsavelDe = new HashMap<>();
        for (Dependente d : Dependente.<Dependente>list("storeId", storeId)) responsavelDe.putIfAbsent(d.cliente.id, d.responsavel);
        Map<UUID, String> faixaDe = new HashMap<>();
        for (AlunoModalidade am : AlunoModalidade.<AlunoModalidade>list("storeId = ?1 and ativo = true order by faixa.ordem", storeId)) {
            faixaDe.put(am.cliente.id, am.faixa.nome); // fica a mais alta
        }
        List<Destino> lista = new ArrayList<>();
        for (Cliente c : alunos(storeId, publico, filtroId)) {
            Integer idade = Lutas.idade(c);
            Responsavel r = idade != null && idade < adulto ? responsavelDe.get(c.id) : null;
            lista.add(r != null
                    ? new Destino(c, r.nome, r.telefone, faixaDe.getOrDefault(c.id, ""))
                    : new Destino(c, c.nome, c.telefone, faixaDe.getOrDefault(c.id, "")));
        }
        lista.sort(Comparator.comparing(Destino::nome, Lutas.ALFABETICA));
        return lista;
    }

    static String personalizar(String texto, Destino d, String academia) {
        String primeiro = d.aluno().nome.split(" ")[0];
        String responsavel = d.nome().split(" ")[0];
        return texto.replace("{nome}", primeiro)
                .replace("{responsavel}", responsavel)
                .replace("{faixa}", d.faixa().isEmpty() ? "" : d.faixa())
                .replace("{academia}", academia);
    }

    void conferir(UUID storeId, String publico, UUID filtroId) {
        if (publico == null || !PUBLICOS.contains(publico)) throw Erro.invalido("Escolha o público");
        if (Set.of("modalidade", "faixa", "aula").contains(publico) && filtroId == null) {
            throw Erro.invalido("Escolha " + switch (publico) {
                case "modalidade" -> "a modalidade";
                case "faixa" -> "a faixa";
                default -> "a aula";
            });
        }
    }

    public Previa previa(UUID storeId, String publico, UUID filtroId, String texto) {
        conferir(storeId, publico, filtroId);
        List<Destino> ds = destinos(storeId, publico, filtroId);
        String academia = graduacoes.nomeAcademia(storeId);
        return new Previa(ds.size(),
                ds.stream().limit(3).map(d -> personalizar(texto != null ? texto : "", d, academia)).toList(),
                (int) ds.stream().filter(d -> d.telefone() == null || d.telefone().isBlank()).count());
    }

    String filtro(Comunicado c) {
        if (c.filtroId == null) return null;
        return switch (c.publico) {
            case "modalidade" -> {
                Modalidade m = Modalidade.findById(c.filtroId);
                yield m != null ? m.nome : null;
            }
            case "faixa" -> {
                Faixa f = Faixa.findById(c.filtroId);
                yield f != null ? f.modalidade.nome + " · " + f.nome : null;
            }
            case "aula" -> {
                Aula a = Aula.findById(c.filtroId);
                yield a != null ? a.nome : null;
            }
            default -> null;
        };
    }

    ComunicadoJson json(Comunicado c) {
        List<ComunicadoEnvio> es = ComunicadoEnvio.list("comunicado", c);
        return new ComunicadoJson(c.id, c.titulo, c.texto, c.publico, filtro(c), c.whatsapp, c.mural, c.muralAte,
                c.createdAt, es.size(), (int) es.stream().filter(e -> e.enviadoEm != null).count());
    }

    public List<ComunicadoJson> lista(UUID storeId) {
        return Comunicado.<Comunicado>list("storeId = ?1 order by createdAt desc", storeId).stream().map(this::json).toList();
    }

    Comunicado comunicado(UUID storeId, UUID id) {
        Comunicado c = id != null ? Comunicado.findById(id) : null;
        if (c == null || !c.storeId.equals(storeId)) throw Erro.naoEncontrado("Comunicado não encontrado");
        return c;
    }

    public ComunicadoDetalhe detalhe(UUID storeId, UUID id) {
        Comunicado c = comunicado(storeId, id);
        List<EnvioJson> es = ComunicadoEnvio.<ComunicadoEnvio>list("comunicado = ?1 order by nome", c).stream()
                .map(e -> new EnvioJson(e.id, e.cliente.id, e.cliente.nome, e.nome, e.telefone, e.texto, e.enviadoEm))
                .toList();
        return new ComunicadoDetalhe(json(c), es);
    }

    @Transactional
    public Comunicado criar(UUID storeId, DadosComunicado d) {
        if (d == null) throw Erro.invalido("Dados do comunicado");
        conferir(storeId, d.publico(), d.filtroId());
        boolean whatsapp = !Boolean.FALSE.equals(d.whatsapp());
        boolean mural = !Boolean.FALSE.equals(d.mural());
        if (!whatsapp && !mural) throw Erro.invalido("Escolha WhatsApp, mural ou os dois");
        Comunicado c = new Comunicado();
        c.storeId = storeId;
        c.titulo = Lutas.obrigatorio(d.titulo(), "Dê um título para o aviso");
        c.texto = Lutas.obrigatorio(d.texto(), "Escreva a mensagem");
        if (c.texto.length() > 2000) throw Erro.invalido("Mensagem muito longa (até 2000 letras)");
        c.publico = d.publico();
        c.filtroId = d.filtroId();
        c.whatsapp = whatsapp;
        c.mural = mural;
        c.muralAte = mural ? d.muralAte() : null;
        c.persist();

        List<Destino> ds = destinos(storeId, c.publico, c.filtroId);
        if (ds.isEmpty()) throw Erro.conflito("Ninguém se encaixa nesse público agora");
        if (whatsapp) {
            String academia = graduacoes.nomeAcademia(storeId);
            // um envio por telefone (irmãos com o mesmo responsável recebem uma vez)
            Map<String, Destino> porTelefone = new LinkedHashMap<>();
            for (Destino x : ds) porTelefone.putIfAbsent(x.telefone() != null ? x.telefone() : "sem:" + x.aluno().id, x);
            for (Destino x : porTelefone.values()) {
                ComunicadoEnvio e = new ComunicadoEnvio();
                e.storeId = storeId;
                e.comunicado = c;
                e.cliente = x.aluno();
                e.nome = x.nome();
                e.telefone = x.telefone();
                e.texto = personalizar(c.texto, x, academia);
                e.persist();
            }
        }
        return c;
    }

    @Transactional
    public void marcarEnviado(UUID storeId, UUID comunicadoId, UUID envioId, boolean enviado) {
        Comunicado c = comunicado(storeId, comunicadoId);
        ComunicadoEnvio e = ComunicadoEnvio.findById(envioId);
        if (e == null || !e.comunicado.id.equals(c.id)) throw Erro.naoEncontrado("Envio não encontrado");
        e.enviadoEm = enviado ? OffsetDateTime.now() : null;
    }

    @Transactional
    public void excluir(UUID storeId, UUID id) {
        Comunicado c = comunicado(storeId, id);
        ComunicadoEnvio.delete("comunicado", c);
        c.delete();
    }

    // Mural da área do aluno: avisos no mural ainda válidos (últimos 60 dias).
    public List<AvisoMural> mural(UUID storeId, Cliente aluno) {
        LocalDate hoje = hoje();
        OffsetDateTime desde = OffsetDateTime.now().minusDays(60);
        String academia = graduacoes.nomeAcademia(storeId);
        List<AvisoMural> lista = new ArrayList<>();
        for (Comunicado c : Comunicado.<Comunicado>list("storeId = ?1 and mural = true and createdAt >= ?2 order by createdAt desc",
                storeId, desde)) {
            if (c.muralAte != null && c.muralAte.isBefore(hoje)) continue;
            if (aluno != null && !"todos".equals(c.publico)
                    && alunos(storeId, c.publico, c.filtroId).stream().noneMatch(x -> x.id.equals(aluno.id))) {
                continue;
            }
            // texto já com o nome do aluno (no mural do responsável, sem o nome)
            String texto = c.texto.replace("{academia}", academia).replace("{faixa}", "").replace("{responsavel}", "");
            texto = aluno != null ? texto.replace("{nome}", aluno.nome.split(" ")[0])
                    : texto.replace(", {nome}", "").replace(" {nome}", "").replace("{nome}", "");
            lista.add(new AvisoMural(c.id, c.titulo, texto, c.createdAt));
        }
        return lista;
    }
}
