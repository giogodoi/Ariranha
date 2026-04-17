package br.com.zetta.ariranha.service;
import br.com.zetta.ariranha.dto.RegistroIncendioDTO;
import br.com.zetta.ariranha.model.RegistroIncendio;
import br.com.zetta.ariranha.repository.RegistroIncendioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RegistroIncendioService {

    @Autowired
    private RegistroIncendioRepository repository;

    public List<RegistroIncendioDTO> listarTodos() {
        return repository.findAll().stream()
                .map(this::converterParaDTO)
                .collect(Collectors.toList());
    }

    public RegistroIncendioDTO salvar(RegistroIncendio registro) {
        RegistroIncendio salvo = repository.save(registro);
        return converterParaDTO(salvo); 
    }

    public RegistroIncendioDTO buscarPorId(Long id) {
        RegistroIncendio registro = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Registro não encontrado"));
        return converterParaDTO(registro);
    }

    private RegistroIncendioDTO converterParaDTO(RegistroIncendio model) {
        RegistroIncendioDTO dto = new RegistroIncendioDTO();
        dto.setId(model.getId());
        dto.setAutor(model.getAutor());
        dto.setDescricao(model.getDescricao());
        dto.setDataRegistro(model.getDataRegistro());
        
        if (model.getGeom() != null) {
            dto.setLongitude(model.getGeom().getX());
            dto.setLatitude(model.getGeom().getY());
        }
        return dto;
    }
}