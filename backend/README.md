# Back-end

Área do **Pietro**.

Stack: Node.js + Express, JWT, bcrypt.

Estrutura esperada:

```
src/
├── routes/
├── controllers/
├── middlewares/   # autenticação JWT, tratamento de erros
└── app.js
```

Contrato da API: [`docs/openapi.yaml`](../docs/openapi.yaml).  
Variáveis: [`.env.example`](../.env.example).

O serviço `backend` já está ativo no `docker-compose.yml` (imagem em `Dockerfile`, código montado em `/app` com recarga automática via nodemon). Se mudar o `package.json`, rode `docker compose up -d --build backend`.
