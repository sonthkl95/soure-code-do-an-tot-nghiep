package com.ecommerce.identityservice.config;

import com.ecommerce.identityservice.service.impl.CustomUserDetailService;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.authorization.OAuth2TokenType;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configuration.OAuth2AuthorizationServerConfiguration;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configurers.OAuth2AuthorizationServerConfigurer;
import org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings;
import org.springframework.security.oauth2.server.authorization.token.JwtEncodingContext;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenCustomizer;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.security.web.util.matcher.MediaTypeRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.web.client.RestTemplate;

import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class WebConfig {
    @Autowired
    private IdpLoginSuccessHandler idpLoginSuccessHandler;

    // RSA key persistent — đọc từ Secret (IDP_RSA_PRIVATE_KEY / IDP_RSA_PUBLIC_KEY).
    // Nếu không có env (local dev) thì fallback sinh key mới (in-memory).
    @Value("${IDP_RSA_PRIVATE_KEY:}")
    private String rsaPrivateKeyPem;
    @Value("${IDP_RSA_PUBLIC_KEY:}")
    private String rsaPublicKeyPem;
    @Bean
    @Order(1)
    public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
        OAuth2AuthorizationServerConfigurer authorizationServerConfigurer =
                new OAuth2AuthorizationServerConfigurer();
        authorizationServerConfigurer
                .oidc(oidc -> oidc
                        .userInfoEndpoint(Customizer.withDefaults()) // <--- 1. Bật endpoint này lên
                );
        RequestMatcher endpointsMatcher = authorizationServerConfigurer.getEndpointsMatcher();

        http
                // CHỈ chain này match các endpoint OAuth2/OIDC
                .securityMatcher(endpointsMatcher)

                // mọi request thuộc matcher này phải auth
                .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())

                // CSRF ignore cho token/introspect/revoke...
                .csrf(csrf -> csrf.ignoringRequestMatchers(endpointsMatcher))

                // APPLY đúng instance configurer này
                .with(authorizationServerConfigurer, authServer ->
                        authServer.oidc(Customizer.withDefaults())
                )

                .cors(Customizer.withDefaults())

                .exceptionHandling(ex -> ex
                        .defaultAuthenticationEntryPointFor(
                                new LoginUrlAuthenticationEntryPoint("/login"),
                                new MediaTypeRequestMatcher(MediaType.TEXT_HTML)
                        )
                );

        return http.build();
    }
    @Bean
    @Order(2)
    public SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(authorizeRequests -> authorizeRequests
                        .requestMatchers("/actuator/health/**", "/actuator/info", "/actuator/prometheus").permitAll()
                        .requestMatchers("/register", "/terms", "/privacy", "/logout","/login","/locations/**", "/verify-email", "forgot-password", "new-password", "/role/**","/favicon.ico",
                                "/css/**", "/js/**", "/images/**", "/fontawesome/**", "/error", "/webjars/**", "/favicon.ico", "/.well-known/appspecific/com.chrome.devtools.json")
                        .permitAll()
                        .anyRequest().authenticated())
                .cors(Customizer.withDefaults())
                .formLogin(login -> {
                    login.loginPage("/login")
                            .successHandler(idpLoginSuccessHandler)
                            // Không lưu exception vào Redis session — tránh SerializationException loop
                            // khi exception class không nằm trong Jackson allowlist.
                            .failureHandler(new SimpleUrlAuthenticationFailureHandler("/login?error") {{
                                setSaveException(false);
                            }});
                })
                .logout(logout -> logout.deleteCookies("IDP_SESSION")
                        .logoutUrl("/logout"))
                .oauth2ResourceServer(resourceServer -> resourceServer
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
                );
        return http.build();
    }

    @Bean
    public OAuth2TokenCustomizer<JwtEncodingContext> jwtCustomizer() {
        return context -> {
            if (OAuth2TokenType.ACCESS_TOKEN.equals(context.getTokenType())) {
                context.getClaims().claims((claims) -> {
                   Authentication principal = context.getPrincipal();
                   CustomUserDetail principalCustomUserDetail = (CustomUserDetail) principal.getPrincipal();
                   claims.put("email", principalCustomUserDetail.getEmail());
                   Set<String> authorities = principal.getAuthorities().stream()
                           .map(GrantedAuthority::getAuthority)
                           .collect(Collectors.toSet());
                    claims.put("authorities", authorities);
                });
            }
        };
    }
    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
        grantedAuthoritiesConverter.setAuthoritiesClaimName("authorities");
        grantedAuthoritiesConverter.setAuthorityPrefix("");
        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
        return jwtAuthenticationConverter;
    }
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    @Bean
    public JWKSource<SecurityContext> jwkSource() {
        KeyPair keyPair = loadOrGenerateRsaKey();
        RSAPublicKey publicKey = (RSAPublicKey) keyPair.getPublic();
        RSAPrivateKey privateKey = (RSAPrivateKey) keyPair.getPrivate();
        RSAKey rsaKey = new RSAKey.Builder(publicKey)
                .privateKey(privateKey)
                .keyID(UUID.randomUUID().toString())
                .build();
        JWKSet jwkSet = new JWKSet(rsaKey);
        return new ImmutableJWKSet<>(jwkSet);
    }

    private KeyPair loadOrGenerateRsaKey() {
        if (rsaPrivateKeyPem != null && !rsaPrivateKeyPem.isBlank()
                && rsaPublicKeyPem != null && !rsaPublicKeyPem.isBlank()) {
            try {
                KeyFactory kf = KeyFactory.getInstance("RSA");
                String privateStripped = rsaPrivateKeyPem
                        .replace("-----BEGIN PRIVATE KEY-----", "")
                        .replace("-----END PRIVATE KEY-----", "")
                        .replaceAll("\\s+", "");
                String publicStripped = rsaPublicKeyPem
                        .replace("-----BEGIN PUBLIC KEY-----", "")
                        .replace("-----END PUBLIC KEY-----", "")
                        .replaceAll("\\s+", "");
                RSAPrivateKey privateKey = (RSAPrivateKey) kf.generatePrivate(
                        new PKCS8EncodedKeySpec(Base64.getDecoder().decode(privateStripped)));
                RSAPublicKey publicKey = (RSAPublicKey) kf.generatePublic(
                        new X509EncodedKeySpec(Base64.getDecoder().decode(publicStripped)));
                return new KeyPair(publicKey, privateKey);
            } catch (Exception e) {
                throw new IllegalStateException("Failed to load RSA key from IDP_RSA_PRIVATE_KEY/IDP_RSA_PUBLIC_KEY env", e);
            }
        }
        // Fallback: sinh key mới (local dev only — không persistent)
        return generateRsaKey();
    }

    private static KeyPair generateRsaKey() {
        KeyPair keyPair;
        try {
            KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
            keyPairGenerator.initialize(2048);
            keyPair = keyPairGenerator.generateKeyPair();
        }
        catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
        return keyPair;
    }

    @Bean
    public JwtDecoder jwtDecoder(JWKSource<SecurityContext> jwkSource) {
        return OAuth2AuthorizationServerConfiguration.jwtDecoder(jwkSource);
    }
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
    @Bean
    public AuthorizationServerSettings authorizationServerSettings() {
        return AuthorizationServerSettings.builder().build();
    }
}