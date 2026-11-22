# Front-end

Área do **Lucas Derick**. React + Vite, React Router, Axios e html5-qrcode, mobile-first.

## Telas

| Rota | Tela |
| --- | --- |
| `/login` | Login por e-mail e senha (o token fica salvo; o aluno não precisa logar de novo) |
| `/scanner` | Lê o QR Code pela câmera, para sozinho e mostra **Pegar** ou **Devolver**. Campo para digitar o código se a câmera falhar |
| `/` | Componentes, com busca e filtro por status |
| `/componentes/:id` | Detalhe: onde fica, com quem está e desde quando |
| `/meus-emprestimos` | O que está comigo, com destaque para os atrasados |
| `/historico` | Retiradas e devoluções (`?componente_id=` filtra um componente) |

## Rodar

No Compose (recomendado), a partir da raiz: `docker compose up -d --build` e abra http://localhost:5173.

Fora do Docker:

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173, usando a API em VITE_API_URL (padrão http://localhost:3000)
```

Sem API, com dados falsos: `VITE_USE_MOCK=true npm run dev`.

A câmera só funciona em `localhost` ou HTTPS. Para testar no celular, use um túnel (`ngrok http 5173`).

## Organização

```
src/
├── pages/                 # uma tela por arquivo
├── components/            # Layout, botões Pegar/Devolver, status, estados de carregamento/erro
├── hooks/useCarregar.js   # carrega dados da API e ignora respostas atrasadas
├── services/api.js        # Axios com o token e volta ao login quando a sessão expira
├── services/inventario.js # chamadas da API (ou dados falsos com VITE_USE_MOCK=true)
└── utils/formato.js       # datas, status e localização
```

Contrato da API: [`docs/openapi.yaml`](../docs/openapi.yaml).
