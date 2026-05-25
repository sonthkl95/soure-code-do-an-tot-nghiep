#!/usr/bin/env bash
# =============================================================
# bootstrap.sh — Chuẩn bị môi trường bastion trước khi chạy site.yml
# Chạy 1 lần sau khi terraform apply xong.
#
# Usage:
#   cd ansible-code
#   ./bootstrap.sh [dev|prod|all]
# =============================================================
set -euo pipefail

TARGET="${1:-all}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

log()  { echo -e "\033[1;34m[bootstrap]\033[0m $*"; }
warn() { echo -e "\033[1;33m[warn]\033[0m $*"; }
err()  { echo -e "\033[1;31m[error]\033[0m $*" >&2; }

# ─── 1. Verify SSH key ──────────────────────────────────────────
SSH_KEY="$HOME/.ssh/gcp_sontx_key"
if [[ ! -f "$SSH_KEY" ]]; then
  err "SSH private key không tồn tại: $SSH_KEY"
  err "Copy key từ máy local lên bastion rồi chmod 600."
  exit 1
fi
chmod 600 "$SSH_KEY"
log "✓ SSH key OK: $SSH_KEY"

# ─── 2. Verify GAR puller key ───────────────────────────────────
GAR_KEY="$HOME/secrets/gar-puller-key.json"
mkdir -p "$(dirname "$GAR_KEY")"
if [[ ! -f "$GAR_KEY" ]]; then
  err "GAR puller key không tồn tại: $GAR_KEY"
  err "Tạo bằng:"
  err "  gcloud iam service-accounts keys create $GAR_KEY \\"
  err "    --iam-account=sa-gar-puller@<PROJECT_ID>.iam.gserviceaccount.com"
  exit 1
fi
chmod 600 "$GAR_KEY"
log "✓ GAR puller key OK: $GAR_KEY"

# ─── 3. Vault password file ─────────────────────────────────────
VAULT_PASS="$HOME/.vault_pass"
if [[ ! -f "$VAULT_PASS" ]]; then
  warn "Vault password file chưa có: $VAULT_PASS"
  read -rsp "Nhập vault password mới (sẽ lưu vào ${VAULT_PASS}): " pw
  echo
  echo "$pw" > "$VAULT_PASS"
  chmod 600 "$VAULT_PASS"
  log "✓ Đã tạo $VAULT_PASS"
else
  chmod 600 "$VAULT_PASS"
  log "✓ Vault password file OK: $VAULT_PASS"
fi

# ─── 4. Vault file ──────────────────────────────────────────────
VAULT_FILE="$REPO_ROOT/inventory/group_vars/all/vault.yml"
VAULT_EXAMPLE="$REPO_ROOT/inventory/group_vars/all/vault.yml.example"
if [[ ! -f "$VAULT_FILE" ]]; then
  warn "vault.yml chưa có. Copy từ .example..."
  cp "$VAULT_EXAMPLE" "$VAULT_FILE"
  err "Hãy MỞ và điền giá trị thật trong: $VAULT_FILE"
  err "Sau đó chạy lại bootstrap.sh."
  exit 1
fi

if grep -qE "CHANGE_ME|REPLACE_ME" "$VAULT_FILE" 2>/dev/null; then
  if ! head -c 14 "$VAULT_FILE" | grep -q '\$ANSIBLE_VAULT'; then
    err "vault.yml vẫn còn placeholder CHANGE_ME/REPLACE_ME. Điền giá trị thật rồi chạy lại."
    exit 1
  fi
fi

if ! head -c 14 "$VAULT_FILE" | grep -q '\$ANSIBLE_VAULT'; then
  log "Encrypt vault.yml..."
  ansible-vault encrypt "$VAULT_FILE"
fi
log "✓ Vault file OK (đã encrypt): $VAULT_FILE"

# ─── 5. Install Ansible collections ─────────────────────────────
log "Installing Ansible collections..."
ansible-galaxy collection install -r "$REPO_ROOT/requirements.yml" --force
log "✓ Collections installed"

# ─── 6. Ping toàn bộ host ───────────────────────────────────────
case "$TARGET" in
  dev)  LIMIT="k8s_dev:data:db_dev:observability:localhost" ;;
  prod) LIMIT="k8s_prod:data:db_prod:observability:localhost" ;;
  all)  LIMIT="all:localhost" ;;
  *) err "TARGET phải là dev|prod|all, nhận: $TARGET"; exit 1 ;;
esac

log "Ping toàn bộ host trong limit: $LIMIT"
ansible -i inventory/hosts.ini "$LIMIT" -m ping || {
  err "Một số host không ping được. Kiểm tra SSH/firewall trước khi tiếp tục."
  exit 1
}
log "✓ Tất cả host reachable"

# ─── 7. Hướng dẫn bước tiếp ─────────────────────────────────────
cat <<EOF

═════════════════════════════════════════════════════════════════
  BOOTSTRAP HOÀN TẤT.
  
  Chạy deploy:
    ansible-playbook site.yml --limit '$LIMIT'

  Hoặc với verbose:
    ansible-playbook site.yml --limit '$LIMIT' -v
═════════════════════════════════════════════════════════════════
EOF
