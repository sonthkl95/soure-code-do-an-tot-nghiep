package com.ecommerce.identityservice.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.oidc.OidcScopes;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.settings.ClientSettings;
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.util.UUID;

/**
 * Idempotently seeds the OAuth2 RegisteredClient rows that the BFFs (bff-user, bff-admin)
 * use to perform Authorization Code flow against this Authorization Server.
 *
 * Configuration is read from environment variables / Spring properties so each
 * environment (local / dev / prod) can publish its own redirect URIs without
 * touching code:
 *   APP_SEED_BFF_USER_CLIENT_ID
 *   APP_SEED_BFF_USER_CLIENT_SECRET    (plaintext; will be BCrypt-encoded)
 *   APP_SEED_BFF_USER_REDIRECT_URIS    (comma-separated)
 *   APP_SEED_BFF_USER_POST_LOGOUT_URIS (comma-separated)
 *   APP_SEED_BFF_ADMIN_*               (same shape)
 *
 * If a client with the given client_id already exists the row is updated in place
 * (preserves its UUID id so dependent tables remain valid).
 */
@Component
@Order(0)
public class OAuthClientSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(OAuthClientSeeder.class);

    private final RegisteredClientRepository repo;
    private final PasswordEncoder encoder;

    @Value("${app.seed.bff-user.client-id:}")
    private String userClientId;
    @Value("${app.seed.bff-user.client-secret:}")
    private String userClientSecret;
    @Value("${app.seed.bff-user.redirect-uris:}")
    private String userRedirectUris;
    @Value("${app.seed.bff-user.post-logout-uris:}")
    private String userPostLogoutUris;

    @Value("${app.seed.bff-admin.client-id:}")
    private String adminClientId;
    @Value("${app.seed.bff-admin.client-secret:}")
    private String adminClientSecret;
    @Value("${app.seed.bff-admin.redirect-uris:}")
    private String adminRedirectUris;
    @Value("${app.seed.bff-admin.post-logout-uris:}")
    private String adminPostLogoutUris;

    public OAuthClientSeeder(RegisteredClientRepository repo, PasswordEncoder encoder) {
        this.repo = repo;
        this.encoder = encoder;
    }

    @Override
    public void run(String... args) {
        seed("bff-user", userClientId, userClientSecret, userRedirectUris, userPostLogoutUris);
        seed("bff-admin", adminClientId, adminClientSecret, adminRedirectUris, adminPostLogoutUris);
    }

    private void seed(String label, String clientId, String secret, String redirectCsv, String logoutCsv) {
        if (!StringUtils.hasText(clientId) || !StringUtils.hasText(secret)) {
            log.info("OAuthClientSeeder: skip '{}' — client-id or client-secret not configured", label);
            return;
        }

        RegisteredClient existing = repo.findByClientId(clientId);
        String id = existing != null ? existing.getId() : UUID.randomUUID().toString();

        RegisteredClient.Builder b = RegisteredClient.withId(id)
                .clientId(clientId)
                .clientSecret(encoder.encode(secret))
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
                .scope(OidcScopes.OPENID)
                .scope(OidcScopes.PROFILE)
                .clientSettings(ClientSettings.builder()
                        .requireAuthorizationConsent(false)
                        .requireProofKey(false)
                        .build())
                .tokenSettings(TokenSettings.builder()
                        .accessTokenTimeToLive(Duration.ofHours(1))
                        .refreshTokenTimeToLive(Duration.ofDays(7))
                        .reuseRefreshTokens(false)
                        .build());

        int redirectCount = 0;
        for (String u : redirectCsv.split(",")) {
            String t = u == null ? "" : u.trim();
            if (StringUtils.hasText(t)) {
                b.redirectUri(t);
                redirectCount++;
            }
        }
        for (String u : logoutCsv.split(",")) {
            String t = u == null ? "" : u.trim();
            if (StringUtils.hasText(t)) {
                b.postLogoutRedirectUri(t);
            }
        }

        if (redirectCount == 0) {
            log.warn("OAuthClientSeeder: client '{}' has no redirect-uris configured — skipping", clientId);
            return;
        }

        repo.save(b.build());
        log.info("OAuthClientSeeder: {} client '{}' ({} redirect uris)",
                existing == null ? "INSERTED" : "UPDATED", clientId, redirectCount);
    }
}
