package br.com.zetta.ariranha.controller;
import br.com.zetta.ariranha.dto.RegistroIncendioDTO;
import br.com.zetta.ariranha.model.RegistroIncendio;
import br.com.zetta.ariranha.service.RegistroIncendioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/registros")
public class RegistroIncendioController {

    @Autowired
    private RegistroIncendioService service;

    @GetMapping
    public List<RegistroIncendioDTO> buscarTodos() {
        return service.listarTodos();
    }

    @GetMapping("/historico")
    public List<RegistroIncendioDTO> buscarHistorico(
            @RequestParam String estado,
            @RequestParam int ano,
            @RequestParam int mes) {
        return service.listarHistoricoInpe(estado, ano, mes);
    }

    @GetMapping("/{id}")
    public RegistroIncendioDTO buscarPorId(@PathVariable Long id) {
        return service.buscarPorId(id);
    }

    @PostMapping
    public RegistroIncendioDTO criar(@RequestBody RegistroIncendio registro) {
        return service.salvar(registro);
    }

    @PutMapping("/{id}")
    public RegistroIncendioDTO atualizar(@PathVariable Long id, @RequestBody RegistroIncendio dadosNovos) {
        service.buscarPorId(id); 
        dadosNovos.setId(id);
        return service.salvar(dadosNovos);
    }
}