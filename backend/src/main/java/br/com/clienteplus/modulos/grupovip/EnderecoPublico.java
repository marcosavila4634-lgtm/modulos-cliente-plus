package br.com.clienteplus.modulos.grupovip;

import jakarta.enterprise.context.ApplicationScoped;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Collections;
import java.util.Optional;
import org.eclipse.microprofile.config.inject.ConfigProperty;

// Endereço das páginas que vão nas mensagens (área do membro, página de vendas).
//
// No laboratório: o endereço do computador na rede (ex.: http://192.168.0.2:5173),
// para os links abrirem no celular do mesmo Wi-Fi. Pode ser trocado em
// grupo-vip.url-publica (application.properties). No projeto principal: o
// domínio do Cliente Plus.
@ApplicationScoped
public class EnderecoPublico {

    @ConfigProperty(name = "grupo-vip.url-publica")
    Optional<String> configurada;

    private String detectada;

    public String base() {
        if (configurada.isPresent() && !configurada.get().isBlank()) return configurada.get().replaceAll("/+$", "");
        if (detectada == null) detectada = "http://" + ipDaRede() + ":5173";
        return detectada;
    }

    public String areaMembro(String codigo) {
        return base() + "/membro/" + codigo;
    }

    public String paginaVendas(String slug, String indicacao) {
        return base() + "/g/" + slug + (indicacao != null ? "?ref=" + indicacao : "");
    }

    private static String ipDaRede() {
        try {
            for (NetworkInterface rede : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                if (!rede.isUp() || rede.isLoopback() || rede.isVirtual()) continue;
                String nome = (rede.getDisplayName() + " " + rede.getName()).toLowerCase();
                if (nome.contains("virtual") || nome.contains("vmware") || nome.contains("vbox")
                        || nome.contains("hyper-v") || nome.contains("wsl") || nome.contains("docker")) continue;
                for (InetAddress ip : Collections.list(rede.getInetAddresses())) {
                    if (ip instanceof Inet4Address && ip.isSiteLocalAddress()) return ip.getHostAddress();
                }
            }
        } catch (Exception e) {
            // sem rede: fica o localhost
        }
        return "localhost";
    }
}
