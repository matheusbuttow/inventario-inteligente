# Banco de dados (Thiago)

Pasta reservada para o modelo PostgreSQL do inventário.

## Conteúdo esperado

| Pasta / arquivo | Responsável | Descrição |
| --- | --- | --- |
| `migrations/` | Thiago | Scripts SQL das 4 tabelas (`usuario`, `localizacao`, `componente`, `emprestimo`) |
| `seeds/` | Thiago | Componentes reais + 2 usuários de teste (sem senhas reais no Git) |
| `diagrama-er.png` | Thiago | Diagrama entidade-relacionamento (Semana 2) |

## Contrato com o back-end

Qualquer mudança de tabela ou coluna = **migration nova**, avisada no grupo antes do merge (Thiago → Pietro).

O contrato da API que consome esses dados está em [`docs/openapi.yaml`](../docs/openapi.yaml).

## Subir só o Postgres (Semana 1)

```bash
cp .env.example .env
docker compose up -d db
```

Host na rede Docker: `db`. Host na máquina: `localhost:5432`.
