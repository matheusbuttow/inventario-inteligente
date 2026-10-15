# Front-end

Área do **Lucas Derick**.

Stack: React + Vite, React Router, Axios, html5-qrcode.

Estrutura esperada:

```
src/
├── pages/         # Login, Componentes, Detalhe, Scanner, MeusEmprestimos, Historico
├── components/
└── services/api.js
```

Contrato da API: [`docs/openapi.yaml`](../docs/openapi.yaml).  
Base URL: variável `VITE_API_URL` (ver [`.env.example`](../.env.example)).

Quando o `package.json` e o `Dockerfile` estiverem prontos, o Matheus descomenta o serviço `frontend` no `docker-compose.yml`.
