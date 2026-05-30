#!/usr/bin/env bash
# =============================================================================
# bastion-secrets.sh — Sao lưu / khôi phục các secret KHÔNG nằm trong git
# giữa MÁY LOCAL  <->  BASTION HOST.
#
# Chạy script này TRÊN MÁY LOCAL (cần đã cài + đăng nhập gcloud).
#
#   ./bastion-secrets.sh pull     # Kéo secrets TỪ bastion VỀ local (backup)
#   ./bastion-secrets.sh push     # Đẩy secrets TỪ local LÊN bastion
#                                  #   -> CHỈ copy file nào CÒN THIẾU trên bastion
#   ./bastion-secrets.sh push --force   # Ghi đè tất cả (kể cả file đã có)
#   ./bastion-secrets.sh status   # Liệt kê file nào có ở local / bastion
#
# 3 secret được quản lý (đều nằm ngoài repo, mất khi destroy bastion):
#   ~/.ssh/gcp_sontx_key            (+ .pub)   SSH key Ansible -> mọi VM
#   ~/secrets/gar-puller-key.json              SA key kéo image GAR
#   ~/.vault_pass                              mật khẩu giải mã vault.yml
# =============================================================================
set -euo pipefail

# ─── Cấu hình bastion (override bằng biến môi trường nếu cần) ────────────────
# Kết nối qua SSH key trực tiếp tới IP ngoài (giống lệnh bạn vẫn dùng):
#   ssh -i ~/.ssh/gcp_sontx_key admin_sontx_online@34.142.190.240
BASTION_IP="${BASTION_IP:-34.142.190.240}"
BASTION_USER="${BASTION_USER:-admin_sontx_online}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/gcp_sontx_key}"

# Thư mục backup trên local (đã được .gitignore)
LOCAL_STORE="${LOCAL_STORE:-$HOME/bastion-secrets}"

# Danh sách secret: "<đường dẫn remote trong $HOME bastion>|<tên file local>|<mode>"
SECRETS=(
  ".ssh/gcp_sontx_key|gcp_sontx_key|600"
  ".ssh/gcp_sontx_key.pub|gcp_sontx_key.pub|644"
  "secrets/gar-puller-key.json|gar-puller-key.json|600"
  ".vault_pass|vault_pass|600"
)

# ─── Helpers ────────────────────────────────────────────────────────────────
log()  { echo -e "\033[1;34m[secrets]\033[0m $*"; }
ok()   { echo -e "\033[1;32m[ok]\033[0m $*"; }
warn() { echo -e "\033[1;33m[warn]\033[0m $*"; }
err()  { echo -e "\033[1;31m[error]\033[0m $*" >&2; }

GCLOUD_COMMON=()

# SSH/SCP qua key trực tiếp (giống lệnh bạn vẫn dùng).
SSH_OPTS=(-i "$SSH_KEY" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15)

require_key() {
  if [[ ! -f "$SSH_KEY" ]]; then
    err "Không tìm thấy SSH key: $SSH_KEY"
    err "Đặt biến SSH_KEY=... hoặc copy key về đúng vị trí."
    exit 1
  fi
}

_scp() {
  local src="$1" dst="$2"
  scp "${SSH_OPTS[@]}" "$src" "$dst"
}

_ssh() {
  ssh "${SSH_OPTS[@]}" "${BASTION_USER}@${BASTION_IP}" "$1"
}

# Đường dẫn remote cho scp: user@ip:path
_remote() { echo "${BASTION_USER}@${BASTION_IP}:$1"; }

remote_exists() { _ssh "test -f \"\$HOME/$1\" && echo yes || echo no" | tr -d '\r' | tail -n1; }

# ─── pull: bastion -> local ─────────────────────────────────────────────────
cmd_pull() {
  mkdir -p "$LOCAL_STORE"; chmod 700 "$LOCAL_STORE"
  log "Kéo secrets từ bastion về: $LOCAL_STORE"
  local copied=0
  for entry in "${SECRETS[@]}"; do
    IFS='|' read -r remote local_name mode <<< "$entry"
    if [[ "$(remote_exists "$remote")" != "yes" ]]; then
      warn "Bỏ qua (không có trên bastion): ~/$remote"
      continue
    fi
    log "  ↓ ~/$remote  ->  $LOCAL_STORE/$local_name"
    _scp "$(_remote "$remote")" "$LOCAL_STORE/$local_name"
    chmod "$mode" "$LOCAL_STORE/$local_name"
    copied=$((copied+1))
  done
  ok "Đã backup $copied file về $LOCAL_STORE"
  warn "GIỮ KỸ thư mục này — đây là bản sao DUY NHẤT ở local."
}

# ─── push: local -> bastion (chỉ file còn thiếu, trừ khi --force) ────────────
cmd_push() {
  local force="${1:-}"
  if [[ ! -d "$LOCAL_STORE" ]]; then
    err "Chưa có backup local: $LOCAL_STORE — chạy './bastion-secrets.sh pull' trước."
    exit 1
  fi
  log "Đẩy secrets từ local lên bastion (force=${force:-no})"
  # Đảm bảo thư mục đích tồn tại
  _ssh "mkdir -p \$HOME/.ssh \$HOME/secrets && chmod 700 \$HOME/.ssh \$HOME/secrets"
  local pushed=0 skipped=0
  for entry in "${SECRETS[@]}"; do
    IFS='|' read -r remote local_name mode <<< "$entry"
    local src="$LOCAL_STORE/$local_name"
    if [[ ! -f "$src" ]]; then
      warn "Bỏ qua (không có ở local): $src"
      continue
    fi
    if [[ "$force" != "--force" && "$(remote_exists "$remote")" == "yes" ]]; then
      log "  = đã có trên bastion, bỏ qua: ~/$remote"
      skipped=$((skipped+1))
      continue
    fi
    log "  ↑ $src  ->  ~/$remote"
    _scp "$src" "$(_remote "$remote")"
    _ssh "chmod $mode \$HOME/$remote"
    pushed=$((pushed+1))
  done
  ok "Đã đẩy $pushed file, bỏ qua $skipped file (đã tồn tại)."
}

# ─── status ─────────────────────────────────────────────────────────────────
cmd_status() {
  echo "============================================================"
  echo " Bastion: ${BASTION_USER}@${BASTION_IP}  (key: $SSH_KEY)"
  echo " Local store: $LOCAL_STORE"
  echo "============================================================"
  printf '%-32s %-8s %-8s\n' "FILE" "LOCAL" "BASTION"
  for entry in "${SECRETS[@]}"; do
    IFS='|' read -r remote local_name mode <<< "$entry"
    local l="no" r
    [[ -f "$LOCAL_STORE/$local_name" ]] && l="yes"
    r="$(remote_exists "$remote")"
    printf '%-32s %-8s %-8s\n' "~/$remote" "$l" "$r"
  done
}

# ─── main ───────────────────────────────────────────────────────────────────
case "${1:-}" in
  pull)   require_key; cmd_pull ;;
  push)   require_key; cmd_push "${2:-}" ;;
  status) require_key; cmd_status ;;
  *)
    cat <<EOF
Usage: $0 <pull|push|status> [--force]

  pull            Kéo secrets từ bastion về local (~/bastion-secrets)
  push            Đẩy secrets lên bastion — CHỈ file còn thiếu
  push --force    Đẩy + ghi đè tất cả
  status          Xem file nào đang có ở local / bastion

Env override: BASTION_IP, BASTION_USER, SSH_KEY, LOCAL_STORE
EOF
    exit 1 ;;
esac
