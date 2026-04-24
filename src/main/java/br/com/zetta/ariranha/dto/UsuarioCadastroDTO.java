package br.com.zetta.ariranha.dto;

import lombok.Data;

@Data
public class UsuarioCadastroDTO {
    private String nomeCompleto;
    private String email;
    private String cpf;
    private String telefone;
    private String senha;
}