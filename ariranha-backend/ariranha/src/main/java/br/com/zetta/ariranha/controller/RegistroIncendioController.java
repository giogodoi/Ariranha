package br.com.zetta.ariranha.controller;

import br.com.zetta.ariranha.dto.RegistroIncendioDTO;
import br.com.zetta.ariranha.model.RegistroIncendio;
import br.com.zetta.ariranha.service.RegistroIncendioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/registros")
public class RegistroIncendioController {

    @Autowired
    private RegistroIncendioService service;

    // Adicionada paginação para evitar o erro de JSON truncado das versoes anteriores
    // Nota: Em produção, o ideal é que os dados do INPE também sejam persistidos/paginados
    // Para a primeira página, os dados do INPE são anexados aos registros locais, mas para páginas subsequentes, apenas os registros locais são retornados
    // Como estamos tratando apenas algo experimental, não vou obrigar o usuário a baixar as 4gb e 30M de dados do INPE,
    // mas em um cenário real, o ideal é que os dados do INPE sejam persistidos e paginados junto com os registros locais 
    // para evitar inconsistências e problemas de performance
    
    @GetMapping
    public ResponseEntity<Page<RegistroIncendioDTO>> buscarTodos(
            @PageableDefault(size = 20, sort = "id") Pageable pageable) {
        return ResponseEntity.ok(service.listarTodos(pageable));
    }

    @GetMapping("/historico")
    public ResponseEntity<List<RegistroIncendioDTO>> buscarHistorico(
            @RequestParam String estado,
            @RequestParam int ano,
            @RequestParam int mes) {
        return ResponseEntity.ok(service.listarHistoricoInpe(estado, ano, mes));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RegistroIncendioDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<RegistroIncendioDTO> criar(@RequestBody RegistroIncendio registro) {
        return ResponseEntity.ok(service.salvar(registro));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RegistroIncendioDTO> atualizar(@PathVariable Long id, @RequestBody RegistroIncendio dadosNovos) {
        dadosNovos.setId(id);
        return ResponseEntity.ok(service.salvar(dadosNovos));
    }
}