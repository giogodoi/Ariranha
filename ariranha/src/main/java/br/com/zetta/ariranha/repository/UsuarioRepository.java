package br.com.zetta.ariranha.repository;
import br.com.zetta.ariranha.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    boolean existsByCpf(String cpf);
    Optional<Usuario> findByCpf(String cpf);
}