# Inventário Inteligente de Laboratório

Sistema web para registrar e rastrear o empréstimo de componentes eletrônicos dos laboratórios do C3/FURG. O aluno escaneia o QR Code da caixa do componente pelo celular e registra o empréstimo ou a devolução **em menos de 5 segundos**.

> Projeto da disciplina **Projeto e Desenvolvimento de Software (PDS2)**
> Universidade Federal do Rio Grande (FURG) — Centro de Ciências Computacionais (C3)

---

## Sumário

1. [O problema](#1-o-problema)
2. [A solução](#2-a-solução)
3. [Equipe e responsabilidades](#3-equipe-e-responsabilidades)
4. [Tecnologias](#4-tecnologias)
5. [Estrutura do repositório](#5-estrutura-do-repositório)
6. [Como rodar o projeto](#6-como-rodar-o-projeto)
7. [Variáveis de ambiente](#7-variáveis-de-ambiente)
8. [Modelo de dados](#8-modelo-de-dados)
9. [API REST](#9-api-rest)
10. [Fluxo principal do usuário](#10-fluxo-principal-do-usuário)
11. [Regras de negócio](#11-regras-de-negócio)
12. [Cronograma](#12-cronograma)
13. [Fluxo de trabalho da equipe](#13-fluxo-de-trabalho-da-equipe)
14. [Definição de pronto](#14-definição-de-pronto)
15. [Próximos passos](#15-próximos-passos)

---

## 1. O problema

Levantado no exercício de Design Thinking (entrevistas com usuários do laboratório).

**Cenário:** um aluno de Engenharia de Computação precisava de um sensor para montar um circuito à tarde. Procurou nos armários e não encontrou. A planilha de controle estava desatualizada havia semanas. Ele perdeu a tarde mandando mensagens em grupos para descobrir quem tinha levado a peça.

**Causa raiz:** a planilha manual é burocrática. Quem está com pressa pega o componente e vai embora, achando que devolve no dia seguinte, e esquece.

**Insight principal:** sistemas manuais ou lentos falham porque ignoram a pressa do usuário. **Se o registro levar mais de 5 segundos, ele será ignorado.**

**Ponto de vista (POV):**
O estudante/pesquisador do laboratório precisa registrar e rastrear o empréstimo de componentes de forma instantânea e sem atrito. Mas as ferramentas atuais (papel, Excel) são burocráticas e fora do fluxo de trabalho, então as pessoas ignoram o registro na hora da pressa.

**Necessidades:**
- Rastrear a localização e o status dos equipamentos em tempo real.
- Registrar empréstimos e devoluções de maneira instantânea.

## 2. A solução

Das 5 ideias geradas na ideação (leitor de código de barras, app com QR Code, bot no Discord/Telegram, tablet dedicado e armário com RFID), o MVP implementa a **ideia 2: app web com scanner de QR Code**.

- Cada caixa ou gaveta de componente recebe uma etiqueta com QR Code.
- O aluno abre o sistema no celular (já logado), aponta a câmera e toca em **Pegar** ou **Devolver**.
- Qualquer pessoa consulta onde está cada componente, quem está com ele e desde quando.

**Por que essa ideia:** custo quase zero (usa o celular do aluno e etiquetas impressas), não exige hardware novo e cumpre a meta de menos de 5 segundos. A arquitetura permite adicionar depois o leitor de código de barras ou o bot.

## 3. Equipe e responsabilidades

| Integrante | Papel | Responsável por |
| --- | --- | --- |
| **Matheus Pimenta** | Documentação e integração | README, contrato da API (OpenAPI), ambiente Docker, testes de ponta a ponta, suporte às conexões entre os módulos dos colegas |
| **Thiago Novinski** | Banco de dados | Modelo de dados, migrations, seeds, índices, consultas de histórico e atrasos, backup |
| **Lucas Derick** | Front-end | Telas responsivas, leitor de QR Code pela câmera, integração com a API |
| **Pietro** | Back-end | API REST, autenticação, regras de empréstimo e devolução, testes das rotas |

## 4. Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Front-end | React + Vite, React Router, Axios, html5-qrcode |
| Back-end | Node.js + Express, JWT, bcrypt |
| Banco de dados | PostgreSQL |
| Infraestrutura | Docker e Docker Compose |
| Documentação da API | OpenAPI 3 (Swagger UI) |
| Versionamento | Git + GitHub |

## 5. Estrutura do repositório

```
inventario-inteligente/
├── frontend/              # React + Vite (Lucas)
│   ├── src/
│   │   ├── pages/         # Login, Componentes, Detalhe, Scanner, MeusEmprestimos, Historico
│   │   ├── components/
│   │   └── services/api.js
│   └── package.json
├── backend/               # Node.js + Express (Pietro)
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middlewares/   # autenticação JWT, tratamento de erros
│   │   └── app.js
│   └── package.json
├── database/              # PostgreSQL (Thiago)
│   ├── migrations/
│   ├── seeds/
│   └── diagrama-er.png
├── docs/                  # Documentação (Matheus)
│   ├── openapi.yaml
│   ├── manual-do-usuario.md
│   └── etiquetas-qr/
├── docker-compose.yml
├── .env.example
└── README.md
```

## 6. Como rodar o projeto

### Pré-requisitos

- Git
- Docker e Docker Compose
- Node.js 20+ (apenas para rodar fora do Docker)

### Passo a passo

```bash
# 1. Clonar o repositório
git clone https://github.com/<organizacao>/inventario-inteligente.git
cd inventario-inteligente

# 2. Criar o arquivo de ambiente
cp .env.example .env

# 3. Subir os serviços
docker compose up --build
```

**Semana 1 (até o back-end e o front-end entrarem no Compose):** sobe só o Postgres.

```bash
docker compose up -d db
```

Quando Pietro e Lucas entregarem Dockerfile/`package.json`, descomente os serviços `backend` e `frontend` em `docker-compose.yml` e rode:

```bash
docker compose up --build

# Em outro terminal, migrations e seeds (Thiago)
docker compose exec backend npm run migrate
docker compose exec backend npm run seed
```

| Serviço | Endereço | Disponível |
| --- | --- | --- |
| PostgreSQL | localhost:5432 | Semana 1 (já) |
| API | http://localhost:3000 | Quando o back-end entrar no Compose |
| Documentação da API (Swagger) | http://localhost:3000/docs | Quando o back-end servir o OpenAPI |
| Front-end | http://localhost:5173 | Quando o front-end entrar no Compose |
| Contrato OpenAPI (fonte) | [`docs/openapi.yaml`](docs/openapi.yaml) | Semana 1 (já) |

**Usuários de teste (criados pelo seed):** veja o arquivo `database/seeds/` — não coloque senhas reais no repositório.

### Testar a câmera no celular

O navegador só libera a câmera em HTTPS ou em `localhost`. Para testar no celular na mesma rede, use um túnel (por exemplo, `ngrok http 5173`) ou rode o Vite com HTTPS.

### Comandos úteis

```bash
docker compose down              # parar tudo
docker compose down -v           # parar e apagar os dados do banco
docker compose logs -f backend   # ver logs da API
docker compose exec backend npm test
```

## 7. Variáveis de ambiente

| Variável | Exemplo | Descrição |
| --- | --- | --- |
| `POSTGRES_HOST` | `db` | Host do banco (nome do serviço no Compose) |
| `POSTGRES_PORT` | `5432` | Porta do banco *dentro* da rede Docker |
| `POSTGRES_HOST_PORT` | `5432` | Porta publicada no host (use `5433` se a 5432 já estiver ocupada) |
| `POSTGRES_DB` | `inventario` | Nome do banco |
| `POSTGRES_USER` | `inventario` | Usuário do banco |
| `POSTGRES_PASSWORD` | `troque-aqui` | Senha do banco |
| `JWT_SECRET` | `troque-aqui` | Chave para assinar os tokens |
| `JWT_EXPIRES_IN` | `7d` | Validade do token (longa, para o aluno não precisar logar toda hora) |
| `API_PORT` | `3000` | Porta da API |
| `VITE_API_URL` | `http://localhost:3000` | Endereço da API usado pelo front-end |
| `DIAS_ATRASO` | `7` | Dias até um empréstimo ser considerado atrasado |

> Se a porta 5432 do host já estiver em uso, defina `POSTGRES_HOST_PORT=5433` no `.env`. Dentro da rede Docker o banco continua em `db:5432`.

## 8. Modelo de dados

```
Usuario 1 ──── N Emprestimo N ──── 1 Componente N ──── 1 Localizacao
```

### Usuario
| Campo | Tipo | Observação |
| --- | --- | --- |
| id | serial | PK |
| nome | varchar(120) | obrigatório |
| matricula | varchar(20) | único |
| email | varchar(120) | único |
| senha_hash | varchar(255) | bcrypt |
| perfil | varchar(20) | `aluno` ou `admin` |
| criado_em | timestamp | padrão `now()` |

### Localizacao
| Campo | Tipo | Observação |
| --- | --- | --- |
| id | serial | PK |
| nome | varchar(80) | ex.: "Armário 2 — Gaveta B" |
| laboratorio | varchar(80) | ex.: "Lab. de Sistemas Embarcados" |

### Componente
| Campo | Tipo | Observação |
| --- | --- | --- |
| id | serial | PK |
| nome | varchar(120) | ex.: "Sensor Ultrassônico HC-SR04" |
| categoria | varchar(60) | sensor, microcontrolador, módulo… |
| codigo_qr | varchar(64) | único, com índice |
| localizacao_id | int | FK → Localizacao |
| status | varchar(20) | `disponivel`, `emprestado`, `manutencao` (com índice) |
| criado_em | timestamp | padrão `now()` |

### Emprestimo
| Campo | Tipo | Observação |
| --- | --- | --- |
| id | serial | PK |
| usuario_id | int | FK → Usuario |
| componente_id | int | FK → Componente |
| retirado_em | timestamp | padrão `now()` |
| devolvido_em | timestamp | `null` enquanto estiver emprestado |

**Restrição importante:** índice único parcial em `componente_id` onde `devolvido_em IS NULL`, garantindo que um componente nunca tenha dois empréstimos abertos ao mesmo tempo.

## 9. API REST

Todas as rotas, exceto `/health`, `/auth/registrar` e `/auth/login`, exigem o cabeçalho `Authorization: Bearer <token>`. O contrato completo fica em `docs/openapi.yaml`.

### Autenticação
| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/health` | Verifica se a API está no ar |
| POST | `/auth/registrar` | Cria usuário |
| POST | `/auth/login` | Retorna o token JWT |
| GET | `/auth/eu` | Dados do usuário logado |

### Componentes e localizações
| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/componentes` | Lista, com filtros `?status=` e `?busca=` |
| GET | `/componentes/:id` | Detalhe, com quem está com ele |
| GET | `/componentes/qr/:codigo` | Busca pelo QR Code (usado pelo scanner) |
| POST | `/componentes` | Cria (admin) |
| PUT | `/componentes/:id` | Edita (admin) |
| DELETE | `/componentes/:id` | Remove (admin) |
| GET | `/localizacoes` | Lista |
| POST | `/localizacoes` | Cria (admin) |

### Empréstimos
| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/emprestimos` | Registra retirada. Corpo: `{ "componente_id": 12 }` |
| PATCH | `/emprestimos/:id/devolver` | Registra devolução |
| GET | `/emprestimos/meus` | Empréstimos abertos do usuário logado |
| GET | `/emprestimos/historico` | Histórico, com filtros `?componente_id=` e `?usuario_id=` |
| GET | `/emprestimos/atrasados` | Empréstimos abertos há mais de `DIAS_ATRASO` dias |

### Erros padronizados
```json
{ "erro": "COMPONENTE_JA_EMPRESTADO", "mensagem": "Este componente está com Fulano desde 14/10." }
```

| Código HTTP | Erro | Quando |
| --- | --- | --- |
| 400 | `DADOS_INVALIDOS` | Corpo da requisição incompleto |
| 401 | `NAO_AUTENTICADO` | Token ausente ou inválido |
| 403 | `SEM_PERMISSAO` | Rota de admin acessada por aluno |
| 404 | `QR_INVALIDO` | Código não corresponde a nenhum componente |
| 409 | `COMPONENTE_JA_EMPRESTADO` | Tentativa de pegar componente já emprestado |
| 409 | `JA_DEVOLVIDO` | Tentativa de devolver empréstimo já fechado |

## 10. Fluxo principal do usuário

Meta: **menos de 5 segundos** do scanner aberto até a confirmação.

1. O aluno abre o sistema no celular (já logado, token de longa duração).
2. Toca em **Escanear** e aponta a câmera para o QR Code da caixa.
3. O front chama `GET /componentes/qr/:codigo` e mostra o componente.
4. Aparecem dois botões grandes: **Pegar** e **Devolver** (só o que fizer sentido fica habilitado).
5. Um toque chama `POST /emprestimos` ou `PATCH /emprestimos/:id/devolver`.
6. Confirmação na tela com vibração; o status muda na hora para todos.

## 11. Regras de negócio

- Um componente só pode ter **um** empréstimo aberto por vez.
- Só quem pegou (ou um admin) pode registrar a devolução.
- Componentes em `manutencao` não podem ser emprestados.
- Empréstimos abertos há mais de `DIAS_ATRASO` dias aparecem na lista de atrasados.
- Nada é apagado do histórico de empréstimos.

## 12. Cronograma

MVP em 2 semanas. Segunda, 12/10, é feriado.

### Semana 1 — base e primeiro fluxo (13 a 16/10)
Meta: na sexta, um empréstimo criado pela tela aparece gravado no banco.

| Dia | Matheus (docs + integração) | Thiago (banco) | Lucas (front) | Pietro (back) |
| --- | --- | --- | --- | --- |
| Ter 13/10 | Repositório, README inicial, padrão de branches e commits, docker-compose com Postgres | Modelo ER validado com o Pietro | Projeto React + Vite, rotas e layout base mobile-first | Projeto Express, estrutura de pastas, `/health` e conexão com o banco |
| Qua 14/10 | Contrato da API em OpenAPI com Pietro e Lucas | Migrations das 4 tabelas | Tela de login e lista de componentes com dados falsos | Cadastro e login com JWT e hash de senha |
| Qui 15/10 | `.env.example` e guia "como rodar"; testar o ambiente na máquina de cada um | Seeds com componentes reais e 2 usuários de teste | Tela de detalhe do componente | CRUD de componentes e localizações |
| Sex 16/10 | Primeira integração front + back + banco; registrar erros e responsáveis | Índices em `codigo_qr` e `status` | Conectar login e lista à API real | `POST /emprestimos` e `PATCH /emprestimos/:id/devolver` |

### Semana 2 — QR Code, histórico e entrega (19 a 23/10)
Meta: na sexta, o fluxo "escanear e pegar" leva menos de 5 segundos e está pronto para apresentar.

| Dia | Matheus (docs + integração) | Thiago (banco) | Lucas (front) | Pietro (back) |
| --- | --- | --- | --- | --- |
| Seg 19/10 | Gerar e imprimir etiquetas QR; documentar o formato do código | Restrição de um empréstimo aberto por componente | Leitor de QR Code pela câmera (html5-qrcode) | `GET /componentes/qr/:codigo` |
| Ter 20/10 | Testar o fluxo completo no celular; abrir issues | Consultas de histórico por componente e por usuário | Tela pós-leitura com botões Pegar e Devolver | Validações e mensagens de erro |
| Qua 21/10 | Atualizar OpenAPI; cronometrar o fluxo | View de itens atrasados | Telas "Meus empréstimos" e histórico | Rotas de histórico e atrasados |
| Qui 22/10 | Testes de ponta a ponta; revisar PRs | Backup e script para resetar dados de demonstração | Ajustes visuais, carregamento e erros | Correção de bugs; testes das rotas |
| Sex 23/10 | README final, manual do usuário e roteiro da apresentação | Diagrama ER documentado | Revisão no celular e no PC do laboratório | Tag `v1.0` e apoio na demonstração |

## 13. Fluxo de trabalho da equipe

### Reunião diária (10 minutos ou mensagem no grupo)
Cada um responde: o que fiz ontem, o que faço hoje, o que está me travando. O Matheus registra os bloqueios e chama quem precisa resolver.

### Branches
- `main` — sempre funcionando; só recebe código por Pull Request.
- `feat/<area>-<descricao>` — ex.: `feat/front-scanner-qr`, `feat/back-emprestimos`, `feat/db-migrations`.
- `fix/<descricao>` — correções.

### Commits (Conventional Commits)
```
feat(back): adiciona rota de devolução
fix(front): corrige câmera no Safari
docs: atualiza contrato da API
db: cria migration de emprestimo
```

### Pull Requests
- PRs pequenos, com descrição do que muda e como testar.
- Pelo menos **1 colega** revisa antes do merge.

### Pontos de integração (acompanhados pelo Matheus)
- **Thiago → Pietro:** mudança de tabela ou coluna = migration nova, avisada no grupo antes do merge.
- **Pietro → Lucas:** mudança de rota ou payload entra **primeiro** no `docs/openapi.yaml`.
- **Lucas → Matheus:** telas novas entram no manual do usuário.

## 14. Definição de pronto

Uma tarefa só está pronta quando:

- [ ] O código está na `main` via PR revisado.
- [ ] Roda com `docker compose up` na máquina de outro colega.
- [ ] A mudança está documentada (README ou OpenAPI).

## 15. Próximos passos

Ideias da fase de ideação que podem virar versões futuras:

- **Leitor de código de barras USB** em um PC fixo do laboratório (bipar carteirinha + componente).
- **Bot no Discord/Telegram** com comandos como `/pegar Sensor_Ultrassonico`.
- **Tablet fixo** na porta do armário com os botões Pegar e Devolver.
- **Armário com tranca e RFID** usando o crachá universitário.
- Notificação automática para quem está com componente atrasado.
- Painel de estatísticas (componentes mais usados, tempo médio de empréstimo).

---

**Licença:** uso acadêmico — FURG / C3 / PDS2.