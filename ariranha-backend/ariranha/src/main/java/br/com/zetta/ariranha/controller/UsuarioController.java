package br.com.zetta.ariranha.controller;
import br.com.zetta.ariranha.dto.UsuarioDTO;
import br.com.zetta.ariranha.model.Usuario;
import br.com.zetta.ariranha.service.UsuarioService;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import br.com.zetta.ariranha.dto.UsuarioCadastroDTO;
import java.util.Map;
import java.util.HashMap;
import java.util.List;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioService service;

    @PostMapping("/cadastrar")
    public ResponseEntity<UsuarioDTO> criar(@Valid @RequestBody UsuarioCadastroDTO dto) {
        Usuario usuario = new Usuario();
        usuario.setNomeCompleto(dto.getNomeCompleto());
        usuario.setEmail(dto.getEmail());
        usuario.setCpf(dto.getCpf());
        usuario.setTelefone(dto.getTelefone());
        usuario.setSenha(dto.getSenha());

        Usuario salvo = service.salvar(usuario);
    
        UsuarioDTO retorno = new UsuarioDTO();
        retorno.setId(salvo.getId());
        retorno.setNomeCompleto(salvo.getNomeCompleto());
        retorno.setEmail(salvo.getEmail());
        retorno.setCpf(salvo.getCpf());
        retorno.setTelefone(salvo.getTelefone());
    
        return ResponseEntity.status(201).body(retorno);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody Usuario loginData) {
        String token = service.autenticar(loginData.getCpf(), loginData.getSenha());
        
        Map<String, String> response = new HashMap<>();
        response.put("token", token);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public List<UsuarioDTO> listar() { 
        return service.listarTodos();
    }
}