package br.com.zetta.ariranha.config;

import br.com.zetta.ariranha.dto.ErroRespostaDTO;
import br.com.zetta.ariranha.exception.EntidadeNaoEncontradaException;
import br.com.zetta.ariranha.exception.NegocioException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.LocalDateTime;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EntidadeNaoEncontradaException.class)
    public ResponseEntity<ErroRespostaDTO> entidadeNaoEncontrada(EntidadeNaoEncontradaException ex, HttpServletRequest request) {
        return criarResposta(HttpStatus.NOT_FOUND, "Recurso não encontrado", ex.getMessage(), request);
    }

    @ExceptionHandler(NegocioException.class)
    public ResponseEntity<ErroRespostaDTO> negocioErro(NegocioException ex, HttpServletRequest request) {
        return criarResposta(HttpStatus.BAD_REQUEST, "Regra de negócio violada", ex.getMessage(), request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErroRespostaDTO> erroValidacao(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String mensagem = ex.getBindingResult().getFieldErrors().get(0).getDefaultMessage();
        return criarResposta(HttpStatus.BAD_REQUEST, "Dados inválidos", mensagem, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErroRespostaDTO> erroInesperado(Exception ex, HttpServletRequest request) {
        ex.printStackTrace(); 
        return criarResposta(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno do servidor", 
                "Ocorreu um erro inesperado. Tente novamente mais tarde.", request);
    }

    private ResponseEntity<ErroRespostaDTO> criarResposta(HttpStatus status, String erro, String mensagem, HttpServletRequest request) {
        ErroRespostaDTO corpo = new ErroRespostaDTO(
                LocalDateTime.now(), 
                status.value(), 
                erro, 
                mensagem, 
                request.getRequestURI()
        );
        return ResponseEntity.status(status).body(corpo);
    }
}