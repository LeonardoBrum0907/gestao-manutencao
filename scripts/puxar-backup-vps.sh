#!/usr/bin/env bash
# Copia para o PC a pasta ~/backups da VPS (gerada por deploy/vps/backup.sh).
# Usa a chave ~/.ssh/id_backup, sem frase-senha para rodar sozinho no Agendador de Tarefas.
# Na VPS essa chave só consegue ler os backups: o authorized_keys força o comando
# `tar -C /home/leo/backups -cf - .`, então ela não abre terminal nem roda outra coisa.
set -euo pipefail

vps="${VPS_HOST:-leo@srv2063513.hstgr.cloud}"
destino="${1:-$HOME/Backups/caderno-gestor}"
mkdir -p "$destino"

ssh -i ~/.ssh/id_backup -o BatchMode=yes "$vps" | tar -xf - -C "$destino"
echo "$(date '+%F %T') backups no PC: $(ls -1 "$destino" | grep -c '^20') backups, último $(ls -1 "$destino" | grep '^20' | tail -1)"
