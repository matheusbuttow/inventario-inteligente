#!/usr/bin/env node
// Gera uma página HTML (A4) com as etiquetas QR dos componentes, pronta para imprimir.
//
//   npm run gerar                       # lê os componentes do Postgres do Compose
//   npm run gerar -- --json arq.json    # lê de um arquivo JSON (sem banco)
//   npm run gerar -- --saida x.html     # muda o arquivo de saída
//
// O formato do código está documentado no README.md desta pasta.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import QRCode from 'qrcode';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '../..');

// Mesmas regras do README: minúsculas, números e hífens, começa com "qr-", até 64 caracteres
// (tamanho de componente.codigo_qr no banco).
export const FORMATO_CODIGO = /^qr-[a-z0-9]+(-[a-z0-9]+)*$/;
export const TAMANHO_MAXIMO = 64;

function carregarEnv() {
  try {
    process.loadEnvFile(resolve(RAIZ, '.env'));
  } catch {
    // Sem .env: usa as variáveis já exportadas ou os padrões abaixo.
  }
}

async function lerDoBanco() {
  const { default: pg } = await import('pg');
  const cliente = new pg.Client({
    // POSTGRES_HOST no .env é "db" (nome na rede Docker); daqui, de fora do Docker, é localhost.
    host: process.env.ETIQUETAS_DB_HOST || 'localhost',
    port: Number(process.env.POSTGRES_HOST_PORT || 5432),
    database: process.env.POSTGRES_DB || 'inventario',
    user: process.env.POSTGRES_USER || 'inventario',
    password: process.env.POSTGRES_PASSWORD,
  });
  await cliente.connect();
  try {
    const { rows } = await cliente.query(`
      SELECT c.codigo_qr, c.nome, l.nome AS local, l.laboratorio
        FROM componente c
        LEFT JOIN localizacao l ON l.id = c.localizacao_id
       ORDER BY l.laboratorio NULLS LAST, l.nome NULLS LAST, c.nome, c.codigo_qr`);
    return rows;
  } finally {
    await cliente.end();
  }
}

async function lerDoJson(caminho) {
  const dados = JSON.parse(await readFile(resolve(process.cwd(), caminho), 'utf8'));
  if (!Array.isArray(dados)) throw new Error(`${caminho} deve conter uma lista de componentes.`);
  return dados;
}

// Devolve { erros, avisos }. Erros impedem a geração; avisos só são mostrados.
export function validar(componentes) {
  const erros = [];
  const avisos = [];
  const vistos = new Set();
  componentes.forEach((c, i) => {
    const onde = `item ${i + 1}${c?.nome ? ` (${c.nome})` : ''}`;
    if (!c?.codigo_qr) return erros.push(`${onde}: sem codigo_qr.`);
    if (!c.nome) erros.push(`${onde}: sem nome.`);
    if (vistos.has(c.codigo_qr)) erros.push(`${onde}: código repetido "${c.codigo_qr}".`);
    vistos.add(c.codigo_qr);
    if (c.codigo_qr.length > TAMANHO_MAXIMO)
      erros.push(`${onde}: "${c.codigo_qr}" passa de ${TAMANHO_MAXIMO} caracteres.`);
    else if (!FORMATO_CODIGO.test(c.codigo_qr))
      avisos.push(`${onde}: "${c.codigo_qr}" fora do formato qr-<nome>-<nn> (ver README).`);
  });
  return { erros, avisos };
}

const escapar = (s = '') =>
  String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

export async function montarHtml(componentes) {
  const etiquetas = await Promise.all(
    componentes.map(async (c) => {
      // O QR guarda SÓ o código (o front chama GET /componentes/qr/:codigo com ele).
      const svg = await QRCode.toString(c.codigo_qr, { type: 'svg', errorCorrectionLevel: 'M', margin: 2 });
      const local = [c.local, c.laboratorio].filter(Boolean).join(' · ');
      return `
    <div class="etiqueta">
      <div class="qr">${svg}</div>
      <div class="texto">
        <div class="nome">${escapar(c.nome)}</div>
        <div class="codigo">${escapar(c.codigo_qr)}</div>
        ${local ? `<div class="local">${escapar(local)}</div>` : ''}
      </div>
    </div>`;
    }),
  );

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Etiquetas QR — Inventário Inteligente</title>
<style>
  /* Folha A4 no layout 3 x 7 (etiquetas de 63,5 x 38,1 mm, ex.: Pimaco A4256 / Avery L7160).
     Em papel comum, recorte pelas linhas tracejadas. Imprima em escala 100%, sem margens extras. */
  @page { size: A4; margin: 15.1mm 7.2mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #000; background: #fff; }
  .aviso { padding: 8px 12px; margin: 8px; background: #fff7d6; border: 1px solid #e0c200; font-size: 13px; }
  .folha { display: grid; grid-template-columns: repeat(3, 63.5mm); grid-auto-rows: 38.1mm; column-gap: 2.5mm; }
  .etiqueta { display: flex; align-items: center; gap: 2mm; padding: 2mm; border: 0.2mm dashed #999;
              overflow: hidden; break-inside: avoid; }
  .qr { flex: 0 0 32mm; height: 32mm; }
  .qr svg { width: 100%; height: 100%; display: block; }
  .texto { min-width: 0; display: flex; flex-direction: column; gap: 1.2mm; }
  .nome { font-weight: bold; font-size: 9pt; line-height: 1.15; display: -webkit-box;
          -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  .codigo { font-family: "Courier New", monospace; font-size: 8pt; word-break: break-all; }
  .local { font-size: 6.5pt; color: #333; line-height: 1.15; }
  @media print { .aviso { display: none; } }
</style>
</head>
<body>
  <div class="aviso">${componentes.length} etiqueta(s). Imprima em A4, escala 100% e sem cabeçalho/rodapé
    (Ctrl+P → "Mais definições"). Esta faixa não sai na impressão.</div>
  <div class="folha">${etiquetas.join('')}
  </div>
</body>
</html>
`;
}

async function main() {
  const { values } = parseArgs({
    options: {
      json: { type: 'string' },
      saida: { type: 'string', default: resolve(AQUI, 'saida/etiquetas.html') },
    },
  });

  carregarEnv();
  let componentes;
  try {
    componentes = values.json ? await lerDoJson(values.json) : await lerDoBanco();
  } catch (err) {
    console.error(`Não consegui ler os componentes: ${err.message}`);
    if (!values.json)
      console.error('O banco está no ar e preparado? (docker compose up -d db; ver README, seção 6)\n' +
        'Sem banco, use: npm run gerar -- --json exemplo-componentes.json');
    process.exit(1);
  }

  if (componentes.length === 0) {
    console.error('Nenhum componente encontrado. Cadastre componentes (ou rode os seeds) e tente de novo.');
    process.exit(1);
  }

  const { erros, avisos } = validar(componentes);
  avisos.forEach((a) => console.warn(`aviso: ${a}`));
  if (erros.length) {
    erros.forEach((e) => console.error(`erro: ${e}`));
    process.exit(1);
  }

  const saida = resolve(process.cwd(), values.saida);
  await mkdir(dirname(saida), { recursive: true });
  await writeFile(saida, await montarHtml(componentes));
  console.log(`${componentes.length} etiqueta(s) gerada(s) em ${saida}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
