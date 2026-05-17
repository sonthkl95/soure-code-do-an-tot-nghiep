# Hướng dẫn Cấu hình SSH & Triển khai Ansible trên Bastion Host

Tài liệu này hướng dẫn bạn cách tạo một cặp khóa SSH riêng biệt có tên rõ ràng là **`gcp_sontx_key`** và triển khai hệ thống **Ansible** từ **Bastion Host** (giải pháp bắt buộc và tối ưu nhất cho người dùng hệ điều hành Windows).

> [!WARNING]
> **Lưu ý cho Windows**: Ansible không hỗ trợ chạy trực tiếp trên Windows (sẽ gặp lỗi `command not found` trong Git Bash). Do đó, chúng ta sẽ cài đặt và chạy Ansible trực tiếp trên máy ảo **Bastion Host** (Debian Linux).

---

## 🛠️ Quy trình thực hiện (5 Bước)

### Bước 1: Tạo cặp khóa SSH với tên riêng biệt (`gcp_sontx_key`)
Chạy câu lệnh này trong **Git Bash** hoặc **PowerShell** trên máy tính Windows của bạn:

```bash
# Tạo khóa riêng biệt và KHÔNG sử dụng mật khẩu (Passphrase rỗng thực sự)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/gcp_sontx_key -N ""
```

---

### Bước 2: Đăng ký Khóa Public lên GCP OS Login
Để GCP cho phép bạn kết nối thông qua tài khoản `admin@sontx.online`, bạn cần tải khóa Public (`gcp_sontx_key.pub`) lên GCP bằng lệnh sau trong **Git Bash**:

```bash
# Sử dụng dấu gạch chéo xuôi để tránh lỗi ký tự thoát trên Windows
gcloud compute os-login ssh-keys add --key-file="$HOME/.ssh/gcp_sontx_key.pub"
```
*(Hãy đợi 15 - 30 giây để GCP đồng bộ hóa khóa mới xuống VM).*

---

### Bước 3: Đưa khóa Private lên Bastion Host
Để Ansible chạy trên Bastion Host có thể tự động SSH và cài đặt các VM nội bộ (`10.10.1.*` và `10.20.1.*`), Bastion Host cần có quyền truy cập khóa Private của bạn. Chọn **1 trong 2 cách** sau:

#### 👉 Cách A: Dùng SSH Agent Forwarding (Khuyên dùng - Bảo mật nhất)
Cách này giúp bạn kết nối mà **không cần sao chép tệp khóa Private** lên máy ảo. Chạy các lệnh này trong **Git Bash** trên Windows:

```bash
# 1. Khởi động SSH Agent
eval $(ssh-agent -s)

# 2. Thêm khóa gcp_sontx_key vào SSH Agent
ssh-add ~/.ssh/gcp_sontx_key

# 3. SSH vào Bastion Host kèm cờ -A (Forwarding)
ssh -A admin_sontx_online@35.187.249.83
```

#### 👉 Cách B: Copy trực tiếp khóa Private lên Bastion bằng SCP (Dễ hiểu nhất)
Chạy lệnh này trong **Git Bash** của Windows để copy tệp khóa từ máy bạn lên thư mục `.ssh` của máy ảo Bastion:

```bash
# 1. Tạo thư mục .ssh trên Bastion trước
ssh -i ~/.ssh/gcp_sontx_key admin_sontx_online@35.187.249.83 "mkdir -p ~/.ssh && chmod 700 ~/.ssh"

# 2. Copy khóa sang Bastion bằng lệnh SCP
scp -i ~/.ssh/gcp_sontx_key ~/.ssh/gcp_sontx_key admin_sontx_online@35.187.249.83:~/.ssh/gcp_sontx_key

# 3. SSH vào Bastion Host thông thường
ssh -i ~/.ssh/gcp_sontx_key admin_sontx_online@35.187.249.83
```
*(Khi vào trong máy ảo Bastion, hãy chạy `chmod 600 ~/.ssh/gcp_sontx_key` để phân quyền bảo mật cho khóa).*

---

### Bước 4: Thiết lập và cài đặt Ansible trên Bastion Host
*Sau khi đã SSH thành công vào bên trong Bastion Host ở Bước 3, hãy chạy các lệnh sau:*

```bash
# 1. Cập nhật hệ thống máy ảo
sudo apt update

# 2. Cài đặt Ansible và Git trực tiếp lên Bastion VM
sudo apt install -y ansible git

# 3. Tải mã nguồn dự án của bạn về máy ảo Bastion
git clone <URL_KHO_MA_NGUON_CUA_BAN>
cd soure-code-do-an-tot-nghiep/ansible-code
```

---

### Bước 5: Chạy Ansible Playbook từ Bastion Host
Vì bạn đang chạy trực tiếp trên Bastion Host (nằm cùng dải mạng nội bộ với các VM khác), hãy thực thi lệnh chạy Playbook cực kỳ ngắn gọn sau:

```bash
ansible-playbook site.yml
```
*(Hệ thống sẽ tự động cấu hình Kubernetes clusters và hệ thống giám sát Observability hoàn toàn tự động!)*

---

## 💡 Thông số kỹ thuật của bạn
* **Bastion Host Public IP**: `35.187.249.83`
* **GCP OS Login Username**: `admin_sontx_online`
* **Private Key mặc định**: `~/.ssh/gcp_sontx_key`
