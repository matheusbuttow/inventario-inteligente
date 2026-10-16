# Integração — Semana 1

Acompanhamento do Matheus Pimenta Silveira (docs + integração).

## Meta da sexta (16/10)

Um empréstimo criado pela tela aparece gravado no banco.

## Entregas do Matheus

| Dia | Item | Status |
| --- | --- | --- |
| Ter 13/10 | Estrutura do repositório, padrão de branches/commits (README), `docker-compose` com Postgres | Feito |
| Qua 14/10 | Contrato da API em `docs/openapi.yaml` | Feito |
| Qui 15/10 | `.env.example` e guia "como rodar"; testar ambiente nas máquinas | Em andamento |
| Sex 16/10 | Primeira integração front + back + banco; registrar erros | Pendente (depende dos colegas) |

## Dependências entre módulos

| De → Para | O que precisa existir |
| --- | --- |
| Thiago → Pietro | Migrations das 4 tabelas + seeds |
| Pietro → Lucas | Rotas alinhadas ao OpenAPI (`/auth`, `/componentes`, `/emprestimos`) |
| Lucas → Matheus | Login + lista + detalhe conectados à API real |

## Bloqueios registrados

| Data | Bloqueio | Responsável | Resolução |
| --- | --- | --- | --- |
| — | (nenhum ainda) | — | — |

## Como testar o ambiente agora

```bash
cp .env.example .env
# Se a porta 5432 do host estiver ocupada:
#   POSTGRES_HOST_PORT=5433 no .env
docker compose up -d db
docker compose ps
docker compose exec db pg_isready -U inventario -d inventario
```

**Teste nesta máquina (14/10):** Postgres 16 saudável em `localhost:5433` (host) / `db:5432` (rede Docker).

Quando back-end e front-end entrarem no Compose, descomentar os serviços em `docker-compose.yml` e seguir o README seção 6.
