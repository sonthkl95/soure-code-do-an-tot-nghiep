package com.ecommerce.identityservice.config;

import com.ecommerce.identityservice.entity.UserEntity;
import com.ecommerce.identityservice.reppository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.web.DefaultRedirectStrategy;
import org.springframework.security.web.RedirectStrategy;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.savedrequest.HttpSessionRequestCache;
import org.springframework.security.web.savedrequest.RequestCache;
import org.springframework.security.web.savedrequest.SavedRequest;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.*;

@Slf4j
@Component
public class IdpLoginSuccessHandler implements AuthenticationSuccessHandler {

    @Value("${application.config.bff-admin-url:http://localhost:8088}")
    private String bffAdminUrl;
    @Value("${application.config.bff-user-url:http://localhost:8081}")
    private String bffUserUrl;

    // Mặc định Spring dùng cái này để lưu request trước khi bị đá sang trang login
    private final RequestCache requestCache = new HttpSessionRequestCache();
    private final RedirectStrategy redirectStrategy = new DefaultRedirectStrategy();
    @Autowired
    private UserRepository userRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        SavedRequest savedRequest = requestCache.getRequest(request, response);
        if (savedRequest != null) {
            redirectStrategy.sendRedirect(request, response, savedRequest.getRedirectUrl());
            return;
        }
        log.debug(String.valueOf(savedRequest));
        Set<String> roles = AuthorityUtils.authorityListToSet(authentication.getAuthorities());
        CustomUserDetail userDetail = (CustomUserDetail) authentication.getPrincipal();
        UserEntity user = userRepository.findById(userDetail.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        Set<String> adminRoles = Set.of("SUPER_ADMIN", "ADMIN", "EMPLOYEE");
        if (adminRoles.contains(user.getRole().getCode())) {
            redirectStrategy.sendRedirect(request, response, bffAdminUrl + "/oauth2/authorization/admin-idp");
            return;
        }
        redirectStrategy.sendRedirect(request, response, bffUserUrl + "/oauth2/authorization/user-idp");
    }
}
