package br.com.zetta.ariranha.model;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "usuarios")
@Getter
@Setter
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nomeCompleto;

    @Column(unique = true, nullable = false, length = 11)
    private String cpf;

    @Column(nullable = false, length = 15)
    private String telefone; 

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String senha;

    @Column(name = "data_criacao", updatable = false)
    private LocalDateTime dataCriacao = LocalDateTime.now();

    @OneToMany(mappedBy = "autor", cascade = CascadeType.ALL)
    private List<RegistroIncendio> registros;
}