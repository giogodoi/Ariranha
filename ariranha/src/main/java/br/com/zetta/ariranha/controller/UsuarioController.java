package br.com.zetta.ariranha.controller;
import br.com.zetta.ariranha.model.Usuario;
import br.com.zetta.ariranha.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioService service;

    @PostMapping
    public Usuario criar(@RequestBody Usuario usuario) {
        return service.salvar(usuario);
    }

    @PostMapping("/login")
    public String login(@RequestBody Usuario loginData) {
        return service.autenticar(loginData.getCpf(), loginData.getSenha());
    }

    @GetMapping
    public List<Usuario> listar() {
        return service.listarTodos();
    }
}