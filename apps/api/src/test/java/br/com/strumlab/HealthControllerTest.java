package br.com.strumlab;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.dao.DataAccessResourceFailureException;
import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.assertThat;

class HealthControllerTest {
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final HealthController controller = new HealthController(jdbc);
    @Test void readyOnlyWithMigratedWorkspace() {
        when(jdbc.queryForObject("SELECT COUNT(*) FROM workspace", Integer.class)).thenReturn(1);
        var response = controller.health();
        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo(new HealthController.HealthResponse("up", "up", "local"));
    }
    @Test void missingWorkspaceIsNotReady() {
        when(jdbc.queryForObject("SELECT COUNT(*) FROM workspace", Integer.class)).thenReturn(0);
        assertThat(controller.health().getStatusCode().value()).isEqualTo(503);
    }
    @Test void databaseFailureDoesNotLeakDetails() {
        when(jdbc.queryForObject("SELECT COUNT(*) FROM workspace", Integer.class))
            .thenThrow(new DataAccessResourceFailureException("private connection details"));
        var response = controller.health();
        assertThat(response.getStatusCode().value()).isEqualTo(503);
        assertThat(response.getBody().database()).isEqualTo("down");
    }
}
