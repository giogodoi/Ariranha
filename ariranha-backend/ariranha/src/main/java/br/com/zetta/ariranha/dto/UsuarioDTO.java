package br.com.zetta.ariranha.dto;

import lombok.Data;

@Data
public class UsuarioDTO {
    private Long id;
    private String nomeCompleto;
    private String email;
    private String cpf;
    private String telefone;
  
}