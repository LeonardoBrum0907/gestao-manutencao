#!/usr/bin/env bash
# Prepara a VPS para o deploy automático do GitHub Actions (.github/workflows/deploy-api.yml).
# Cria o usuário gh-deploy, cuja chave só roda `caderno-admin deploy` (command= forçado no
# authorized_keys e sudoers liberando só esse argumento), e imprime os três secrets do GitHub.
# A chave privada só aparece na tela: não fica gravada na VPS.
# Uso: sudo bash deploy/vps/admin/instalar-deploy-github.sh [dominio]
set -euo pipefail

readonly USUARIO=gh-deploy
readonly ADMIN=/usr/local/sbin/caderno-admin
readonly DOMINIO="${1:-srv2063513.hstgr.cloud}"

falhar() {
  echo "instalar-deploy-github: $1" >&2
  exit 1
}

conferir() {
  [[ $EUID -eq 0 ]] || falhar "rode com sudo; usuário atual: $(id -un)"
  [[ -x "$ADMIN" ]] || falhar "$ADMIN não existe; instale o caderno-admin antes (README, Acesso do Claude)"
}

criar_usuario() {
  id "$USUARIO" >/dev/null 2>&1 || adduser --disabled-password --gecos "" "$USUARIO" >/dev/null
}

instalar_sudoers() {
  local regra
  regra="$(mktemp)"
  echo "$USUARIO ALL=(root) NOPASSWD: $ADMIN deploy" > "$regra"
  visudo -cf "$regra" >/dev/null || falhar "regra do sudoers inválida: $(cat "$regra")"
  install -o root -g root -m 0440 "$regra" /etc/sudoers.d/caderno-gh-deploy
  rm -f "$regra"
}

# Gera a chave, grava só a pública no authorized_keys (presa ao deploy) e imprime a privada.
instalar_chave() {
  local pasta
  pasta="$(mktemp -d)"
  ssh-keygen -q -t ed25519 -N "" -C github-actions -f "$pasta/chave"
  install -d -o "$USUARIO" -g "$USUARIO" -m 700 "/home/$USUARIO/.ssh"
  printf 'restrict,command="sudo -n %s deploy" %s\n' "$ADMIN" "$(cat "$pasta/chave.pub")" > "/home/$USUARIO/.ssh/authorized_keys"
  chown "$USUARIO:$USUARIO" "/home/$USUARIO/.ssh/authorized_keys"
  chmod 600 "/home/$USUARIO/.ssh/authorized_keys"
  imprimir_secrets "$pasta/chave"
  rm -rf "$pasta"
}

imprimir_secrets() {
  echo "=== VPS_SSH_HOST ==="
  echo "$USUARIO@$DOMINIO"
  echo "=== VPS_SSH_KNOWN_HOSTS ==="
  echo "$DOMINIO $(cut -d' ' -f1,2 /etc/ssh/ssh_host_ed25519_key.pub)"
  echo "=== VPS_SSH_KEY (copie da linha BEGIN até a END; não cole em nenhuma conversa) ==="
  cat "$1"
}

conferir
criar_usuario
instalar_sudoers
instalar_chave
