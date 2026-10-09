package br.com.clienteplus.modulos.artesmarciais;

import static br.com.clienteplus.modulos.artesmarciais.Lutas.ref;

import br.com.clienteplus.modulos.academia.Matriculas;
import br.com.clienteplus.modulos.artesmarciais.ArtesMarciaisContrato.*;
import br.com.clienteplus.modulos.clienteplus.Assinatura;
import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.Erro;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

// Responsáveis pelos alunos kids. Um responsável pode ter vários filhos; o
// código dele abre a área do responsável (/responsavel/<codigo>).
@ApplicationScoped
public class Familias {

    @Inject
    Matriculas matriculas;

    @Inject
    Graduacoes graduacoes;

    public Responsavel responsavel(UUID storeId, UUID id) {
        Responsavel r = id != null ? Responsavel.findById(id) : null;
        if (r == null || !r.storeId.equals(storeId)) throw Erro.naoEncontrado("Responsável não encontrado");
        return r;
    }

    public Dependente dependenteDe(Cliente aluno) {
        return Dependente.<Dependente>find("cliente", aluno).firstResult();
    }

    static DependenteJson json(Dependente d) {
        AlunoModalidade am = AlunoModalidade.<AlunoModalidade>find("cliente = ?1 and ativo = true order by faixa.ordem desc",
                d.cliente).firstResult();
        return new DependenteJson(ref(d.cliente), d.parentesco, am != null ? ref(am.faixa) : null,
                am != null ? am.modalidade.nome : null);
    }

    ResponsavelJson json(Responsavel r) {
        return new ResponsavelJson(r.id, r.nome, r.telefone, r.email, r.cpf, r.codigo,
                Dependente.<Dependente>list("responsavel", r).stream().map(Familias::json).toList());
    }

    public PainelResponsaveis painel(UUID storeId) {
        int adulto = graduacoes.config(storeId).idadeAdulto;
        Set<UUID> comResponsavel = new HashSet<>();
        for (Dependente d : Dependente.<Dependente>list("storeId", storeId)) comResponsavel.add(d.cliente.id);
        List<RefAluno> sem = kidsAtivos(storeId, adulto).stream()
                .filter(c -> !comResponsavel.contains(c.id))
                .map(Lutas::ref)
                .sorted(Comparator.comparing(RefAluno::nome, Lutas.ALFABETICA))
                .toList();
        List<ResponsavelJson> lista = Responsavel.<Responsavel>list("storeId", storeId).stream()
                .map(this::json)
                .sorted(Comparator.comparing(ResponsavelJson::nome, Lutas.ALFABETICA))
                .toList();
        return new PainelResponsaveis(lista, sem);
    }

    // Alunos com matrícula ativa e menores que a idade adulta.
    public List<Cliente> kidsAtivos(UUID storeId, int idadeAdulto) {
        return Assinatura.<Assinatura>list("storeId = ?1 and status = ?2", storeId, Assinatura.ATIVA).stream()
                .map(a -> a.cliente)
                .distinct()
                .filter(c -> {
                    Integer i = Lutas.idade(c);
                    return i != null && i < idadeAdulto;
                })
                .toList();
    }

    @Transactional
    public Responsavel salvar(UUID storeId, UUID id, DadosResponsavel d) {
        if (d == null) throw Erro.invalido("Dados do responsável");
        Responsavel r;
        if (id == null) {
            r = new Responsavel();
            r.storeId = storeId;
            String c;
            do {
                c = Lutas.codigo(10).toLowerCase();
            } while (Responsavel.count("codigo", c) > 0);
            r.codigo = c;
        } else {
            r = responsavel(storeId, id);
        }
        r.nome = Lutas.obrigatorio(d.nome(), "Informe o nome do responsável");
        String tel = d.telefone() != null ? d.telefone().replaceAll("\\D", "") : "";
        if (tel.isEmpty()) throw Erro.invalido("Informe o WhatsApp do responsável (com DDD)");
        if (tel.length() < 10 || tel.length() > 11) throw Erro.invalido("WhatsApp inválido: use DDD + número");
        r.telefone = tel;
        r.email = d.email() != null && !d.email().isBlank() ? d.email().trim() : null;
        String cpf = d.cpf() != null ? d.cpf().replaceAll("\\D", "") : "";
        if (!cpf.isEmpty() && cpf.length() != 11) throw Erro.invalido("CPF inválido");
        r.cpf = cpf.isEmpty() ? null : cpf;
        r.persist();
        return r;
    }

    @Transactional
    public void excluir(UUID storeId, UUID id) {
        Responsavel r = responsavel(storeId, id);
        Dependente.delete("responsavel", r);
        r.delete();
    }

    @Transactional
    public void adicionarDependente(UUID storeId, UUID responsavelId, NovoDependente d) {
        Responsavel r = responsavel(storeId, responsavelId);
        if (d == null || d.alunoId() == null) throw Erro.invalido("Escolha o aluno");
        Cliente aluno = matriculas.aluno(storeId, d.alunoId());
        if (Dependente.count("responsavel = ?1 and cliente = ?2", r, aluno) > 0) {
            throw Erro.conflito(aluno.nome + " já está com este responsável");
        }
        Dependente x = new Dependente();
        x.storeId = storeId;
        x.responsavel = r;
        x.cliente = aluno;
        x.parentesco = d.parentesco() != null && !d.parentesco().isBlank() ? d.parentesco().trim() : "responsável";
        x.persist();
    }

    @Transactional
    public void removerDependente(UUID storeId, UUID responsavelId, UUID alunoId) {
        Responsavel r = responsavel(storeId, responsavelId);
        Dependente.delete("responsavel = ?1 and cliente.id = ?2", r, alunoId);
    }
}
