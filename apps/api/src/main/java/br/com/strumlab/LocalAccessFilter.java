package br.com.strumlab;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.web.filter.OncePerRequestFilter;

public class LocalAccessFilter extends OncePerRequestFilter {
    private final byte[] secret;
    public LocalAccessFilter(String token) {
        if (token == null || token.length() < 32) throw new IllegalStateException("Configure LOCAL_API_TOKEN com pelo menos 32 caracteres.");
        secret = token.getBytes(StandardCharsets.UTF_8);
    }
    @Override protected boolean shouldNotFilter(HttpServletRequest request) { return !request.getRequestURI().startsWith("/api/v1/songs") && !request.getRequestURI().startsWith("/api/v1/songbooks"); }
    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        String provided = request.getHeader("X-StrumLab-Local-Token");
        if (request.getHeader("Origin") != null || provided == null || !MessageDigest.isEqual(secret, provided.getBytes(StandardCharsets.UTF_8))) {
            response.setStatus(403); response.setContentType("application/problem+json");
            response.getWriter().write("{\"status\":403,\"title\":\"Acesso local negado\",\"detail\":\"Use a interface local do StrumLab.\"}");
            return;
        }
        chain.doFilter(request, response);
    }
}
