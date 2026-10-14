package br.com.strumlab;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.dao.DataAccessException;

@RestController
public class HealthController {
    private final JdbcTemplate jdbc;

    public HealthController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public record HealthResponse(String status, String database, String mode) {}

    @GetMapping("/api/v1/health")
    public ResponseEntity<HealthResponse> health() {
        try {
            Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM workspace", Integer.class);
            if (count == null || count < 1) return unavailable();
            return ResponseEntity.ok(new HealthResponse("up", "up", "local"));
        } catch (DataAccessException exception) {
            return unavailable();
        }
    }

    private ResponseEntity<HealthResponse> unavailable() {
        return ResponseEntity.status(503).body(new HealthResponse("down", "down", "local"));
    }
}
