package br.com.zetta.ariranha.service;

import br.com.zetta.ariranha.dto.InpeRespostaDTO;
import br.com.zetta.ariranha.dto.RegistroIncendioDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class InpeService {

    @Autowired
    private RestTemplate restTemplate;

    public List<RegistroIncendioDTO> buscarFocosInpe() {
        LocalDateTime quarentaEOitoHorasAtras = LocalDateTime.now().minusDays(2);
        String dataFormatada = quarentaEOitoHorasAtras.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

        String url = "https://terrabrasilis.dpi.inpe.br/queimadas/geoserver/wfs?" +
                     "service=WFS&version=2.0.0&request=GetFeature&" +
                     "typeName=bdqueimadas2:focos&outputFormat=application/json&" +
                     "CQL_FILTER=data_hora_gmt >= '" + dataFormatada + "Z'";
        
        return executarBusca(url, "INPE (Satélite)");
    }

    public List<RegistroIncendioDTO> buscarFocosHistorico(String estado, int ano, int mes) {
        // Criamos o intervalo do mês (Ex: 2006-08-01 até 2006-08-28)
        String dataInicio = String.format("%d-%02d-01T00:00:00Z", ano, mes);
        String dataFim = String.format("%d-%02d-28T23:59:59Z", ano, mes);

        String filtro = String.format("estado='%s' AND data_hora_gmt BETWEEN '%s' AND '%s'", 
                                       estado.toUpperCase(), dataInicio, dataFim);

        String url = "https://terrabrasilis.dpi.inpe.br/queimadas/geoserver/wfs?" +
                     "service=WFS&version=2.0.0&request=GetFeature&" +
                     "typeName=bdqueimadas2:focos&outputFormat=application/json&" +
                     "CQL_FILTER=" + filtro;

        return executarBusca(url, "INPE (Histórico)");
    }

    private List<RegistroIncendioDTO> executarBusca(String url, String autor) {
        try {
            InpeRespostaDTO resposta = restTemplate.getForObject(url, InpeRespostaDTO.class);
            if (resposta == null || resposta.getElementos() == null) return List.of();

            return resposta.getElementos().stream().map(elemento -> {
                RegistroIncendioDTO dto = new RegistroIncendioDTO();
                dto.setAutor(autor);
                dto.setDescricao("Foco em: " + elemento.getPropriedades().getMunicipio());
                dto.setLongitude(elemento.getGeometria().getCoordenadas().get(0));
                dto.setLatitude(elemento.getGeometria().getCoordenadas().get(1));
                return dto;
            }).collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("Erro ao conectar com o INPE: " + e.getMessage());
            return List.of();
        }
    }
}