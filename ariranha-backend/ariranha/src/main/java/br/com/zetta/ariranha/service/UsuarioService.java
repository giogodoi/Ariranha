package br.com.zetta.ariranha.service;
import br.com.zetta.ariranha.model.Usuario;
import br.com.zetta.ariranha.repository.UsuarioRepository;
import br.com.zetta.ariranha.dto.UsuarioDTO;
import java.util.stream.Collectors;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.List;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository repository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Value("${ariranha.jwt.secret}")
    private String jwtSecret;

    @Value("${ariranha.jwt.expiration}")
    private Long jwtExpiration;

    private Key getChave() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public Usuario salvar(Usuario usuario) {

        if (repository.existsByCpf(usuario.getCpf())) {
            throw new RuntimeException("Este CPF já está cadastrado no sistema.");
        }

        String senhaCodificada = passwordEncoder.encode(usuario.getSenha());
        usuario.setSenha(senhaCodificada);

        return repository.save(usuario);
    }

    public String autenticar(String cpf, String senhaPura) {
        Usuario usuario = repository.findByCpf(cpf)
                .orElseThrow(() -> new RuntimeException("CPF ou senha incorretos."));

        if (passwordEncoder.matches(senhaPura, usuario.getSenha())) {
            return gerarToken(usuario);
        } else {
            throw new RuntimeException("CPF ou senha incorretos.");
        }
    }

    private String gerarToken(Usuario usuario) {
        return Jwts.builder()
                .setSubject(usuario.getCpf())
                .claim("nome", usuario.getNomeCompleto()) 
                .claim("id", usuario.getId())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getChave())
                .compact();
    }

    private UsuarioDTO converterParaDTO(Usuario usuario) {
        UsuarioDTO dto = new UsuarioDTO();
            dto.setId(usuario.getId());
            dto.setNomeCompleto(usuario.getNomeCompleto());
            dto.setEmail(usuario.getEmail());
            dto.setCpf(usuario.getCpf());
            dto.setTelefone(usuario.getTelefone());
        return dto;
    }

    public List<UsuarioDTO> listarTodos() {
    return repository.findAll().stream()
            .map(this::converterParaDTO)
            .collect(Collectors.toList());
    }

    public Usuario buscarPorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado!"));
    }
}