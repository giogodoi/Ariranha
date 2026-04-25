package br.com.zetta.ariranha.service;

import br.com.zetta.ariranha.dto.RegistroIncendioDTO;
import br.com.zetta.ariranha.model.RegistroIncendio;
import br.com.zetta.ariranha.repository.RegistroIncendioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RegistroIncendioService {

    @Autowired
    private RegistroIncendioRepository repository;

    @Autowired
    private InpeService inpeService;

    public List<RegistroIncendioDTO> listarHistoricoInpe(String estado, int ano, int mes) {
        return inpeService.buscarFocosHistorico(estado, ano, mes);
    }

    @Transactional(readOnly = true)
    public Page<RegistroIncendioDTO> listarTodos(Pageable pageable) {
        // 1. Busca registros locais paginados do banco de dados
        Page<RegistroIncendio> pageLocal = repository.findAll(pageable);
        List<RegistroIncendioDTO> listaFinal = pageLocal.stream()
                .map(this::converterParaDTO)
                .collect(Collectors.toCollection(ArrayList::new));

        // 2. Se for a primeira página, anexamos os dados em tempo real do INPE
        // Nota: Em produção, o ideal é que os dados do INPE também sejam persistidos/paginados
        if (pageable.getPageNumber() == 0) {
            try {
                List<RegistroIncendioDTO> dadosInpe = inpeService.buscarFocosInpe();
                // Limita para não truncar o JSON novamente caso o INPE retorne milhares de focos
                listaFinal.addAll(dadosInpe.stream().limit(50).collect(Collectors.toList()));
            } catch (Exception e) {
                System.err.println("Erro ao buscar dados do INPE: " + e.getMessage());
            }
        }

        return new PageImpl<>(listaFinal, pageable, pageLocal.getTotalElements());
    }

    public RegistroIncendioDTO salvar(RegistroIncendio registro) {
        RegistroIncendio salvo = repository.save(registro);
        return converterParaDTO(salvo);
    }

    public RegistroIncendioDTO buscarPorId(Long id) {
        RegistroIncendio registro = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Registro #" + id + " não encontrado"));
        return converterParaDTO(registro);
    }

    private RegistroIncendioDTO converterParaDTO(RegistroIncendio model) {
        RegistroIncendioDTO dto = new RegistroIncendioDTO();
        dto.setId(model.getId());
        
        // Tratamento para evitar NullPointerException se o autor não estiver carregado
        if (model.getAutor() != null) {
            dto.setAutor(model.getAutor().getNomeCompleto());
        } else {
            dto.setAutor("Usuário Desconhecido");
        }
        
        dto.setDescricao(model.getDescricao());
        dto.setDataRegistro(model.getDataRegistro());
        
        // Verifica se a geometria existe antes de acessar as coordenadas
        if (model.getGeom() != null) {
            dto.setLongitude(model.getGeom().getX());
            dto.setLatitude(model.getGeom().getY());
        } else {
            dto.setLatitude(0.0);
            dto.setLongitude(0.0);
        }
        return dto;
    }
}