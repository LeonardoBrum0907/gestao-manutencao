#!/usr/bin/env bash
# Testa o deploy do caderno-admin sem Docker nem VPS: docker, git, runuser e sleep são
# trocados por versões falsas que só anotam o que receberam em $LOG.
# Uso: bash deploy/vps/admin/testar-caderno-admin.sh
set -uo pipefail

raiz="$(mktemp -d)"
trap 'rm -rf "$raiz"' EXIT
falsos="$raiz/bin"
mkdir -p "$falsos" "$raiz/repo/deploy/vps"
export LOG="$raiz/log" ESTADO="$raiz/estado" RECARGA="$raiz/recarga"

criar_falsos() {
  printf '#!/bin/sh\necho backup >> "$LOG"\n' > "$raiz/repo/deploy/vps/backup.sh"
  printf '#!/bin/sh\nwhile [ "$1" != -- ]; do shift; done; shift; exec "$@"\n' > "$falsos/runuser"
  printf '#!/bin/sh\n' > "$falsos/sleep"
  cat > "$falsos/git" <<'FALSO'
#!/bin/sh
case "$*" in
  "rev-parse --abbrev-ref HEAD") echo main ;;
  "rev-parse HEAD") echo sha-anterior ;;
  log*) echo "sha-novo commit novo" ;;
  *) echo "git $*" >> "$LOG" ;;
esac
FALSO
  cat > "$falsos/docker" <<'FALSO'
#!/bin/sh
echo "docker $*" >> "$LOG"
case "$*" in
  *"ps -q api") echo cid ;;
  *"ps -q demo-api"|*"ps -q demo-db") echo cid-demo ;;
  "inspect -f {{.State.Health.Status}} cid-demo") echo healthy ;;
  # Como o compose real: lista também a imagem da dependência db.
  *"config --images api") printf 'postgres:18-alpine\ncaderno-gestor-api\n' ;;
  # Antes do "build api": "up … --no-build api" também termina em "build api".
  *"up -d --no-deps --no-build"*api) echo x >> "$ESTADO" ;;
  *"build api") [ "${FALHA:-}" != build ];;
  # Com FALHA=caddy, o primeiro reload acha a porta de administração ainda fechada, como no Caddy recém-criado.
  *"caddy reload"*)
    [ "${FALHA:-}" != caddy ] || [ -e "$RECARGA" ] || { touch "$RECARGA"; echo "connection refused" >&2; exit 1; } ;;
  "inspect -f {{.Image}} cid") echo sha256:velha ;;
  "inspect -f {{.State.Health.Status}} cid")
    # Com FALHA=saude, só a segunda subida (a do rollback) fica healthy.
    n=$(wc -l < "$ESTADO" 2>/dev/null || echo 0)
    if [ "${FALHA:-}" = saude ] && [ "$n" -lt 2 ]; then echo unhealthy; else echo healthy; fi ;;
esac
FALSO
  chmod +x "$falsos"/* "$raiz/repo/deploy/vps/backup.sh"
  sed "s|^readonly PASTA=.*|readonly PASTA=$raiz/repo|" deploy/vps/admin/caderno-admin > "$raiz/caderno-admin"
}

rodar() {
  : > "$LOG"; rm -f "$ESTADO" "$RECARGA"
  FALHA="$1" PATH="$falsos:$PATH" bash "$raiz/caderno-admin" deploy > "$raiz/saida" 2>&1
}

rodar_demo() {
  : > "$LOG"
  PATH="$falsos:$PATH" bash "$raiz/caderno-admin" demo "$@" > "$raiz/saida" 2>&1
}

falhas=0
conferir() {
  local nome="$1"; shift
  if "$@"; then echo "ok   $nome"; else echo "FALHOU $nome"; falhas=$((falhas + 1)); fi
}
no_log() { grep -qF -- "$1" "$LOG"; }
fora_do_log() { ! grep -qF -- "$1" "$LOG"; }

criar_falsos

rodar ""; codigo=$?
conferir "deploy normal sai com 0" test "$codigo" -eq 0
conferir "deploy normal faz backup antes" no_log backup
conferir "deploy normal guarda a imagem anterior" no_log "docker tag sha256:velha caderno-gestor-api:anterior"
conferir "deploy normal relê o Caddyfile" no_log "caddy reload"
conferir "deploy normal não volta versão" fora_do_log "reset --keep"
conferir "deploy normal limpa imagens sem nome" no_log "docker image prune -f"

rodar caddy; codigo=$?
conferir "Caddy recém-criado sem porta de administração não derruba o deploy" test "$codigo" -eq 0
conferir "Caddy recém-criado: tenta o reload de novo" test "$(grep -c "caddy reload" "$LOG")" -ge 2
conferir "Caddy recém-criado não volta versão" fora_do_log "reset --keep"

rodar build; codigo=$?
conferir "build quebrado sai com erro" test "$codigo" -ne 0
conferir "build quebrado volta o código" no_log "git reset --keep sha-anterior"
conferir "build quebrado volta a imagem anterior" no_log "docker tag caderno-gestor-api:anterior caderno-gestor-api:latest"

rodar saude; codigo=$?
conferir "API que não sobe sai com erro" test "$codigo" -ne 0
conferir "API que não sobe volta o código" no_log "git reset --keep sha-anterior"
conferir "API que não sobe sobe a imagem anterior" no_log "up -d --no-deps --no-build --force-recreate api"
conferir "rollback espera a anterior ficar healthy" grep -q "API healthy" "$raiz/saida"

touch "$raiz/repo/.env.demo"
compose_demo="docker compose -p caderno-demo -f docker-compose.demo.yml --env-file $raiz/repo/.env.demo"

rodar_demo dados; codigo=$?
conferir "demo dados sai com 0" test "$codigo" -eq 0
conferir "demo dados apaga só o banco da demonstração" no_log "$compose_demo exec -T demo-db dropdb -U manutencao --if-exists --force manutencao"
conferir "demo dados carrega os dados genéricos" no_log "$compose_demo exec -T demo-api node apps/api/dist/demo/seed-demo.js"
conferir "demo dados nunca usa o compose da produção" fora_do_log "docker-compose.vps.yml"

rodar_demo publicar; codigo=$?
conferir "demo publicar sai com 0" test "$codigo" -eq 0
conferir "demo publicar sobe com build" no_log "$compose_demo up -d --build"
conferir "demo publicar nunca usa o compose da produção" fora_do_log "docker-compose.vps.yml"

rodar_demo logs caddy; codigo=$?
conferir "demo logs recusa serviço que não é da demonstração" test "$codigo" -ne 0

rm "$raiz/repo/.env.demo"
rodar_demo dados; codigo=$?
conferir "demo sem .env.demo recusa" test "$codigo" -ne 0
conferir "demo sem .env.demo não chama o docker" fora_do_log "docker"

exit "$falhas"
