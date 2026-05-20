# Tech-shop — Kubernetes manifests (Kustomize)

Bộ manifest triển khai 9 service Spring Boot lên 2 cluster K8s (dev + prod) đã
được dựng sẵn bằng Terraform + Ansible.

## Cấu trúc

```
k8s/
├── base/                          # Manifest dùng chung (KHÔNG sửa khi deploy)
│   ├── namespace.yaml             # ns: techshop
│   ├── app-config.yaml            # ConfigMap: Eureka URL, issuer-uri, inter-service URLs, OTel
│   ├── app-secrets.example.yaml   # Mẫu Secret (Cloudinary, SMTP, SePay, VNPay, OAuth clients)
│   ├── discovery-service.yaml     # Eureka registry (StatefulSet 1 replica, headless svc)
│   ├── identity-service.yaml      # OAuth2 Authorization Server + MySQL identity
│   ├── catalog-service.yaml       # MongoDB ecommerce + Cloudinary
│   ├── order-service.yaml         # MySQL order_db + Kafka
│   ├── inventory-service.yaml    # MySQL inventory + Kafka
│   ├── payment-service.yaml       # MySQL payment + Kafka + SePay/VNPay
│   ├── search-service.yaml        # MongoDB outbox + ES sink
│   ├── bff-user.yaml              # Gateway user (port 8081)
│   ├── bff-admin.yaml             # Gateway admin (port 8088)
│   ├── ingress.yaml               # NGINX Ingress (3 host)
│   └── kustomization.yaml
└── overlays/
    ├── dev/
    │   ├── kustomization.yaml     # tag :dev, profile=k8s,dev, 1 replica
    │   ├── app-secrets.yaml       # ← TỰ TẠO từ app-secrets.example.yaml
    │   └── patches/
    │       ├── replicas.yaml
    │       ├── ingress-hosts.yaml # *.dev.techshop.local
    │       └── bff-redirect.yaml  # redirect URI dev
    └── prod/
        ├── kustomization.yaml     # tag :prod, profile=k8s,prod, replicas + HPA
        ├── app-secrets.yaml       # ← TỰ TẠO
        └── patches/
            ├── replicas.yaml
            ├── ingress-hosts.yaml # *.techshop.io + TLS
            ├── bff-redirect.yaml
            └── hpa.yaml
```

## Phụ thuộc bên ngoài cluster

ConfigMap `data-endpoints` + Secret `data-credentials` **được Ansible role `app`
apply trước** (chứa endpoint Kafka/Mongo/Redis/ES + MySQL credentials theo env).
Các Deployment dùng `envFrom: configMapRef/secretRef` để inject vào Spring Boot.

```bash
# Bước 1 — chạy Ansible role app trên master node của từng cluster
cd ansible-code
ansible-playbook -i inventory/hosts.ini playbooks/app.yml --ask-vault-pass
```

## Triển khai

### Lần đầu — tạo file secret

```bash
# Dev
cp k8s/base/app-secrets.example.yaml k8s/overlays/dev/app-secrets.yaml
# Mở file → điền CLOUDINARY_*, GOOGLE_APP_PASSWORD, SEPAY_*, VNPAY_*, BFF_*_CLIENT_SECRET

# Prod (tương tự)
cp k8s/base/app-secrets.example.yaml k8s/overlays/prod/app-secrets.yaml
```

> File `app-secrets.yaml` đã được liệt kê trong `.gitignore`. Tốt hơn nữa thì
> dùng [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets) hoặc
> External Secrets Operator + GCP Secret Manager.

### Apply lên cluster

```bash
# DEV cluster (kubectl context = dev)
kubectl --context=k8s-dev apply -k k8s/overlays/dev

# PROD cluster
kubectl --context=k8s-prod apply -k k8s/overlays/prod
```

### Theo dõi trạng thái

```bash
kubectl -n techshop get pods -w
kubectl -n techshop logs -f deploy/identity-service
kubectl -n techshop get ingress
```

### Rollout image mới (CI/CD)

```bash
# Set image tag mới
cd k8s/overlays/prod
kustomize edit set image \
  ghcr.io/pham-van-khiem-toan-tin/catalog-service=ghcr.io/pham-van-khiem-toan-tin/catalog-service:1.2.3
kubectl --context=k8s-prod apply -k .
```

## Sơ đồ phụ thuộc khởi động

```
discovery-service (8761)
        ▲
        │ register
        │
identity-service (8085) ──── MySQL (identity)
        ▲                ──── Redis (session)
        │ issuer-uri
        │
┌───────┴──────────────────────────────────────┐
│                                              │
catalog (8083)  order (8084)  inventory (8086) payment (8090)  search (8087)
   │ Mongo         │ MySQL       │ MySQL          │ MySQL          │ Mongo+ES
   │ Kafka         │ Kafka       │ Kafka          │ Kafka          │ Kafka
        ▲
        │ resource server (verify JWT issued by identity)
        │
   bff-user (8081)  ◄── shop.*  (Ingress)
   bff-admin (8088) ◄── admin.* (Ingress)
```

## Port reference (in-cluster DNS)

| Service           | Port | DNS                                          |
|-------------------|------|----------------------------------------------|
| discovery-service | 8761 | `discovery-service.techshop.svc.cluster.local` |
| bff-user          | 8081 | `bff-user.techshop`                          |
| catalog-service   | 8083 | `catalog-service.techshop`                   |
| order-service     | 8084 | `order-service.techshop`                     |
| identity-service  | 8085 | `identity-service.techshop`                  |
| inventory-service | 8086 | `inventory-service.techshop`                 |
| search-service    | 8087 | `search-service.techshop`                    |
| bff-admin         | 8088 | `bff-admin.techshop`                         |
| payment-service   | 8090 | `payment-service.techshop`                   |

## Spring Boot Actuator

Mọi Deployment expose `/actuator/health/{readiness,liveness}` cho probe và
`/actuator/prometheus` cho Prometheus Agent (scrape qua annotation
`prometheus.io/scrape: "true"`).

Nếu Actuator chưa enable trong `application.yml`, thêm vào `pom.xml`:

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

Và vào `application.yml`:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus
  endpoint:
    health:
      probes:
        enabled: true
      show-details: when-authorized
```
