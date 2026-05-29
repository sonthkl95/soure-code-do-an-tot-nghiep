package com.ecommerce.identityservice.config;


import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.json.JsonMapper;
import org.springframework.beans.factory.BeanClassLoaderAware;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.jackson2.SecurityJackson2Modules;
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession;

@EnableRedisHttpSession(redisNamespace = "spring:session:idp", maxInactiveIntervalInSeconds = 60 * 60 * 24 * 30)
@Configuration
public class SessionConfig implements BeanClassLoaderAware {

    private ClassLoader loader;

    /**
     * Note that the bean name for this bean is intentionally
     * {@code springSessionDefaultRedisSerializer}. It must be named this way to override
     * the default {@link RedisSerializer} used by Spring Session.
     */
    @Bean
    public RedisSerializer<Object> springSessionDefaultRedisSerializer() {
        return new Jackson2JsonRedisSerializer<>(objectMapper(), Object.class);
    }

    /**
     * Customized {@link JsonMapper} to add mix-in for class that doesn't have default
     * constructors
     * @return the {@link JsonMapper} to use
     */
    private JsonMapper objectMapper() {
        JsonMapper mapper = JsonMapper.builder()
                .addModules(SecurityJackson2Modules.getModules(this.loader))
                .build();
        // InternalAuthenticationServiceException không có trong Spring Security Jackson
        // allowlist mặc định. Khi login thất bại, Spring lưu exception này vào Redis session,
        // lần load session tiếp theo sẽ throw SerializationException → HTTP 500 loop.
        // Fix: đăng ký mixin để class được nhận diện trong allowlist.
        mapper.addMixIn(InternalAuthenticationServiceException.class,
                InternalAuthenticationServiceExceptionMixin.class);
        return mapper;
    }

    /*
     * @see
     * org.springframework.beans.factory.BeanClassLoaderAware#setBeanClassLoader(java.lang
     * .ClassLoader)
     */
    @Override
    public void setBeanClassLoader(ClassLoader classLoader) {
        this.loader = classLoader;
    }

    @JsonTypeInfo(use = JsonTypeInfo.Id.CLASS)
    @JsonAutoDetect(
            fieldVisibility  = JsonAutoDetect.Visibility.ANY,
            getterVisibility = JsonAutoDetect.Visibility.NONE,
            isGetterVisibility = JsonAutoDetect.Visibility.NONE)
    // Bỏ qua các field kế thừa từ Throwable (cause, stackTrace, suppressed)
    // để tránh cascade deserialization fail khi cause là class ngoài allowlist.
    @JsonIgnoreProperties(value = {"cause", "stackTrace", "suppressed", "localizedMessage"}, ignoreUnknown = true)
    abstract static class InternalAuthenticationServiceExceptionMixin {}
}
