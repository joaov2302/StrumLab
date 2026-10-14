package br.com.strumlab;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.web.access.intercept.AuthorizationFilter;

@Configuration
public class SecurityConfiguration {
    @Bean
    org.springframework.security.core.userdetails.UserDetailsService noLocalLogin() {
        return username -> { throw new org.springframework.security.core.userdetails.UsernameNotFoundException("Login indisponível no protótipo local"); };
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, @Value("${LOCAL_API_TOKEN}") String token) throws Exception {
        return http.addFilterBefore(new LocalAccessFilter(token), AuthorizationFilter.class)
                .csrf(csrf -> csrf.ignoringRequestMatchers("/api/v1/songs", "/api/v1/songs/**", "/api/v1/songbooks", "/api/v1/songbooks/**"))
                .authorizeHttpRequests(auth -> auth
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/health").permitAll()
                .requestMatchers("/api/v1/songs", "/api/v1/songs/**").permitAll()
                .requestMatchers("/api/v1/songbooks", "/api/v1/songbooks/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/strumming-patterns").permitAll()
                .anyRequest().denyAll())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .build();
    }
}
