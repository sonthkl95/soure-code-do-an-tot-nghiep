# Danh sách cần FIX để `terraform destroy` → `apply` + Ansible chạy 1 lần là hệ thống hoạt động lại

> Mục tiêu: Sau khi `terraform destroy` toàn bộ rồi `terraform apply` + chạy Ansible **một lần duy nhất**, hệ thống phải hoạt động lại bình thường, **IP không đổi** (vì Cloudflare DNS trỏ về các IP này).

---

## 🔴 BLOCKING — Bắt buộc fix (nếu không sẽ fail)

### B1. Giữ nguyên IP tĩnh sau destroy (Cloudflare phụ thuộc)

**Vấn đề:** `google_compute_address` / `google_compute_global_address` là "static" nhưng `terraform destroy` sẽ **release** chúng → khi apply lại sẽ nhận IP **mới** → Cloudflare DNS trỏ sai.

**4 IP cần bảo vệ:**

| File | Resource | Loại | Cloudflare |
|---|---|---|---|
| [terraform-code/compute-engine.tf](terraform-code/compute-engine.tf#L228) | `gcp-asia-southeast1-bastion-ip-003` | regional EXTERNAL | (bastion SSH) |
| [terraform-code/cloud-load-balancing.tf](terraform-code/cloud-load-balancing.tf#L16) | `gcp-asia-southeast1-lb-grafana-ip-003` | global | `grafana.sontx.online` |
| [terraform-code/cloud-load-balancing-techshop.tf](terraform-code/cloud-load-balancing-techshop.tf#L69) | `gcp-asia-southeast1-lb-k8s-dev-techshop-ip-003` | global | `*.dev.sontx.online` |
| [terraform-code/cloud-load-balancing-techshop.tf](terraform-code/cloud-load-balancing-techshop.tf#L139) | `gcp-asia-southeast1-lb-k8s-prod-techshop-ip-003` | global | `sontx.online`, `*.sontx.online` |

**Fix:**
1. Thêm `lifecycle { prevent_destroy = true }` vào cả 4 resource → chặn destroy nhầm.
2. Thêm `import {}` block để khi state bị xoá vẫn re-attach được IP cũ:
   ```hcl
   import {
     to = google_compute_address.gcp-asia-southeast1-bastion-ip-003
     id = "projects/<sh-access-project-id>/regions/asia-southeast1/addresses/gcp-asia-southeast1-bastion-ip-003"
   }
   import {
     to = google_compute_global_address.gcp-asia-southeast1-lb-grafana-ip-003
     id = "projects/<obs-project-id>/global/addresses/gcp-asia-southeast1-lb-grafana-ip-003"
   }
   # ... tương tự 2 IP techshop
   ```
3. **Backup IP hiện tại ra file** trước khi destroy:
   ```bash
   terraform output -json > ip-backup-$(date +%F).json
   ```

---

### B2. Service Account 409 Conflict (soft-delete 30 ngày)

**Vấn đề:** [terraform-code/iam.tf](terraform-code/iam.tf) tạo 7 SA. Khi destroy, GCP soft-delete 30 ngày → apply lại sẽ lỗi `409 Already Exists` vì `account_id` trùng.

**7 SA bị ảnh hưởng:** `sa-hub-net`, `sa-sh-vpc-dev`, `sa-sh-vpc-prd`, `sa-sh-access`, `sa-dev-env`, `sa-prd-env`, `sa-obs`.

**Fix:**
- Thêm `import {}` block cho cả 7 SA (giống pattern IP).
- Hoặc thêm script `terraform-code/post-destroy.sh` để `gcloud iam service-accounts undelete <email>` trước khi apply lại.

---

### B3. File bí mật không có sẵn trên bastion mới

**Vấn đề:** [ansible-code/bootstrap.sh](ansible-code/bootstrap.sh) yêu cầu:
- `~/.ssh/gcp_sontx_key` (SSH key)
- `~/secrets/gar-puller-key.json` (GAR pull key)
- `vault.yml` (ansible vault password)

Bastion vừa apply xong **không có** các file này → Ansible fail.

**Fix:** chọn 1 trong 2:
- **A (đơn giản):** Tài liệu hoá bước upload thủ công sau apply (ghi vào README).
- **B (tự động):** Dùng `metadata_startup_script` trên bastion VM hoặc Secret Manager + `gcloud secrets versions access` trong bootstrap.sh.

---

### B4. Hard-coded bastion IP trong inventory

**Vấn đề:** [ansible-code/inventory/hosts.ini](ansible-code/inventory/hosts.ini#L11) có `bastion-host ansible_host=34.142.190.240`. Nếu B1 không làm đúng → IP đổi → file sai.

**Fix:**
- Nếu B1 đã làm: IP giữ nguyên → không cần đổi.
- Hoặc dùng template Jinja đọc IP từ `terraform output`.

---

### B5. MySQL dump không được restore tự động

**Vấn đề:** [ansible-code/roles/mysql/tasks/main.yml](ansible-code/roles/mysql/tasks/main.yml) tạo 4 DB (`payment`, `inventory`, `order_db`, `identity`) + users nhưng **không import** `Dump20260526.sql` ở root repo → app khởi động với DB rỗng.

**Fix:** thêm task idempotent với sentinel file:
```yaml
- name: Copy SQL dump to MySQL host
  copy:
    src: ../../Dump20260526.sql
    dest: /tmp/Dump20260526.sql

- name: Import dump (one-time)
  shell: mysql -uroot -p{{ mysql_root_password }} < /tmp/Dump20260526.sql && touch /var/lib/mysql/.dump_imported
  args:
    creates: /var/lib/mysql/.dump_imported
```

---

## 🟡 NÊN FIX (warnings — có thể chạy được nhưng dễ lỗi)

### W1. Calico apply trước khi API server ready
[ansible-code/roles/k8s-master-init/tasks/install_cni.yml](ansible-code/roles/k8s-master-init/tasks/install_cni.yml) — thêm:
```yaml
- name: Wait for kube-apiserver
  wait_for:
    host: "{{ k8s_api_vip | default('127.0.0.1') }}"
    port: 6443
    timeout: 120
```

### W2. kubeadm token hết hạn 24h
[ansible-code/roles/k8s-master-init/tasks/generate_join_commands.yml](ansible-code/roles/k8s-master-init/tasks/generate_join_commands.yml) — thêm `--ttl=0` hoặc regen ngay trước worker join.

### W3. containerd config ghi đè mỗi lần chạy
[ansible-code/roles/k8s-common/tasks/containerd_install.yml](ansible-code/roles/k8s-common/tasks/containerd_install.yml#L17) — wrap bằng `creates:` argument.

### W4. `build-fe.yml` không có trong site.yml
[ansible-code/site.yml](ansible-code/site.yml) — thêm `import_playbook: playbooks/build-fe.yml` nếu cần build FE tự động.

### W5. Key file commit vào git (security)
- `gar-puller-key.json` (root)
- `terraform-code/gar-puller-key.json`

→ Thêm vào `.gitignore`, **rotate key trên GCP**, dùng git-filter-repo xoá khỏi history.

### W6. Hard-coded org_id
[terraform-code/org-policies.tf](terraform-code/org-policies.tf#L70) — chuyển `"54431047904"` thành `var.org_id`.

### W7. VPN outputs bị comment
[terraform-code/outputs.tf](terraform-code/outputs.tf) — uncomment nếu cần debug VPN.

### W8. Regex fragile trong Ansible
Một số task dùng regex parse output của `kubectl`/`kubeadm` → fragile khi version đổi. Cân nhắc dùng `-o json` + `from_json`.

---

## ✅ Thứ tự fix khuyến nghị

1. **B1** (IP tĩnh) — ưu tiên cao nhất vì Cloudflare
2. **B2** (SA import)
3. **B5** (MySQL dump)
4. **B3 + B4** (bootstrap secrets + inventory)
5. **W1 → W8** (cải thiện độ ổn định)

---

## 📋 Checklist trước khi `terraform destroy` lần tiếp theo

- [ ] `terraform output -json > ip-backup.json` (lưu IP)
- [ ] `mysqldump` DB ra file (nếu có data mới)
- [ ] `kubectl get all -A -o yaml > k8s-backup.yaml` (nếu có resource custom)
- [ ] Backup `gar-puller-key.json` + `vault.yml` ra nơi an toàn
- [ ] Đã thêm `prevent_destroy` cho 4 IP → phải `terraform state rm` trước khi destroy IP (nếu thực sự muốn)
