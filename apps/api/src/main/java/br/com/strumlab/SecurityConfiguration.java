package br.com.strumlab;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfiguration {
    @Bean
    org.springframework.security.core.userdetails.UserDetailsService noLocalLogin() {
        return username -> { throw new org.springframework.security.core.userdetails.UsernameNotFoundException("Login indisponível no protótipo local"); };
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http.authorizeHttpRequests(auth -> auth
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/health").permitAll()
                .anyRequest().denyAll())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .build();
    }
}
