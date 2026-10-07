# Sobe o PC como servidor: dump da VPS (se responder), banco local, API e túnel.
# Uso: powershell -ExecutionPolicy Bypass -File scripts\servidor-pc.ps1 [-Restaurar]
#   -Restaurar  apaga o banco local e restaura o dump mais recente de backup-local\
param([switch]$Restaurar)

$ErrorActionPreference = 'Continue'
Set-Location (Split-Path $PSScriptRoot -Parent)
$compose = @('-f', 'docker-compose.yml', '-f', 'docker-compose.servidor.yml', '--profile', 'local-db')
New-Item -ItemType Directory -Force backup-local | Out-Null

function Passo($texto) { Write-Host "`n== $texto" -ForegroundColor Cyan }

Passo 'Banco local'
docker compose @compose up -d db
for ($i = 0; $i -lt 60; $i++) {
  docker compose @compose exec -T db pg_isready -U manutencao -d manutencao | Out-Null
  if ($LASTEXITCODE -eq 0) { break }
  Start-Sleep 2
}
$tabelas = "$(docker compose @compose exec -T db psql -U manutencao -d manutencao -tAc "select count(*) from pg_tables where schemaname='public'")".Trim()

if ($tabelas -eq '0' -or $Restaurar) {
  Passo 'Backup novo da VPS'
  $url = ((Get-Content .env | Select-String '^DATABASE_URL=').ToString() -split '=', 2)[1].Trim('"').Split('?')[0]
  $nome = "manutencao-$(Get-Date -Format 'yyyyMMdd-HHmm').dump"
  docker run --rm -v "${PWD}\backup-local:/out" postgres:18 pg_dump -Fc --no-owner -d $url -f "/out/$nome"
  if ($LASTEXITCODE -ne 0) {
    Remove-Item "backup-local\$nome" -ErrorAction SilentlyContinue
    Write-Warning 'A VPS não respondeu. Uso o backup mais recente que já existe.'
  }

  $dump = Get-ChildItem backup-local -Filter 'manutencao*.dump' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (-not $dump) { Write-Error 'Nenhum backup em backup-local\.'; exit 1 }

  Passo "Restaurando $($dump.Name)"
  docker compose @compose cp $dump.FullName db:/tmp/restore.dump
  docker compose @compose exec -T db pg_restore -U manutencao -d manutencao --no-owner --no-privileges --clean --if-exists /tmp/restore.dump
  if ($LASTEXITCODE -ne 0) { Write-Warning 'O pg_restore avisou erros. Confira as contagens abaixo.' }
} else {
  Write-Host "Banco local já tem dados ($tabelas tabelas). Nada restaurado; use -Restaurar para sobrescrever."
}

docker compose @compose exec -T db psql -U manutencao -d manutencao -c "analyze" -c "select relname as tabela, n_live_tup as linhas from pg_stat_user_tables where relname in ('Factory','Machine','Member','Team','Record') order by 1"

Passo 'API e túnel (a primeira vez demora pelo build)'
docker compose @compose up -d --build api tunnel

$publico = $null
for ($i = 0; $i -lt 30 -and -not $publico; $i++) {
  $logs = docker compose @compose logs tunnel 2>&1 | Out-String
  $achados = [regex]::Matches($logs, 'https://[a-z0-9-]+\.trycloudflare\.com')
  if ($achados.Count) { $publico = $achados[$achados.Count - 1].Value } else { Start-Sleep 2 }
}
if (-not $publico) { Write-Error 'Não achei o endereço do túnel. Veja: docker compose logs tunnel'; exit 1 }
Set-Content backup-local\tunnel-url.txt $publico

Start-Sleep 5
try {
  $saude = Invoke-WebRequest "$publico/health" -UseBasicParsing -TimeoutSec 20
  Write-Host "Saúde pelo túnel: $($saude.Content)"
} catch {
  Write-Warning "O túnel ainda não respondeu em $publico/health. Tente de novo em alguns segundos."
}

Passo 'Pronto'
Write-Host "Endereço público da API: $publico" -ForegroundColor Green
Write-Host 'Ele também ficou salvo em backup-local\tunnel-url.txt.'
