package br.com.zetta.ariranha.repository;
import br.com.zetta.ariranha.model.RegistroIncendio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RegistroIncendioRepository extends JpaRepository<RegistroIncendio, Long> {
}