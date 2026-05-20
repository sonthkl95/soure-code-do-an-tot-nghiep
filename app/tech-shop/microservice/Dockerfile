# syntax=docker/dockerfile:1.7
# =============================================================================
# Build chung cho mọi service trong multi-module project.
# Usage:
#   docker build --build-arg SERVICE_NAME=catalog-service -t catalog-service:1.0 .
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Resolve & cache Maven dependencies (chỉ rebuild khi pom thay đổi)
# -----------------------------------------------------------------------------
FROM maven:3.9-eclipse-temurin-21 AS deps
ARG SERVICE_NAME
WORKDIR /workspace

COPY pom.xml .
COPY bff-admin/pom.xml         bff-admin/pom.xml
COPY bff-user/pom.xml          bff-user/pom.xml
COPY catalog-service/pom.xml   catalog-service/pom.xml
COPY discovery-service/pom.xml discovery-service/pom.xml
COPY identity-service/pom.xml  identity-service/pom.xml
COPY inventory-service/pom.xml inventory-service/pom.xml
COPY order-service/pom.xml     order-service/pom.xml
COPY payment-service/pom.xml   payment-service/pom.xml
COPY search-service/pom.xml    search-service/pom.xml

RUN --mount=type=cache,target=/root/.m2 \
    mvn -pl ${SERVICE_NAME} -am dependency:go-offline -DskipTests -B -q

# -----------------------------------------------------------------------------
# Stage 2: Compile + extract Spring Boot layered jar
# -----------------------------------------------------------------------------
FROM deps AS builder
ARG SERVICE_NAME

COPY . .
RUN --mount=type=cache,target=/root/.m2 \
    mvn -pl ${SERVICE_NAME} -am clean package -DskipTests -B -q && \
    mkdir -p /build && \
    cp ${SERVICE_NAME}/target/*.jar /build/app.jar && \
    cd /build && \
    java -Djarmode=layertools -jar app.jar extract && \
    rm app.jar

# -----------------------------------------------------------------------------
# Stage 3: Download OpenTelemetry Java Agent (cache độc lập)
# -----------------------------------------------------------------------------
FROM alpine:3.20 AS otel
ARG OTEL_AGENT_VERSION=2.10.0
ADD --chmod=644 \
    https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v${OTEL_AGENT_VERSION}/opentelemetry-javaagent.jar \
    /opentelemetry-javaagent.jar

# -----------------------------------------------------------------------------
# Stage 4: Runtime – distroless, non-root, minimal attack surface
# -----------------------------------------------------------------------------
FROM gcr.io/distroless/java21-debian12:nonroot

ARG SERVICE_NAME
ARG BUILD_DATE=unknown
ARG VCS_REF=unknown

LABEL org.opencontainers.image.title="${SERVICE_NAME}" \
      org.opencontainers.image.vendor="techshop" \
      org.opencontainers.image.source="https://github.com/Pham-Van-Khiem-Toan-Tin/microservice" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.base.name="gcr.io/distroless/java21-debian12:nonroot"

WORKDIR /app

# Layered jar — thứ tự từ ÍT thay đổi → THAY ĐỔI NHIỀU (tối đa cache hit)
COPY --from=builder --chown=nonroot:nonroot /build/dependencies/          ./
COPY --from=builder --chown=nonroot:nonroot /build/spring-boot-loader/    ./
COPY --from=builder --chown=nonroot:nonroot /build/snapshot-dependencies/ ./
COPY --from=builder --chown=nonroot:nonroot /build/application/           ./

COPY --from=otel    --chown=nonroot:nonroot /opentelemetry-javaagent.jar  /app/otel-javaagent.jar

# ---- OpenTelemetry (override được khi run / qua K8s env) ----
ENV OTEL_SERVICE_NAME=${SERVICE_NAME} \
    OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317 \
    OTEL_EXPORTER_OTLP_PROTOCOL=grpc \
    OTEL_TRACES_EXPORTER=otlp \
    OTEL_METRICS_EXPORTER=none \
    OTEL_LOGS_EXPORTER=none \
    OTEL_RESOURCE_ATTRIBUTES=deployment.environment=prod

# ---- JVM tuning: container-aware + javaagent auto-attach ----
ENV JAVA_TOOL_OPTIONS="\
-XX:MaxRAMPercentage=75.0 \
-XX:InitialRAMPercentage=50.0 \
-XX:+UseG1GC \
-XX:+UseStringDeduplication \
-XX:+ExitOnOutOfMemoryError \
-Djava.security.egd=file:/dev/./urandom \
-Dfile.encoding=UTF-8 \
-javaagent:/app/otel-javaagent.jar"

USER nonroot
EXPOSE 8080

# Exec form → SIGTERM truyền thẳng tới JVM → graceful shutdown
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
