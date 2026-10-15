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

Quando o `package.json` e o `Dockerfile` estiverem prontos, o Matheus descomenta o serviço `backend` no `docker-compose.yml`.
