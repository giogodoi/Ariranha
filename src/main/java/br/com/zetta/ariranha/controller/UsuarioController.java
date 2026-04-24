package br.com.zetta.ariranha.controller;
import br.com.zetta.ariranha.dto.UsuarioDTO;
import br.com.zetta.ariranha.model.Usuario;
import br.com.zetta.ariranha.service.UsuarioService;
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
    public ResponseEntity<Map<String, String>> login(@RequestBody Usuario loginData) {
        // 1. Gera o token usando o service
        String token = service.autenticar(loginData.getCpf(), loginData.getSenha());
        
        // 2. Cria um mapa (que o Spring converte automaticamente para JSON)
        Map<String, String> response = new HashMap<>();
        response.put("token", token);
        
        // 3. Retorna HTTP 200 OK com o JSON { "token": "seu_jwt_aqui" }
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public List<UsuarioDTO> listar() { 
        return service.listarTodos();
    }
}