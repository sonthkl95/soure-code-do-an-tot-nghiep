# Tài Liệu Kiểm Thử Hệ Thống Giám Sát
## Đề Tài: Xây Dựng Hệ Thống Monitoring Trên Điện Toán Đám Mây

> **Hệ thống:** TechShop E-Commerce | **Nền tảng:** Google Cloud Platform (asia-southeast1)
> **Stack giám sát:** Prometheus → Alertmanager → Telegram / Slack / Email + GCP Cloud Monitoring

---

## Kiến Trúc Hệ Thống

```
Internet
   │
   ▼
GCP External HTTP Load Balancer
   │  (health check NodePort :30080)
   ├──────────────────────────────────────┐
   ▼                                      ▼
K8s Prod Cluster                    K8s Dev Cluster
Master:  10.20.1.10                 Master:  10.10.1.10
Worker1: 10.20.1.20                 Worker1: 10.10.1.20
Worker2: 10.20.1.21                 Worker2: 10.10.1.21
   │ VPC Peering
   ├─────────────────┐
   ▼                 ▼
DB VM Prod          Data VM (10.60.1.20)
10.20.1.30          Kafka + Redis
MySQL + MongoDB     Elasticsearch
                    MongoDB + Debezium
   │ remote_write metrics
   ▼
Observability VM (10.60.1.x)
Prometheus + Alertmanager
Grafana + Loki + Tempo
   │ alert
   ▼
Telegram / Slack / Email
```

---

## Tổng Quan 15 Tình Huống Kiểm Thử (3 Nhóm)

| Nhóm | Mã | Tình Huống | Mức Độ | Phát Hiện Trong |
|------|----|-----------|--------|-----------------|
| **Hạ Tầng** | INF-01 | Máy chủ GCP ngừng phản hồi (VM down) | Critical | ≤ 2 phút |
| | INF-02 | Ổ đĩa Data VM sắp đầy | Warning → Critical | ≤ 5 phút |
| | INF-03 | RAM cạn kiệt — nguy cơ OOM Killer | Critical | ≤ 3 phút |
| | INF-04 | GCP Load Balancer backend unhealthy | Critical | ≤ 2 phút |
| | INF-05 | Observability VM quá tải — mù giám sát | Warning | ≤ 5 phút |
| **Kubernetes** | K8S-01 | Worker Node NotReady | Critical | ≤ 3 phút |
| | K8S-02 | Pod CrashLoopBackOff | Critical | ≤ 5 phút |
| | K8S-03 | Ingress-nginx Controller down | Critical | ≤ 1 phút |
| | K8S-04 | Deployment thiếu replica | Warning | ≤ 5 phút |
| | K8S-05 | Kubernetes API Server down (Master) | Critical | ≤ 1 phút |
| **Ứng Dụng** | APP-01 | Dịch vụ thanh toán ngừng hoạt động | Critical | ≤ 1 phút |
| | APP-02 | Identity Service down — login bị từ chối | Critical | ≤ 1 phút |
| | APP-03 | MySQL Database ngừng hoạt động | Critical | ≤ 1 phút |
| | APP-04 | Kafka Broker down — pipeline sự kiện đứng | Critical | ≤ 2 phút |
| | APP-05 | Redis down — cache miss cascade | Critical | ≤ 1 phút |

---

# NHÓM 1 — HẠ TẦNG GCP (Terraform-dựng)

> Kiểm thử các tài nguyên do Terraform tạo ra: Compute Engine VMs, Load Balancer, VPC.
> Sự cố ở lớp này ảnh hưởng đến **toàn bộ hệ thống bên trên**.

---

## INF-01: Máy Chủ GCP Ngừng Phản Hồi (VM Down)

### Bối Cảnh Thực Tế
> Trong quá trình bảo trì hàng tháng, một kỹ sư vô tình tắt nhầm VM `db-prod`
> (10.20.1.30) thay vì VM dev. Không có cảnh báo → toàn bộ trang web ngừng hoạt động
> 20 phút trước khi ai đó phát hiện.

### Tài Nguyên Terraform Liên Quan
- `google_compute_instance.gcp-asia-southeast1-vm-db-prod-001` (10.20.1.30)
- `google_compute_instance.gcp-asia-southeast1-vm-data-001` (10.60.1.20)
- `google_compute_instance.gcp-asia-southeast1-vm-k8s-prod-master-1` (10.20.1.10)

### Cách Giả Lập
```bash
gcloud compute instances stop gcp-asia-southeast1-vm-db-prod-001 \
  --zone=asia-southeast1-b --project=<PROJECT_ID_PROD>
```

### Kết Quả Kỳ Vọng
```
[INF-01] Máy chủ GCP MẤT KẾT NỐI: 10.20.1.30:9100 (cluster: prod)
Node Exporter không phản hồi trong 2 phút.
→ Kiểm tra GCP Console: Compute Engine → VM Instances.
```

### Khôi Phục
```bash
gcloud compute instances start gcp-asia-southeast1-vm-db-prod-001 \
  --zone=asia-southeast1-b --project=<PROJECT_ID_PROD>
```

---

## INF-02: Ổ Đĩa Data VM Sắp Đầy

### Bối Cảnh Thực Tế
> Data VM (10.60.1.20) chứa Kafka + Elasticsearch + MongoDB — 100GB pd-balanced.
> Sau 3 tháng không dọn dẹp, ổ đĩa đầy lúc 2 giờ sáng, toàn bộ pipeline dữ liệu
> im lặng dừng lại mà không ai biết đến sáng hôm sau.

### Tài Nguyên Terraform Liên Quan
- `google_compute_instance.gcp-asia-southeast1-vm-data-001` — disk 100GB `pd-balanced`

### Cách Giả Lập
```bash
# SSH vào data-vm qua bastion (10.50.1.100)
df -h /
fallocate -l 85G /tmp/disk_test.tmp

# Dọn dẹp sau test
rm /tmp/disk_test.tmp
```

### Kết Quả Kỳ Vọng
- **Slack** nhận warning (< 20%): "Ổ đĩa còn 18.3% — Kafka/ES có thể ngừng ghi"
- **Telegram** nhận critical (< 10%): "CHỈ CÒN 8.7% — NGUY CƠ database crash"

---

## INF-03: RAM Cạn Kiệt — Nguy Cơ OOM Killer

### Bối Cảnh Thực Tế
> DB Prod VM (e2-medium: 4GB RAM) chạy đồng thời MySQL + MongoDB. Trong đợt
> tải cao, cả hai tranh nhau RAM. Linux OOM Killer âm thầm tắt MySQL lúc 11 giờ đêm.

### Tài Nguyên Terraform Liên Quan
- `google_compute_instance.gcp-asia-southeast1-vm-db-prod-001` — e2-medium (4GB RAM)
- `google_compute_instance.gcp-asia-southeast1-vm-data-001` — e2-standard-2 (8GB RAM)

### Cách Giả Lập
```bash
stress-ng --vm 1 --vm-bytes 90% --timeout 300s
```

### Kết Quả Kỳ Vọng
```
[INF-03] RAM cạn kiệt 93.2% - 10.20.1.30:9100
OOM Killer có thể tắt bất kỳ process nào (MySQL / MongoDB / Kafka).
→ Toàn bộ dữ liệu chưa flush xuống disk có thể bị mất.
```

---

## INF-04: GCP Load Balancer Backend Unhealthy

### Bối Cảnh Thực Tế
> Ingress-nginx trên cả 2 worker prod bị restart cùng lúc sau khi apply config sai.
> GCP Load Balancer health check (port 30080 `/healthz`) fail → trả về 502 cho toàn
> bộ người dùng truy cập website.

### Tài Nguyên Terraform Liên Quan
- `google_compute_backend_service.gcp-asia-southeast1-backend-k8s-prod-techshop-003`
- `google_compute_health_check.gcp-asia-southeast1-hc-k8s-prod-ingress-003`
- Workers NodePort 30080: `10.20.1.20` và `10.20.1.21`

### Cách Giả Lập
```bash
kubectl scale deployment ingress-nginx-controller \
  --replicas=0 -n ingress-nginx
```

### Kết Quả Kỳ Vọng
```
[INF-04] GCP Load Balancer: Backend 10.20.1.20:30080 không phản hồi
→ Toàn bộ HTTP traffic từ GCP Load Balancer bị từ chối (502/503).
→ Website hoàn toàn không truy cập được từ Internet.
```

---

## INF-05: Observability VM Quá Tải — Rủi Ro "Mù Giám Sát"

### Bối Cảnh Thực Tế
> Đây là tình huống đặc biệt: chính máy chủ giám sát bị quá tải. Prometheus
> scrape chậm → alert bị trễ. Grafana crash → dashboard trống. Đội vận hành
> mất đi "con mắt" của hệ thống đúng lúc cần nhất.

### Cách Giả Lập
```bash
# Trên observability-vm (10.60.1.x)
stress-ng --cpu 2 --cpu-load 85 --timeout 300s
```

### Kết Quả Kỳ Vọng
```
[INF-05] Observability VM quá tải CPU: 87.4%
→ Prometheus scrape bị trễ, alert có thể không được gửi đúng giờ.
→ Grafana dashboard bị chậm, dữ liệu không cập nhật real-time.
```

---

# NHÓM 2 — CỤM KUBERNETES

> Kiểm thử K8s clusters trên các VM Terraform đã dựng.
> Sự cố ở lớp này ảnh hưởng đến **việc chạy và phân phối ứng dụng**.

---

## K8S-01: Kubernetes Worker Node NotReady

### Bối Cảnh Thực Tế
> Worker-2 của prod cluster (10.20.1.21) bị mất kết nối mạng nội bộ.
> Kubernetes tự reschedule Pod sang worker-1, nhưng cluster mất khả năng
> chịu lỗi — nếu worker-1 cũng sự cố, toàn hệ thống sập.

### Cách Giả Lập
```bash
# SSH vào worker-2 (10.20.1.21) qua bastion
sudo systemctl stop kubelet

# Theo dõi từ master
kubectl get nodes -w
```

### Kết Quả Kỳ Vọng
```
[K8S-01] K8s Node KHÔNG SẴN SÀNG: gcp-asia-southeast1-vm-k8s-prod-worker-2 (prod)
→ Kubernetes đang reschedule Pod sang node còn lại.
→ Cluster mất khả năng chịu lỗi (single point of failure).
```

### Khôi Phục
```bash
sudo systemctl start kubelet
kubectl uncordon gcp-asia-southeast1-vm-k8s-prod-worker-2
```

---

## K8S-02: Pod CrashLoopBackOff

### Bối Cảnh Thực Tế
> Sau khi deploy phiên bản mới `order-service`, developer quên cập nhật
> Secret chứa `DB_HOST`. Pod liên tục crash. Website vẫn "xanh" trên GCP
> Console nhưng tính năng đặt hàng thất bại hoàn toàn.

### Cách Giả Lập
```bash
kubectl set env deployment/order-service \
  DB_HOST=wrong-host-does-not-exist -n prod

kubectl get pods -n prod -w | grep order-service
```

### Kết Quả Kỳ Vọng
```
[K8S-02] Pod order-service-7d4f9b-xk2lm CrashLoop 5 lần/15 phút
→ Dịch vụ order-service không ổn định.
→ Nguyên nhân thường gặp: sai biến môi trường DB_HOST / SECRET / PORT.
```

### Khôi Phục
```bash
kubectl rollout undo deployment/order-service -n prod
```

---

## K8S-03: Ingress-nginx Controller Down

### Bối Cảnh Thực Tế
> Ingress-nginx là "cổng duy nhất" nhận traffic từ GCP Load Balancer và
> phân phối đến từng microservice. Khi down, **100% người dùng** thấy lỗi
> 502/503 dù tất cả microservice bên trong vẫn hoạt động bình thường.

### Cách Giả Lập
```bash
kubectl scale deployment ingress-nginx-controller \
  --replicas=0 -n ingress-nginx

curl -I http://<EXTERNAL_LB_IP>/
# Expected: 502 Bad Gateway
```

### Kết Quả Kỳ Vọng
```
[K8S-03] Ingress-nginx NGỪNG HOẠT ĐỘNG - Cluster prod
→ Toàn bộ HTTP/HTTPS traffic từ GCP Load Balancer bị từ chối (502/503).
→ Website hoàn toàn không truy cập được từ Internet.
```

### Khôi Phục
```bash
kubectl scale deployment ingress-nginx-controller \
  --replicas=2 -n ingress-nginx
```

---

## K8S-04: Deployment Thiếu Replica

### Bối Cảnh Thực Tế
> `catalog-service` cấu hình 2 replicas để đảm bảo HA. Sau 1 Node fail,
> chỉ còn 1 replica. Prometheus cảnh báo sớm giúp team bổ sung tài nguyên
> trước khi replica duy nhất cũng gặp sự cố.

### Cách Giả Lập
```bash
kubectl drain gcp-asia-southeast1-vm-k8s-prod-worker-2 \
  --ignore-daemonsets --delete-emptydir-data
```

### Kết Quả Kỳ Vọng
```
[K8S-04] Deployment catalog-service thiếu replica (prod)
Chỉ có 1/2 replica sẵn sàng.
→ Khả năng xử lý request giảm 50%, có thể gây chậm dưới tải cao.
```

---

## K8S-05: Kubernetes API Server Down (Master Node)

### Bối Cảnh Thực Tế
> Master node (10.20.1.10) bị quá tải etcd I/O, kube-apiserver không phản hồi.
> Các Pod đang chạy vẫn sống, nhưng không deploy được hotfix, không scale được
> service trong lúc đang xử lý khủng hoảng — tình huống nguy hiểm nhất.

### Cách Giả Lập
```bash
# SSH vào master node (10.20.1.10)
sudo systemctl stop kube-apiserver
```

### Kết Quả Kỳ Vọng
```
[K8S-05] Kubernetes API Server NGỪNG HOẠT ĐỘNG - prod
kube-apiserver tại 10.20.1.10:6443 không phản hồi.
→ Không thể deploy, scale, hay quản lý Pod nào trong cluster prod.
→ Các Pod đang chạy vẫn sống nhưng KHÔNG THỂ tự phục hồi nếu crash.
```

---

# NHÓM 3 — ỨNG DỤNG (Microservices + Data Services)

> Kiểm thử các dịch vụ chạy bên trong Kubernetes.
> Sự cố ở lớp này ảnh hưởng trực tiếp đến **trải nghiệm người dùng và doanh thu**.

---

## APP-01: Dịch Vụ Thanh Toán Ngừng Hoạt Động

### Bối Cảnh Thực Tế
> Năm 2021, Shopee Việt Nam gặp sự cố thanh toán 2 giờ → thiệt hại hàng tỷ đồng.
> `payment-service` là dịch vụ quan trọng nhất về doanh thu. Mỗi phút downtime =
> 100% đơn hàng trong thời điểm đó bị mất.

### Cách Giả Lập
```bash
kubectl scale deployment payment-service --replicas=0 -n prod

curl -X POST http://<LB_IP>/api/payment/checkout
# Expected: 503 Service Unavailable
```

### Kết Quả Kỳ Vọng
```
[APP-01] Dịch vụ thanh toán NGỪNG HOẠT ĐỘNG
payment-service không phản hồi > 1 phút.
→ Khách hàng KHÔNG THỂ thanh toán và đặt hàng.
```

### Khôi Phục
```bash
kubectl scale deployment payment-service --replicas=2 -n prod
```

---

## APP-02: Identity Service Down — Toàn Bộ Login Bị Từ Chối

### Bối Cảnh Thực Tế
> `identity-service` là gateway xác thực JWT cho mọi API call. Khi down,
> toàn bộ người dùng bị đăng xuất và không ai đăng nhập được — kể cả admin
> đang cố vào hệ thống để xử lý sự cố khác.

### Cách Giả Lập
```bash
kubectl scale deployment identity-service --replicas=0 -n prod

curl -X POST http://<LB_IP>/api/auth/login \
  -d '{"username":"test","password":"test"}'
# Expected: 503 Service Unavailable
```

### Kết Quả Kỳ Vọng
```
[APP-02] Identity Service NGỪNG HOẠT ĐỘNG - Toàn bộ login bị từ chối
→ 100% người dùng bị đăng xuất. Không ai đăng nhập được vào hệ thống.
→ Tất cả API yêu cầu xác thực đều trả về HTTP 401/503.
```

---

## APP-03: MySQL Database Ngừng Hoạt Động

### Bối Cảnh Thực Tế
> MySQL (db-prod: 10.20.1.30) lưu: `users`, `products`, `orders`, `payments`.
> Khi MySQL down, website hoàn toàn tê liệt dù K8s và ingress-nginx vẫn bình thường.
> Đây là bằng chứng rõ ràng nhất cho giá trị giám sát lớp ứng dụng.

### Cách Giả Lập
```bash
# SSH vào db-prod (10.20.1.30) qua bastion (10.50.1.100)
sudo systemctl stop mysql

# Sau test
sudo systemctl start mysql
```

### Kết Quả Kỳ Vọng
```
[APP-03] MySQL NGỪNG HOẠT ĐỘNG - 10.20.1.30:9104
→ Toàn bộ website tê liệt: không đăng nhập, không xem sản phẩm, không đặt hàng.
```

Grafana: `mysql_up` = 0 (màu đỏ) chính xác theo timeline.

---

## APP-04: Kafka Broker Down — Pipeline Sự Kiện Bị Đứng

### Bối Cảnh Thực Tế
> Kafka (data-vm: 10.60.1.20) là trung tâm event-driven:
> `order-service` → publish → `payment-service` consume → `inventory-service` consume.
> Khi Kafka down, đơn hàng được tạo thành công nhưng thanh toán và trừ kho
> **không bao giờ xảy ra** — "đơn hàng ma", rất khó phát hiện nếu không có giám sát.

### Cách Giả Lập
```bash
# SSH vào data-vm (10.60.1.20) qua bastion
sudo systemctl stop kafka

# Đặt thử 1 đơn hàng từ frontend
# → Order tạo thành công nhưng payment không được kích hoạt
```

### Kết Quả Kỳ Vọng
```
[APP-04] Kafka Broker NGỪNG HOẠT ĐỘNG - 10.60.1.20
→ Luồng sự kiện: Đặt hàng → Thanh toán → Cập nhật kho bị ĐỨNG HOÀN TOÀN.
→ Debezium CDC dừng → Elasticsearch search-service bị lệch dữ liệu.
```

---

## APP-05: Redis Down — Hiệu Ứng Domino Cache Miss

### Bối Cảnh Thực Tế
> Redis (data-vm: 10.60.1.20) cache danh sách sản phẩm, session, giỏ hàng.
> Khi Redis down, mọi request đánh thẳng vào MySQL → MySQL quá tải connection
> pool → MySQL crash theo. Đây là **cascade failure** điển hình:
> 1 cache sập kéo DB sập theo dây chuyền.

### Cách Giả Lập
```bash
# SSH vào data-vm (10.60.1.20)
sudo systemctl stop redis

# Chờ 1-2 phút: quan sát MySQL connection pool tăng vọt trong Grafana
```

### Kết Quả Kỳ Vọng
```
[APP-05] Redis Cache NGỪNG HOẠT ĐỘNG - 10.60.1.20
→ Toàn bộ request cache-miss → đánh thẳng vào MySQL (10.20.1.30).
→ Nguy cơ: MySQL quá tải connection pool → cascade failure.
```

Trên Grafana: đường **Redis `up`** về 0, đồng thời **MySQL connections** tăng đột biến
— minh họa trực quan hiệu ứng domino.

---

## Hướng Dẫn Deploy Alert Rules

```bash
# Deploy toàn bộ 15 rules lên Prometheus (không cần restart)
cd ansible-code/
ansible-playbook playbooks/observability.yml --tags prometheus

# Kiểm tra rules đã load
curl http://<observability-vm>:9090/api/v1/rules | python3 -m json.tool | grep '"name"'
```

Truy cập `http://<observability-vm>:9090/rules` → Phải thấy đủ 15 groups.

---

## Tổng Kết — Giá Trị 3 Lớp Giám Sát

| Lớp | Phát Hiện Sự Cố | Giá Trị Đặc Trưng |
|-----|-----------------|-------------------|
| **Hạ tầng (Terraform)** | VM down, disk full, RAM OOM, LB fail | Phát hiện **trước khi ứng dụng bị ảnh hưởng** |
| **Kubernetes** | Node NotReady, CrashLoop, Ingress down | Phát hiện sự cố **không hiển thị trên GCP Console** |
| **Ứng dụng** | Service down, DB crash, Kafka lag, Cache miss | Liên kết trực tiếp với **doanh thu và trải nghiệm khách hàng** |

| Tiêu Chí | Không Có Giám Sát | Có Hệ Thống Giám Sát |
|----------|-------------------|----------------------|
| Phát hiện sự cố | Khách hàng phản ánh (30-60 phút) | Tự động trong **< 2 phút** |
| Thông báo | Email thủ công, gọi điện | Tự động Telegram/Slack/Email |
| Dữ liệu lịch sử | Không có | Lưu 7 ngày, tra cứu ngay |
| Phòng ngừa | Không có | Cảnh báo sớm trước khi sự cố (INF-02, INF-05, APP-03) |
| Vận hành | Cần người trực 24/7 | Tự động hóa hoàn toàn |
