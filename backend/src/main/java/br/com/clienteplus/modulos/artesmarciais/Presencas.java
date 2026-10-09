package br.com.clienteplus.modulos.artesmarciais;

import static br.com.clienteplus.modulos.artesmarciais.Lutas.hoje;
import static br.com.clienteplus.modulos.artesmarciais.Lutas.ref;

import br.com.clienteplus.modulos.academia.AcessoContrato.ResultadoAcesso;
import br.com.clienteplus.modulos.academia.Acessos;
import br.com.clienteplus.modulos.academia.AgendaContrato.AulaNaData;
import br.com.clienteplus.modulos.academia.AulaHorario;
import br.com.clienteplus.modulos.academia.Aulas;
import br.com.clienteplus.modulos.academia.Presenca;
import br.com.clienteplus.modulos.academia.TurmaAluno;
import br.com.clienteplus.modulos.artesmarciais.ArtesMarciaisContrato.*;
import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.Erro;
import br.com.clienteplus.modulos.grupovip.EnderecoPublico;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

// Presença: aulas de hoje, QR Code de presença (o aluno aponta o celular,
// digita o CPF e escolhe a aula), ranking do mês e conquistas.
//
// A presença pelo QR marca "presente" na aula (conta para a faixa) e registra
// a entrada (check-in), com as mesmas regras de bloqueio do Controle de acesso.
@ApplicationScoped
public class Presencas {

    @Inject
    Aulas aulas;

    @Inject
    Acessos acessos;

    @Inject
    Graduacoes graduacoes;

    @Inject
    EnderecoPublico endereco;

    public String linkPresenca(UUID storeId) {
        return endereco.base() + "/presenca/" + graduacoes.config(storeId).codigoPresenca;
    }

    // ---------- Aulas de hoje ----------

    public List<AulaDeHoje> aulasDeHoje(UUID storeId) {
        LocalDate hoje = hoje();
        Map<UUID, Modalidade> modalidadePorAula = new HashMap<>();
        for (AulaModalidade am : AulaModalidade.<AulaModalidade>list("storeId", storeId)) {
            modalidadePorAula.put(am.aula.id, am.modalidade);
        }
        Map<UUID, Integer> presentes = new HashMap<>();
        for (Presenca p : Presenca.<Presenca>list("storeId = ?1 and data = ?2 and status = 'presente'", storeId, hoje)) {
            presentes.merge(p.horario.id, 1, Integer::sum);
        }
        OffsetDateTime agora = OffsetDateTime.now();
        List<AulaDeHoje> lista = new ArrayList<>();
        boolean proximaMarcada = false;
        for (AulaNaData a : aulas.entre(storeId, hoje, hoje, null)) {
            String status;
            if (a.fim().isBefore(agora)) status = "concluida";
            else if (!a.inicio().isAfter(agora)) status = "em_andamento";
            else if (!proximaMarcada) {
                status = "proxima";
                proximaMarcada = true;
            } else status = "agendada";
            lista.add(new AulaDeHoje(a.horarioId(), a.nome(), ref(modalidadePorAula.get(a.aulaId())), a.hora(),
                    a.fim().atZoneSameInstant(br.com.clienteplus.modulos.comum.Formatos.FUSO).toLocalTime().toString(),
                    a.sala(), a.professor() != null ? a.professor().nome() : null, a.ocupados(), a.capacidade(),
                    presentes.getOrDefault(a.horarioId(), 0), status));
        }
        return lista;
    }

    public PainelPresenca painel(UUID storeId) {
        List<AulaDeHoje> hoje = aulasDeHoje(storeId);
        return new PainelPresenca(hoje, hoje.stream().mapToInt(AulaDeHoje::presentes).sum(), rankingDoMes(storeId, 20),
                linkPresenca(storeId));
    }

    // ---------- Ranking e conquistas ----------

    public List<LinhaRankingPresenca> rankingDoMes(UUID storeId, int limite) {
        LocalDate hoje = hoje();
        LocalDate inicio = hoje.withDayOfMonth(1);
        Graduacoes.Aulas contagem = graduacoes.aulas(storeId);
        boolean porCheckin = "checkins".equals(graduacoes.config(storeId).contarAulasPor);
        Map<UUID, int[]> total = new HashMap<>();
        Map<UUID, AlunoModalidade> principal = new HashMap<>();
        for (AlunoModalidade am : AlunoModalidade.<AlunoModalidade>list("storeId = ?1 and ativo = true", storeId)) {
            int n = contagem.entre(am.cliente.id, am.modalidade.id, inicio, hoje);
            AlunoModalidade atual = principal.get(am.cliente.id);
            if (atual == null || am.faixa.ordem > atual.faixa.ordem) principal.put(am.cliente.id, am);
            int[] t = total.computeIfAbsent(am.cliente.id, k -> new int[1]);
            t[0] = porCheckin ? n : t[0] + n;
        }
        return total.entrySet().stream()
                .filter(e -> e.getValue()[0] > 0)
                .map(e -> {
                    AlunoModalidade am = principal.get(e.getKey());
                    return new LinhaRankingPresenca(ref(am.cliente), ref(am.faixa), am.modalidade.nome, e.getValue()[0]);
                })
                .sorted(Comparator.comparingInt(LinhaRankingPresenca::aulas).reversed()
                        .thenComparing(l -> l.aluno().nome(), Lutas.ALFABETICA))
                .limit(limite)
                .toList();
    }

    public List<Conquista> conquistas(UUID storeId, Cliente aluno, int aulasTotal, int aulasMes) {
        List<Conquista> lista = new ArrayList<>();
        int[] marcos = {1, 10, 50, 100, 250, 500};
        String[] nomes = {"Primeira aula", "10 aulas", "50 aulas", "100 aulas", "250 aulas", "500 aulas"};
        for (int i = 0; i < marcos.length; i++) {
            lista.add(new Conquista("aulas_" + marcos[i], nomes[i],
                    marcos[i] == 1 ? "Pisou no tatame pela primeira vez" : "Treinou " + marcos[i] + " aulas",
                    aulasTotal >= marcos[i], null));
        }
        lista.add(new Conquista("assiduo", "Assíduo do mês", "12 aulas ou mais no mês", aulasMes >= 12, null));
        Graduacao primeira = Graduacao.<Graduacao>find("cliente = ?1 and tipo <> 'inicial' order by data", aluno).firstResult();
        lista.add(new Conquista("graduacao", "Primeira graduação", "Recebeu o primeiro grau ou faixa", primeira != null,
                primeira != null ? primeira.data.toString() : null));
        Inscricao medalha = Inscricao.<Inscricao>find(
                "cliente = ?1 and resultado in ('ouro', 'prata', 'bronze') order by evento.data", aluno).firstResult();
        lista.add(new Conquista("medalha", "Medalhista", "Subiu no pódio em um campeonato", medalha != null,
                medalha != null ? medalha.evento.data.toString() : null));
        Inscricao ouro = Inscricao.<Inscricao>find("cliente = ?1 and resultado = 'ouro' order by evento.data", aluno)
                .firstResult();
        lista.add(new Conquista("campeao", "Campeão", "Conquistou uma medalha de ouro", ouro != null,
                ouro != null ? ouro.evento.data.toString() : null));
        AlunoModalidade mais = AlunoModalidade.<AlunoModalidade>find("cliente = ?1 order by inicio", aluno).firstResult();
        boolean umAno = mais != null && !mais.inicio.plusYears(1).isAfter(hoje());
        lista.add(new Conquista("um_ano", "1 ano de tatame", "Um ano treinando na academia", umAno,
                umAno ? mais.inicio.plusYears(1).toString() : null));
        return lista;
    }

    // ---------- QR Code ----------

    ConfigArtesMarciais configPorCodigo(String codigo) {
        ConfigArtesMarciais c = ConfigArtesMarciais.<ConfigArtesMarciais>find("codigoPresenca", codigo).firstResult();
        if (c == null) throw Erro.naoEncontrado("QR Code de presença inválido");
        return c;
    }

    // Aulas em que dá para marcar presença agora: de 1 hora antes do início até o fim.
    List<AulaDeHoje> abertasAgora(UUID storeId) {
        OffsetDateTime agora = OffsetDateTime.now();
        LocalDate hoje = hoje();
        return aulasDeHoje(storeId).stream()
                .filter(a -> !"concluida".equals(a.status()))
                .filter(a -> hoje.atTime(java.time.LocalTime.parse(a.hora()))
                        .atZone(br.com.clienteplus.modulos.comum.Formatos.FUSO).toOffsetDateTime()
                        .minusHours(1).isBefore(agora))
                .toList();
    }

    public PaginaPresenca pagina(String codigo) {
        ConfigArtesMarciais c = configPorCodigo(codigo);
        return new PaginaPresenca(graduacoes.nomeAcademia(c.storeId), abertasAgora(c.storeId));
    }

    @Transactional
    public RespostaPresenca marcar(String codigo, PedidoPresenca d) {
        ConfigArtesMarciais c = configPorCodigo(codigo);
        UUID storeId = c.storeId;
        if (d == null || d.documento() == null) throw Erro.invalido("Digite seu CPF ou celular");
        String numeros = d.documento().replaceAll("\\D", "");
        if (numeros.length() < 10) throw Erro.invalido("Digite o CPF ou o celular com DDD");
        Cliente aluno = Cliente.<Cliente>find("storeId = ?1 and (cpf = ?2 or telefone = ?2)", storeId, numeros)
                .firstResult();
        if (aluno == null) return new RespostaPresenca(false, "Não encontramos esse CPF ou celular. Fale com a recepção.",
                null, null, 0, null);
        if (d.horarioId() == null) throw Erro.invalido("Escolha a aula");
        AulaDeHoje aula = abertasAgora(storeId).stream()
                .filter(a -> a.horarioId().equals(d.horarioId()))
                .findFirst()
                .orElseThrow(() -> Erro.conflito("Esta aula não está aberta para presença agora"));

        ResultadoAcesso r = acessos.registrar(storeId, aluno, "totem_qr", null, false, "Presença pelo QR Code");
        if ("bloqueado".equals(r.resultado())) {
            return new RespostaPresenca(false, r.mensagem() + ". Fale com a recepção.", aluno.nome, aula.aula(), 0, null);
        }

        AulaHorario h = aulas.horario(storeId, aula.horarioId());
        LocalDate hoje = hoje();
        boolean fixo = TurmaAluno.count("horario = ?1 and cliente = ?2 and ativo = true and desde <= ?3", h, aluno, hoje) > 0;
        Presenca p = Presenca.<Presenca>find("horario = ?1 and cliente = ?2 and data = ?3", h, aluno, hoje).firstResult();
        if (!fixo && (p == null || Presenca.CANCELADO.equals(p.status))) aulas.reservar(storeId, h.id, aluno, hoje, "area_cliente");
        aulas.chamada(storeId, h.id, aluno, hoje, Presenca.PRESENTE);

        // Faixa e aulas na modalidade da aula (para a mensagem de incentivo).
        AulaModalidade am = AulaModalidade.<AulaModalidade>find("aula", h.aula).firstResult();
        AlunoModalidade naModalidade = am == null ? null
                : AlunoModalidade.<AlunoModalidade>find("cliente = ?1 and modalidade = ?2 and ativo = true", aluno,
                        am.modalidade).firstResult();
        int aulasNaFaixa = 0;
        String faixa = null;
        if (naModalidade != null) {
            Presenca.getEntityManager().flush();
            aulasNaFaixa = graduacoes.aulas(storeId, aluno.id).desde(aluno.id, am.modalidade.id, naModalidade.faixaDesde);
            faixa = Lutas.faixaComGrau(naModalidade.faixa, naModalidade.grau);
        }
        return new RespostaPresenca(true, "Presença confirmada. Bom treino, " + aluno.nome.split(" ")[0] + "!",
                aluno.nome, aula.aula(), aulasNaFaixa, faixa);
    }
}
