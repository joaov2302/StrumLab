package br.com.strumlab;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class FoundationIT {
    @LocalServerPort int port;
    @Autowired JdbcTemplate jdbc;
    private HttpResponse<String> get(String path) throws Exception {
        return HttpClient.newHttpClient().send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + path)).GET().build(), HttpResponse.BodyHandlers.ofString());
    }
    @Test void migratedPostgresAndHealth() throws Exception {
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM flyway_schema_history WHERE success = true AND version = '1'", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM workspace WHERE id='00000000-0000-4000-8000-000000000001'", Integer.class)).isEqualTo(1);
        var response = get("/api/v1/health");
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).contains("\"status\":\"up\"", "\"database\":\"up\"", "\"mode\":\"local\"");
    }
    @Test void futureAndManagementEndpointsAreDenied() throws Exception {
        assertThat(get("/api/v1/songs").statusCode()).isEqualTo(403);
        assertThat(get("/actuator/health").statusCode()).isEqualTo(403);
    }
}
