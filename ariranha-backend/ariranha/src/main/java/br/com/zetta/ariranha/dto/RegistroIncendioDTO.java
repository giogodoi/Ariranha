package br.com.zetta.ariranha.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class RegistroIncendioDTO {
    private Long id;
    private String autor;

    @NotBlank(message = "A descrição do incêndio é obrigatória")
    private String descricao;

    private LocalDateTime dataRegistro;

    @NotNull(message = "A latitude é obrigatória")
    private Double latitude;

    @NotNull(message = "A longitude é obrigatória")
    private Double longitude;
}