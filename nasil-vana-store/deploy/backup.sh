#!/usr/bin/env bash
# Backup diário do banco e das imagens (agende no crontab do servidor: 0 3 * * * /caminho/backup.sh)
# Guarde cópias FORA do servidor (ex.: rclone para Google Drive/Backblaze). Teste a restauração periodicamente.
set -euo pipefail
cd "$(dirname "$0")"
STAMP=$(date +%F)
mkdir -p backups
docker compose exec -T db pg_dump -U nasil -Fc nasil > "backups/db-$STAMP.dump"
docker run --rm -v deploy_media:/media -v "$PWD/backups:/out" alpine tar czf "/out/media-$STAMP.tgz" -C /media .
find backups -type f -mtime +30 -delete
