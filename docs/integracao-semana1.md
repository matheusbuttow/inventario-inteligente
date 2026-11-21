# Integração — Semana 1

Acompanhamento do Matheus Pimenta Silveira (docs + integração).

## Meta da sexta (16/10)

Um empréstimo criado pela tela aparece gravado no banco.

**Situação em 20/11:** meta ainda não atingida. Banco + API já sobem juntos no Compose e o login funciona contra o banco, mas faltam as rotas de componentes/empréstimos no back-end e o front ainda não está na `main` (ver bloqueios).

## Entregas do Matheus

| Dia | Item | Status |
| --- | --- | --- |
| Ter 13/10 | Estrutura do repositório, padrão de branches/commits (README), `docker-compose` com Postgres | Feito (PR #1) |
| Qua 14/10 | Contrato da API em `docs/openapi.yaml` | Feito (PR #1); erros `NAO_ENCONTRADO` e `COMPONENTE_EM_MANUTENCAO` adicionados em 20/11 |
| Qui 15/10 | `.env.example` e guia "como rodar"; testar ambiente nas máquinas | Feito. Guia na seção 6 do README, com `scripts/preparar-banco.sh` para migrations/seeds. Falta testar na máquina de cada colega |
| Sex 16/10 | Primeira integração front + back + banco; registrar erros | Parcial. `backend` ativado no Compose (`backend/Dockerfile`); db + API + login testados em 20/11. Front pendente (PR #3) |
| Seg 19/10 | Etiquetas QR e formato do código | Feito. Gerador e formato em `docs/etiquetas-qr/`. Falta imprimir as etiquetas reais |

## Dependências entre módulos

| De → Para | O que precisa existir | Situação (20/11) |
| --- | --- | --- |
| Thiago → Pietro | Migrations das 4 tabelas + seeds | Em revisão (PR #4, mudanças pedidas) |
| Pietro → Lucas | Rotas alinhadas ao OpenAPI (`/auth`, `/componentes`, `/emprestimos`) | Só `/login` e `/api/health` existem |
| Lucas → Matheus | Login + lista + detalhe conectados à API real | Em revisão (PR #3, mudanças pedidas) |

## Bloqueios registrados

| Data | Bloqueio | Responsável | Resolução |
| --- | --- | --- | --- |
| 20/11 | PR #3: as 6 telas do front estão vazias no PR (só `<h1>`); `axios` e `html5-qrcode` não estão no `package.json` | Lucas | Pendente: commitar as telas e as dependências |
| 20/11 | PR #3 em conflito com a `main` e usando a pasta `Frontend/` (o projeto usa `frontend/`) | Lucas | Pendente: `git merge origin/main` e renomear a pasta |
| 20/11 | PR #4: o hash bcrypt do seed é inválido (32 caracteres), então ninguém loga com os usuários de teste | Thiago | Pendente. Testado: com um hash real (`bcrypt.hashSync`), o `/login` devolve o token |
| 20/11 | PR #4: `ON DELETE CASCADE` em `emprestimo` apaga o histórico (contra a regra da seção 11) | Thiago | Pendente: trocar para `RESTRICT` |
| 20/11 | PR #4: o seed abre um empréstimo para um componente com status `disponivel`; as FKs de `emprestimo` aceitam `NULL` | Thiago | Pendente |
| 20/11 | Back: o login está em `POST /login` com `{ matricula, senha }`; o contrato e o front usam `POST /auth/login` com `{ email, senha }` | Pietro + Matheus | Pendente: decidir se o login aceita e-mail, matrícula ou os dois, e atualizar primeiro o OpenAPI |
| 20/11 | Back: as rotas ficam sob o prefixo `/api` (`/api/health`); o contrato não tem prefixo (`/health`) | Pietro + Matheus | Pendente: alinhar (tirar o prefixo ou mudar `servers.url` do OpenAPI para `http://localhost:3000/api`) |
| 20/11 | Back: faltam `/auth/registrar`, `/auth/eu`, `/componentes*`, `/localizacoes`, `/emprestimos*`; `authController.js` e `authMiddlewares.js` estão vazios | Pietro | Pendente. Bloqueia a meta da semana 1 e o teste no celular |
| 20/11 | Há um `package-lock.json` solto na raiz e outro em `frontend/` (vindos do PR #2), sem `package.json` correspondente | Pietro | Pendente: remover |
| 20/11 | Os códigos QR do mock do front (`QR-001`…) não batem com os do seed (`qr-hc-sr04-01`…) | Lucas | Pendente: usar o formato de `docs/etiquetas-qr/README.md` |

## Como testar o ambiente agora

```bash
cp .env.example .env
# Se a porta 5432 do host estiver ocupada: POSTGRES_HOST_PORT=5433 no .env
docker compose up -d --build
docker compose exec db sh /scripts/preparar-banco.sh   # precisa das migrations do PR #4 na main
curl http://localhost:3000/api/health
```

**Teste nesta máquina (20/11):** Postgres 16 + API no Compose. `/api/health` respondeu `{"status":"OK","database":"Conectado"}`; o script aplicou as migrations e os seeds do PR #4 e, rodado de novo, não fez nada; o `/login` devolveu um token com um hash bcrypt válido.

Quando o front-end entrar na `main`, descomentar o serviço `frontend` em `docker-compose.yml` (vai precisar de um `frontend/Dockerfile`).
