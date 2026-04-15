package br.com.zetta.ariranha.model;
import jakarta.persistence.*;
import lombok.Data;
import org.locationtech.jts.geom.Point;
import java.time.LocalDateTime;

@Entity
@Table(name = "registros_incendios")
@Data
public class RegistroIncendio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "autor_registro")
    private String autor;

    private String descricao;

    @Column(name = "data_registro")
    private LocalDateTime dataRegistro = LocalDateTime.now();

    private Point geom;
}