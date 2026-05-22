package com.ecommerce.bffuser.config;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.security.web.server.authentication.RedirectServerAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.net.URI;


@Component
public class OAuth2AuthenticationSuccessHandler extends RedirectServerAuthenticationSuccessHandler {
    // Cấu hình ENV: APP_FRONTEND_URL  (default localhost cho local dev)
    @Value("${app.frontend.url:http://localhost:5174/}")
    private String frontendUrl;

    @Override
    public Mono<Void> onAuthenticationSuccess(WebFilterExchange webFilterExchange, Authentication authentication) {
        ServerHttpResponse response = webFilterExchange.getExchange().getResponse();
        response.setStatusCode(HttpStatus.FOUND);
        response.getHeaders().setLocation(URI.create(frontendUrl));
        return response.setComplete();
    }
}
