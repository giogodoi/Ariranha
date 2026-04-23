package br.com.zetta.ariranha.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
public class InpeRespostaDTO {
    private String type;

    @JsonProperty("features")
    private List<Elemento> elementos; 

    @Data
    public static class Elemento {
        private String type;

        @JsonProperty("geometry")
        private Geometria geometria;

        @JsonProperty("properties")
        private Propriedades propriedades;
    }

    @Data
    public static class Geometria {
        private String type;
        private List<Double> coordenadas; 

        @JsonProperty("coordinates")
        public void setCoordenadas(List<Double> coordenadas) {
            this.coordenadas = coordenadas;
        }
    }

    @Data
    public static class Propriedades {
        private String municipio;
        private String estado;
        private String bioma;
        private String data_hora_gmt;
    }
}