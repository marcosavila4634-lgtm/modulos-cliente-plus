package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.clienteplus.Pagamento;
import br.com.clienteplus.modulos.clienteplus.ProgramaIndicacao;
import br.com.clienteplus.modulos.clienteplus.Saque;
import br.com.clienteplus.modulos.comum.Formatos;
import jakarta.enterprise.context.ApplicationScoped;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

// SIMULAÇÃO do motor de comissões do Cliente Plus, só para o módulo mostrar
// as comissões geradas pelos pagamentos dos grupos (igual à academia).
//
// Cada pagamento confirmado de um plano que participa das indicações rende o
// % do nível para quem indicou (nível 1), para quem indicou esse (nível 2) e
// para o seguinte (nível 3). No projeto principal: ler do Cliente Plus.
@ApplicationScoped
public class Indicacoes {

    public record Comissao(UUID pagamentoId, LocalDate data, Cliente beneficiario, Cliente pagador, int nivel,
                           BigDecimal percentual, BigDecimal valorPagamento, BigDecimal valor) {}

    // ganho = todas as comissões; sacado = saques pagos; emAnalise = pedidos em aberto
    public record Saldo(BigDecimal ganho, BigDecimal sacado, BigDecimal emAnalise) {
        public BigDecimal disponivel() {
            return ganho.subtract(sacado).subtract(emAnalise);
        }
    }

    public List<Comissao> comissoes(UUID storeId) {
        ProgramaIndicacao prog = ProgramaIndicacao.<ProgramaIndicacao>find("storeId", storeId).firstResult();
        BigDecimal[] pct = prog == null
                ? new BigDecimal[] {BigDecimal.TEN, BigDecimal.valueOf(5), BigDecimal.valueOf(2)}
                : new BigDecimal[] {prog.nivel1Pct, prog.nivel2Pct, prog.nivel3Pct};

        List<Comissao> lista = new ArrayList<>();
        for (Pagamento p : Pagamento.<Pagamento>list("storeId = ?1 and status = ?2 order by pagoEm", storeId, Pagamento.PAGO)) {
            if (p.assinatura == null || !p.assinatura.plano.participaIndicacoes || p.pagoEm == null) continue;
            if (p.valor.signum() <= 0) continue;
            Cliente beneficiario = p.cliente.indicadoPor;
            for (int nivel = 1; nivel <= 3 && beneficiario != null; nivel++) {
                BigDecimal valor = p.valor.multiply(pct[nivel - 1]).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                if (valor.signum() > 0) {
                    lista.add(new Comissao(p.id, p.pagoEm.atZoneSameInstant(Formatos.FUSO).toLocalDate(), beneficiario,
                            p.cliente, nivel, pct[nivel - 1], p.valor, valor));
                }
                beneficiario = beneficiario.indicadoPor;
            }
        }
        return lista;
    }

    public Map<UUID, Saldo> saldos(UUID storeId, List<Comissao> comissoes) {
        Map<UUID, BigDecimal[]> soma = new HashMap<>();
        for (Comissao c : comissoes) {
            soma.computeIfAbsent(c.beneficiario().id, k -> zeros())[0] =
                    soma.get(c.beneficiario().id)[0].add(c.valor());
        }
        for (Saque s : Saque.<Saque>list("storeId", storeId)) {
            BigDecimal[] v = soma.computeIfAbsent(s.cliente.id, k -> zeros());
            if (Saque.PAGO.equals(s.status)) v[1] = v[1].add(s.valor);
            else if (Saque.SOLICITADO.equals(s.status)) v[2] = v[2].add(s.valor);
        }
        Map<UUID, Saldo> saldos = new HashMap<>();
        soma.forEach((id, v) -> saldos.put(id, new Saldo(v[0], v[1], v[2])));
        return saldos;
    }

    public Saldo saldo(UUID storeId, UUID clienteId) {
        return saldos(storeId, comissoes(storeId)).getOrDefault(clienteId, new Saldo(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO));
    }

    private static BigDecimal[] zeros() {
        return new BigDecimal[] {BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO};
    }
}
