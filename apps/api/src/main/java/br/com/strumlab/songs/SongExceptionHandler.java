package br.com.strumlab.songs;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class SongExceptionHandler {
    @ExceptionHandler(SongProblem.class)
    ResponseEntity<ProblemDetail> problem(SongProblem exception) { return response(exception.status(), exception.getMessage()); }
    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    ResponseEntity<ProblemDetail> invalid(Exception exception) { return response(400, "Formato de requisição inválido."); }
    @ExceptionHandler(Exception.class)
    ResponseEntity<ProblemDetail> unexpected(Exception exception) { return response(500, "Não foi possível concluir a operação. Tente novamente."); }
    private ResponseEntity<ProblemDetail> response(int status, String detail) {
        var body = ProblemDetail.forStatusAndDetail(HttpStatusCode.valueOf(status), detail);
        body.setTitle(status == 409 ? "Conflito de edição" : status == 422 ? "Confira a cifra" : status == 404 ? "Não encontrado" : "Operação indisponível");
        return ResponseEntity.status(status).contentType(MediaType.APPLICATION_PROBLEM_JSON).body(body);
    }
}
