package br.com.zetta.ariranha.dto;

import org.hibernate.validator.constraints.br.CPF;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UsuarioCadastroDTO {

    @NotBlank(message = "O nome completo não pode estar em branco")
    private String nomeCompleto;

    @Email(message = "O e-mail informado é inválido")
    @NotBlank(message = "O e-mail é obrigatório")
    private String email;

    @CPF(message = "O CPF informado é inválido") 
    @NotBlank(message = "O CPF é obrigatório")
    private String cpf;

    private String telefone;

    @NotBlank(message = "A senha é obrigatória")
    @Size(min = 6, message = "A senha deve ter no mínimo 6 caracteres")
    private String senha;
}