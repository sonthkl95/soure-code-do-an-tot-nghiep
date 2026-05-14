# Hướng dẫn triển khai dự án End-to-End

> Đồ án tốt nghiệp: Landing Zone GCP + HA Kubernetes (Dev/Prod) + Observability Stack (Metrics/Logs/Traces).
> Toàn bộ quá trình deploy chia làm **2 giai đoạn**: **Terraform** (hạ tầng GCP) → **Ansible** (cấu hình OS, K8s, observability).

---

## 0. Yêu cầu trước khi bắt đầu

### 0.1. Trên máy local
| Công cụ | Phiên bản tối thiểu | Cách cài |
|---|---|---|
| `gcloud` CLI | 470+ | https://cloud.google.com/sdk/docs/install |
| `terraform` | 1.5.0 | https://developer.hashicorp.com/terraform/install |
| `git` | bất kỳ | — |

### 0.2. Trên Google Cloud
- 1 **GCP Organization** (lấy `org_id`).
- 1 **Billing Account** đã active (lấy `billing_account`).
- 1 user có quyền **Organization Admin** + **Billing Account User**.
- Quota đủ trong region `asia-southeast1` cho ~**14 VM** `e2-standard-2` (3+2 master/worker × 2 cluster + bastion + observability).

### 0.3. Authenticate gcloud
```bash
gcloud auth login
gcloud auth application-default login
```

---

## 1. Giai đoạn 1 — Terraform (Hạ tầng GCP)

### 1.1. Cấu trúc cần tạo
Terraform sẽ tạo:
- 6 GCP **projects** (hub-net, shared-vpc-dev/prod, shared-access, dev-env, prod-env, observability).
- **VPC Hub-and-Spoke** với HA VPN Gateway, Cloud NAT, Internal/External LB.
- 14 **Compute Engine VM** (bastion, observability, 3 master + 2 worker × 2 cluster).
- IAM roles, OS Login, service account `gcp-apse1-sa-tf-001`.
- Cloud Monitoring + Cloud Logging.
- Static external IP cho LB và VPN.

### 1.2. Cấu hình biến
Mở [terraform-code/terraform.tfvars](terraform-code/terraform.tfvars) và điền giá trị thật:

```hcl
org_id              = "123456789012"
billing_account     = "01A2B3-C4D5E6-7890FA"
developer_email     = "ten-cua-ban@gmail.com"
vpn_shared_secret_1 = "<random 32+ ký tự mạnh>"
vpn_shared_secret_2 = "<random 32+ ký tự mạnh>"
```

> **Lưu ý bảo mật:** thêm `terraform.tfvars` vào `.gitignore` trước khi commit.

### 1.3. Init / Plan / Apply
```powershell
cd terraform-code
terraform init
terraform plan  -out=tfplan
terraform apply tfplan
```

Quá trình apply mất ~**15–25 phút** (nhiều API và quota check). Nếu lỗi `API not enabled` chạy lại `terraform apply` 1–2 lần (file `service-usage.tf` enable API có độ trễ propagate).

### 1.4. Lấy output cần thiết cho Ansible
```powershell
terraform output bastion_host_public_ip
terraform output observability_vm_private_ip
terraform output terraform_service_account_email
```

Ghi lại các IP này.

### 1.5. (Tuỳ chọn) Cấu hình VPN on-prem
Trong file [cloud-vpn.tf](terraform-code/cloud-vpn.tf) đã có HA VPN Gateway. Phía on-prem (firewall của bạn) cần dùng đúng `vpn_shared_secret_1/2` và 2 IP từ output `vpn_gateway_interface_0_ip` / `vpn_gateway_interface_1_ip`.

---

## 2. Giai đoạn 2 — Ansible (cấu hình + ứng dụng)

Toàn bộ Ansible chạy **trên Bastion Host** (đóng vai trò Ansible Controller). Bastion là VM duy nhất có IP public.

### 2.1. SSH vào Bastion
```powershell
gcloud compute ssh bastion-host `
  --project=$(terraform -chdir=terraform-code output -raw project_id_shared_access) `
  --zone=asia-southeast1-a
```

### 2.2. Cài đặt Ansible trên Bastion (Ubuntu 22.04)
```bash
sudo apt update
sudo apt install -y python3-pip git
pip3 install --user ansible==9.* kubernetes
ansible --version   # >= 2.16
```

### 2.3. Clone repo + di chuyển vào thư mục ansible
```bash
git clone <URL_REPO_CUA_BAN> ~/do-an
cd ~/do-an/ansible-code
```

### 2.4. Tạo SSH key trên Bastion để Ansible kết nối các VM nội bộ
```bash
ssh-keygen -t rsa -b 4096 -N "" -f ~/.ssh/id_rsa
# Add public key vào OS Login project-wide:
gcloud compute os-login ssh-keys add --key-file=~/.ssh/id_rsa.pub
```

### 2.5. Chỉnh inventory
Sửa [ansible-code/inventory/hosts.ini](ansible-code/inventory/hosts.ini):
- Thay `REPLACE_WITH_BASTION_PUBLIC_IP` bằng IP public của bastion (hoặc đổi thành `127.0.0.1` vì đang local).
- Thay **toàn bộ** `YOUR_OS_LOGIN_USER` bằng username OS Login (lấy: `gcloud compute os-login describe-profile --format='value(posixAccounts[0].username)'` — thường có dạng `tendung_gmail_com`).
- Verify IP private các VM khớp đúng:
  - Dev master: `10.10.1.10/11/12`
  - Dev worker: `10.10.1.20/21`
  - Prod master: `10.20.1.10/11/12`
  - Prod worker: `10.20.1.20/21`
  - Observability: `10.60.1.10`

### 2.6. Test kết nối
```bash
ansible -i inventory/hosts.ini all -m ping
```
Phải thấy tất cả host trả `pong`.

### 2.7. Cấu hình secrets thật
Chỉnh các file defaults sau **trước khi chạy site.yml**:

| File | Biến cần sửa |
|---|---|
| [roles/grafana/defaults/main.yml](ansible-code/roles/grafana/defaults/main.yml) | `grafana_admin_password` |
| [roles/alertmanager/defaults/main.yml](ansible-code/roles/alertmanager/defaults/main.yml) | `telegram_bot_token`, `telegram_chat_id`, `slack_webhook_url`, `email_to` |
| [roles/loki/defaults/main.yml](ansible-code/roles/loki/defaults/main.yml) | `loki_gcs_bucket` (nếu đổi tên bucket) |
| [roles/tempo/defaults/main.yml](ansible-code/roles/tempo/defaults/main.yml) | `tempo_gcs_bucket` (nếu đổi tên bucket) |

> **Khuyến nghị:** dùng **Ansible Vault** thay vì sửa trực tiếp:
> ```bash
> ansible-vault encrypt_string '<bot-token>' --name 'telegram_bot_token'
> ```

### 2.8. Tạo 2 GCS bucket cho Loki + Tempo
```bash
PROJECT_OBS=$(terraform -chdir=~/do-an/terraform-code output -raw project_id_observability)
gsutil mb -p $PROJECT_OBS -l asia-southeast1 gs://gcp-asia-southeast1-loki-storage-001
gsutil mb -p $PROJECT_OBS -l asia-southeast1 gs://gcp-asia-southeast1-tempo-storage-001
```

Cấp quyền cho service account của observability-vm:
```bash
SA_OBS=$(gcloud compute instances describe observability-vm \
  --zone=asia-southeast1-a --project=$PROJECT_OBS \
  --format='value(serviceAccounts[0].email)')

for B in loki tempo; do
  gsutil iam ch serviceAccount:$SA_OBS:objectAdmin \
    gs://gcp-asia-southeast1-$B-storage-001
done
```

### 2.9. Chạy toàn bộ pipeline
```bash
cd ~/do-an/ansible-code
ansible-playbook site.yml
```

**Thứ tự thực hiện** (đã định nghĩa trong [site.yml](ansible-code/site.yml)):

| Step | Playbook | Mục tiêu | Thời gian |
|---|---|---|---|
| 1 | [k8s.yml](ansible-code/playbooks/k8s.yml) | Cài containerd + kubeadm, init 2 cluster HA Dev + Prod | ~15 phút |
| 2 | [app.yml](ansible-code/playbooks/app.yml) | Deploy microservice app (placeholder hiện tại) | ~1 phút |
| 3 | [observability.yml](ansible-code/playbooks/observability.yml) | Deploy Kafka + Prometheus + Loki + Tempo + OTel Gateway + Alertmanager + Grafana lên obs-vm | ~10 phút |
| 4 | [collectors.yml](ansible-code/playbooks/collectors.yml) | Deploy OTel Collector agent + Node Exporter trên mọi VM | ~5 phút |
| 5 | [metrics-k8s.yml](ansible-code/playbooks/metrics-k8s.yml) | Deploy Prometheus Agent + kube-state-metrics vào 2 K8s cluster | ~3 phút |

Tổng thời gian: **~30–40 phút**.

### 2.10. Chạy từng phần (debug)
```bash
ansible-playbook playbooks/k8s.yml
ansible-playbook playbooks/observability.yml
ansible-playbook playbooks/collectors.yml
ansible-playbook playbooks/metrics-k8s.yml

# Chỉ deploy lại 1 role:
ansible-playbook playbooks/observability.yml --tags grafana
ansible-playbook playbooks/observability.yml --start-at-task="Deploy Grafana"
```

---

## 3. Verify hệ thống chạy đúng

### 3.1. K8s cluster
```bash
ssh k8s-dev-master-1
sudo kubectl --kubeconfig=/etc/kubernetes/admin.conf get nodes
# Phải thấy: 3 master Ready + 2 worker Ready
```

### 3.2. Prometheus Agent đã đẩy metrics chưa
```bash
ssh observability-vm
curl -s 'http://localhost:9090/api/v1/label/cluster/values'
# Phải trả về: {"status":"success","data":["dev","prod"]}
```

### 3.3. Kafka topics
```bash
ssh observability-vm
sudo -u kafka /opt/kafka/bin/kafka-topics.sh --list --bootstrap-server localhost:9092
# Output: trace-topic, log-topic
```

### 3.4. Grafana
- Mở browser tới: `http://<observability-vm-ip>:3000` (truy cập qua VPN hoặc bastion port-forward).
- Đăng nhập: `admin` / `<grafana_admin_password>`.
- Vào **Connections → Data sources** → phải có **Prometheus, Loki, Tempo** (xanh OK).
- Vào **Dashboards** → có sẵn 4 dashboard auto-provisioned.

Port-forward từ máy local nếu cần:
```powershell
gcloud compute ssh bastion-host -- -L 3000:10.60.1.10:3000
# Rồi truy cập http://localhost:3000
```

### 3.5. Alertmanager
```bash
curl http://10.60.1.10:9093/api/v2/status
```

---

## 4. Cleanup (xóa toàn bộ tài nguyên)

### 4.1. Xóa K8s workload (tuỳ chọn)
Không bắt buộc — `terraform destroy` sẽ xóa luôn VM.

### 4.2. Destroy Terraform
```powershell
cd terraform-code
terraform destroy
```
> **Cảnh báo:** lệnh này xóa **toàn bộ 6 projects** + dữ liệu trong GCS bucket. Không thể rollback.

Nếu bucket có dữ liệu, xóa thủ công trước:
```bash
gsutil -m rm -r gs://gcp-asia-southeast1-loki-storage-001
gsutil -m rm -r gs://gcp-asia-southeast1-tempo-storage-001
```

---

## 5. Troubleshooting nhanh

| Triệu chứng | Nguyên nhân & cách fix |
|---|---|
| `terraform apply` báo `API not enabled` | Chạy lại lần 2 — service-usage có độ trễ propagate ~30s |
| `ansible all -m ping` fail | Kiểm tra OS Login user, SSH key đã add chưa, firewall internal đã allow port 22 chưa |
| `kubeadm init` timeout | Swap chưa tắt → kiểm tra `roles/k8s-common/tasks/disable_swap.yml` đã chạy |
| Kafka không start | RAM obs-vm < 4GB → tăng VM size hoặc giảm `kafka_heap_opts` |
| Loki/Tempo báo "permission denied" GCS | SA của obs-vm chưa có `roles/storage.objectAdmin` trên bucket → chạy lại bước 2.8 |
| Grafana không thấy data từ Prometheus | Check `external_labels` `cluster=dev/prod` trong query, hoặc check `remote_write` trong logs Prometheus Agent: `kubectl -n monitoring logs deploy/prometheus-agent` |
| OTel Gateway lỗi parse config | Bản OTel < 0.99 không có exporter `otlphttp/loki` → giữ version `0.99.0` đã pin trong defaults |

---

## 6. Sơ đồ luồng tổng thể

```
┌──────────────────────────────────────────────────────────────────┐
│                    GIAI ĐOẠN 1: TERRAFORM                        │
│  terraform.tfvars → terraform apply → 6 Projects + 14 VMs        │
│  + VPC Hub-Spoke + HA VPN + LB + IAM + Cloud Logging/Monitoring  │
└────────────────────────┬─────────────────────────────────────────┘
                         │ (output: bastion_ip, obs_vm_ip)
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                    GIAI ĐOẠN 2: ANSIBLE                          │
│                                                                  │
│  SSH → Bastion → ansible-playbook site.yml                       │
│                                                                  │
│  Step 1: K8s HA Dev (3M+2W) + Prod (3M+2W)  via kubeadm          │
│  Step 2: App microservices (placeholder)                         │
│  Step 3: Observability stack on obs-vm                           │
│          Kafka • Prometheus • Loki • Tempo                       │
│          OTel-Gateway • Alertmanager • Grafana                   │
│  Step 4: Collectors (mọi VM): OTel agent + Node Exporter         │
│  Step 5: Prometheus Agent + KSM vào K8s clusters                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## 7. Cấu trúc file tham khảo

- Terraform: [terraform-code/](terraform-code/)
- Ansible site playbook: [ansible-code/site.yml](ansible-code/site.yml)
- Inventory: [ansible-code/inventory/hosts.ini](ansible-code/inventory/hosts.ini)
- Roles: [ansible-code/roles/](ansible-code/roles/)
- Kiến trúc: [asset/Untitled Diagram-Page-4.drawio.png](asset/Untitled%20Diagram-Page-4.drawio.png)
