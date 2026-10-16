#!/usr/bin/env bash
# Backup diário da VPS: banco (pg_dump) e pasta de anexos, que fica fora do banco.
# Guarda uma pasta por execução em ~/backups (AAAA-MM-DD_HHMM, para o backup de antes de cada
# deploy não sobrescrever o da madrugada) e apaga as com mais de 14 dias.
# Roda pelo cron do usuário leo; o PC puxa ~/backups depois com scripts/puxar-backup-vps.sh.
set -euo pipefail

cd "$(dirname "$0")/../.."
compose="docker compose -f docker-compose.vps.yml"
raiz="$HOME/backups"
destino="$raiz/$(date +%F_%H%M)"
mkdir -p "$destino"

$compose exec -T db pg_dump -U manutencao -Fc manutencao > "$destino/manutencao.dump"
# Lê o índice do dump: se o arquivo veio truncado, o pg_restore falha e o cron registra o erro.
$compose exec -T db pg_restore --list < "$destino/manutencao.dump" > /dev/null
$compose exec -T api tar -C /data -czf - attachments > "$destino/attachments.tar.gz"

find "$raiz" -mindepth 1 -maxdepth 1 -type d -mtime +14 -exec rm -rf {} +
echo "$(date '+%F %T') backup ok: $destino ($(du -sh "$destino" | cut -f1))"
