#!/bin/sh
# Aplica as migrations e os seeds de database/ no Postgres do Compose.
# Roda DENTRO do container do banco, então funciona igual em Linux, macOS e Windows:
#
#   docker compose exec db sh /scripts/preparar-banco.sh
#
# Para recomeçar do zero: docker compose down -v && docker compose up -d
set -e

PSQL="psql -v ON_ERROR_STOP=1 -q -U $POSTGRES_USER -d $POSTGRES_DB"

if [ "$($PSQL -tAc "SELECT to_regclass('public.usuario') IS NOT NULL")" = "t" ]; then
  echo "O banco já está preparado (tabela usuario existe)."
  echo "Para recriar do zero: docker compose down -v && docker compose up -d"
  exit 0
fi

aplicados=0
for f in /database/migrations/*.sql /database/seeds/*.sql; do
  [ -e "$f" ] || continue
  echo "-> $f"
  $PSQL -f "$f"
  aplicados=$((aplicados + 1))
done

if [ "$aplicados" -eq 0 ]; then
  echo "Nenhum arquivo .sql em database/migrations ou database/seeds."
  exit 1
fi

echo "Pronto: $aplicados arquivo(s) aplicados."
