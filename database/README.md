# Banco de dados (Thiago)

Pasta reservada para o modelo PostgreSQL do inventário.

## Conteúdo esperado

| Pasta / arquivo | Responsável | Descrição |
| --- | --- | --- |
| `migrations/` | Thiago | Scripts SQL das 4 tabelas (`usuario`, `localizacao`, `componente`, `emprestimo`) |
| `seeds/` | Thiago | Componentes reais + 2 usuários de teste (sem senhas reais no Git) |
| `diagrama-er.png` | Thiago | Diagrama entidade-relacionamento (Semana 2) |

## Usuários de teste (criados pelo seed)

| Perfil | E-mail | Matrícula | Senha |
| --- | --- | --- | --- |
| aluno | `aluno@furg.br` | `12345` | `senha123` |
| admin | `admin@furg.br` | `99999` | `senha123` |

Só para desenvolvimento local. As datas usam `TIMESTAMPTZ`, então a API mostra o horário certo
mesmo rodando fora do Docker. Se o seu banco foi criado antes desta mudança, recrie com
`docker compose down -v`.

## Contrato com o back-end

Qualquer mudança de tabela ou coluna = **migration nova**, avisada no grupo antes do merge (Thiago → Pietro).

O contrato da API que consome esses dados está em [`docs/openapi.yaml`](../docs/openapi.yaml).

## Subir só o Postgres (Semana 1)

```bash
cp .env.example .env
docker compose up -d db
```

Host na rede Docker: `db`. Host na máquina: `localhost:5432`.


## O que muda

- **Schema inicial (`database/migrations/01_schema.sql`):** Criação das tabelas `usuario`, `localizacao`, `componente` e `emprestimo`, além dos índices de busca em `codigo_qr` e `status`.
- **Regra de negócio (`database/migrations/02_restricao_emprestimo.sql`):** Adição de índice único parcial em `emprestimo (componente_id) WHERE devolvido_em IS NULL` para garantir apenas um empréstimo aberto por componente.
- **Seeds (`database/seeds/01_dados_iniciais.sql`):** População inicial com 2 usuários de teste (`aluno` e `admin`, sem senhas reais), 2 localizações e 3 componentes físicos.
- **Documentação (`database/diagrama-er.png`):** Inclusão do diagrama entidade-relacionamento atualizado do banco.

## Como testar

1. Crie o arquivo de ambiente (caso ainda não tenha) e suba o serviço do banco de dados:

   ```bash
   cp .env.example .env
   docker compose up -d db
   ```

2. Execute as migrations e as seeds na ordem abaixo:

   **Linux / macOS / Git Bash:**

   ```bash
   cat database/migrations/01_schema.sql | docker compose exec -T db psql -U inventario -d inventario

   cat database/migrations/02_restricao_emprestimo.sql | docker compose exec -T db psql -U inventario -d inventario

   cat database/seeds/01_dados_iniciais.sql | docker compose exec -T db psql -U inventario -d inventario
   ```

   **Windows (PowerShell):**

   ```powershell
   Get-Content -Encoding UTF8 database/migrations/01_schema.sql | docker compose exec -T db psql -U inventario -d inventario

   Get-Content -Encoding UTF8 database/migrations/02_restricao_emprestimo.sql | docker compose exec -T db psql -U inventario -d inventario

   Get-Content -Encoding UTF8 database/seeds/01_dados_iniciais.sql | docker compose exec -T db psql -U inventario -d inventario
   ```

3. Verifique se as 4 tabelas e os registros iniciais foram criados:

   ```bash
   docker compose exec db psql -U inventario -d inventario -c "\dt" -c "SELECT id, nome, status FROM componente;"
   ```