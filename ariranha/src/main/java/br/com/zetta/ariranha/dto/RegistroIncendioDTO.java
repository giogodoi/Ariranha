package br.com.zetta.ariranha.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class RegistroIncendioDTO {
    private Long id;
    private String autor;
    private String descricao;
    private LocalDateTime dataRegistro;
    private Double latitude;
    private Double longitude;
}