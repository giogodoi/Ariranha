package br.com.zetta.ariranha.controller;
import br.com.zetta.ariranha.dto.UsuarioDTO;
import br.com.zetta.ariranha.model.Usuario;
import br.com.zetta.ariranha.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import br.com.zetta.ariranha.dto.UsuarioCadastroDTO;

import java.util.List;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioService service;

    @PostMapping("/cadastrar")
    public Usuario criar(@RequestBody UsuarioCadastroDTO dto) {
    Usuario usuario = new Usuario();
    usuario.setNomeCompleto(dto.getNomeCompleto());
    usuario.setEmail(dto.getEmail());
    usuario.setCpf(dto.getCpf());
    usuario.setTelefone(dto.getTelefone());
    usuario.setSenha(dto.getSenha());
    
    return service.salvar(usuario);
}

    @PostMapping("/login")
    public String login(@RequestBody Usuario loginData) {
        return service.autenticar(loginData.getCpf(), loginData.getSenha());
    }

    @GetMapping
    public List<UsuarioDTO> listar() { 
        return service.listarTodos();
    }
}