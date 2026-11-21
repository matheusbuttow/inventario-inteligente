# Etiquetas QR

Cada caixa ou gaveta de componente recebe uma etiqueta com um QR Code. O aluno escaneia o código pelo celular, e o front chama `GET /componentes/qr/:codigo` com o texto lido.

## Formato do código

O valor gravado no QR é **exatamente** o campo `componente.codigo_qr` do banco, **sem URL e sem prefixo de domínio**.

| Regra | Valor |
| --- | --- |
| Padrão | `qr-<nome-curto>-<nn>` |
| Caracteres | letras minúsculas sem acento, números e hífen (`a-z`, `0-9`, `-`) |
| Começo | sempre `qr-` |
| Tamanho máximo | 64 caracteres (tamanho da coluna `codigo_qr`) |
| Unicidade | um código por **unidade física**; nunca reaproveitar o código de um item removido |
| Numeração | `<nn>` com 2 dígitos, contando por tipo de componente: `qr-arduino-01`, `qr-arduino-02`… |

Exemplos (os mesmos dos seeds): `qr-hc-sr04-01`, `qr-arduino-01`, `qr-osc-01`.

Por que só o código, e não um link:
- O fluxo do README (seção 10) usa o scanner **dentro** do sistema, que já está logado.
- O código continua válido se o endereço do sistema mudar (localhost, ngrok, servidor do laboratório).
- O código também vai impresso em texto na etiqueta, para ser digitado no campo manual do scanner se a câmera falhar.

QR com nível de correção de erros **M** (~15%), que tolera etiqueta um pouco riscada ou suja.

## Como gerar as etiquetas

Pré-requisito: Node.js 20.12 ou mais novo.

```bash
cd docs/etiquetas-qr
npm install

# A partir do banco (precisa do Postgres do Compose no ar e com dados; ver README, seção 6)
npm run gerar

# Sem banco, a partir de um arquivo JSON (útil para testar ou imprimir um lote novo)
npm run exemplo                               # usa exemplo-componentes.json
npm run gerar -- --json meus-componentes.json
```

A saída fica em `docs/etiquetas-qr/saida/etiquetas.html` (fora do Git). Para lê-la do banco, o script usa o `.env` da raiz e se conecta em `localhost:POSTGRES_HOST_PORT`. Para usar outro host, defina `ETIQUETAS_DB_HOST`.

O script **para com erro** se houver código repetido, código vazio ou código com mais de 64 caracteres. Se o código só estiver fora do padrão `qr-<nome>-<nn>`, ele mostra um **aviso** e gera a etiqueta mesmo assim.

Formato do JSON (os campos `local` e `laboratorio` são opcionais):

```json
[
  { "codigo_qr": "qr-hc-sr04-01", "nome": "Sensor Ultrassônico HC-SR04",
    "local": "Armário 2 — Gaveta B", "laboratorio": "Lab. de Sistemas Embarcados" }
]
```

## Como imprimir

1. Abra `saida/etiquetas.html` no navegador e use **Ctrl+P**.
2. Escolha papel **A4**, escala **100%** e desmarque **cabeçalhos e rodapés**.
3. A folha usa o layout **3 × 7** (21 etiquetas de 63,5 × 38,1 mm), compatível com folhas adesivas tipo Pimaco A4256 / Avery L7160. Em papel comum, recorte pelas linhas tracejadas e cole com fita transparente.
4. **Teste antes de colar:** escaneie 2 ou 3 etiquetas impressas com o celular, pelo scanner do sistema.

Cada etiqueta tem o QR (32 mm), o nome do componente, o código em texto e a localização.
