#!/bin/sh
# Aplica as migrations e os seeds de database/ no Postgres do Compose.
# Roda DENTRO do container do banco, então funciona igual em Linux, macOS e Windows:
#
#   docker compose exec db sh /scripts/preparar-banco.sh
#
# Pode rodar quantas vezes quiser: só aplica o que ainda não foi aplicado
# (fica registrado na tabela schema_migracoes). Seeds rodam só na primeira vez.
# Para recomeçar do zero: docker compose down -v && docker compose up -d
set -e

PSQL="psql -v ON_ERROR_STOP=1 -q -U $POSTGRES_USER -d $POSTGRES_DB"

tem_tabela() {
  [ "$($PSQL -tAc "SELECT to_regclass('public.$1') IS NOT NULL")" = "t" ]
}

banco_novo=1
if tem_tabela usuario; then
  banco_novo=0
fi

if ! tem_tabela schema_migracoes; then
  $PSQL -c "CREATE TABLE schema_migracoes (arquivo TEXT PRIMARY KEY, aplicado_em TIMESTAMPTZ NOT NULL DEFAULT now())"
  if [ "$banco_novo" -eq 0 ]; then
    # Banco preparado pela versão antiga do script: 01, 02 e seeds já foram aplicados.
    for f in /database/migrations/01_*.sql /database/migrations/02_*.sql /database/seeds/*.sql; do
      [ -e "$f" ] || continue
      $PSQL -c "INSERT INTO schema_migracoes (arquivo) VALUES ('$(basename "$f")') ON CONFLICT DO NOTHING"
    done
  fi
fi

arquivos="/database/migrations/*.sql"
if [ "$banco_novo" -eq 1 ]; then
  arquivos="$arquivos /database/seeds/*.sql"
fi

aplicados=0
for f in $arquivos; do
  [ -e "$f" ] || continue
  nome=$(basename "$f")
  if [ "$($PSQL -tAc "SELECT 1 FROM schema_migracoes WHERE arquivo = '$nome'")" = "1" ]; then
    continue
  fi
  echo "-> $f"
  $PSQL -f "$f"
  $PSQL -c "INSERT INTO schema_migracoes (arquivo) VALUES ('$nome')"
  aplicados=$((aplicados + 1))
done

if [ "$aplicados" -eq 0 ]; then
  echo "O banco já está atualizado."
else
  echo "Pronto: $aplicados arquivo(s) aplicados."
fi
