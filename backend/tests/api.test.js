const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'segredo-de-teste';
process.env.JWT_EXPIRES_IN = '7d';
process.env.DIAS_ATRASO = '7';

// Substitui o módulo de banco antes de carregar o app
const dbPath = require.resolve('../src/config/database');
let mockQueryHandler = async () => ({ rows: [] });
let mockClientHandler = null;

const dbMock = {
  query: (...args) => mockQueryHandler(...args),
  getClient: async () => {
    if (mockClientHandler) return mockClientHandler();
    return {
      query: (...args) => mockQueryHandler(...args),
      release: () => {},
    };
  },
  pool: { end: async () => {} },
};

require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: dbMock,
};

const app = require('../src/app');

function gerarToken(usuario = { id: 1, perfil: 'aluno', email: 'aluno@furg.br', matricula: '12345' }) {
  return jwt.sign(usuario, process.env.JWT_SECRET, { expiresIn: '1h' });
}

describe('API Inventário Inteligente', () => {
  let server;
  let baseUrl;
  let tokenAluno;
  let tokenAdmin;

  before(async () => {
    tokenAluno = gerarToken({ id: 1, perfil: 'aluno', email: 'aluno@furg.br', matricula: '12345' });
    tokenAdmin = gerarToken({ id: 2, perfil: 'admin', email: 'admin@furg.br', matricula: '99999' });

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  beforeEach(() => {
    mockQueryHandler = async () => ({ rows: [] });
    mockClientHandler = null;
  });

  async function req(caminho, { method = 'GET', token, body, rawBody } = {}) {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined || rawBody !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(`${baseUrl}${caminho}`, {
      method,
      headers,
      body: rawBody !== undefined ? rawBody : body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = text;
    }
    return { status: res.status, headers: res.headers, body: json };
  }

  describe('Saúde, CORS e erros globais', () => {
    it('GET /health retorna 200 sem prefixo /api', async () => {
      mockQueryHandler = async () => ({ rows: [{ '?column?': 1 }] });
      const res = await req('/health');
      assert.equal(res.status, 200);
      assert.equal(res.body.status, 'ok');
      assert.ok(res.body.timestamp);
    });

    it('OPTIONS retorna 204 com cabeçalhos CORS', async () => {
      const res = await req('/componentes', { method: 'OPTIONS' });
      assert.equal(res.status, 204);
      assert.equal(res.headers.get('access-control-allow-origin'), '*');
    });

    it('Retorna 400 DADOS_INVALIDOS para JSON malformado', async () => {
      const res = await req('/auth/login', { method: 'POST', rawBody: '{invalido' });
      assert.equal(res.status, 400);
      assert.equal(res.body.erro, 'DADOS_INVALIDOS');
    });

    it('Retorna 404 NAO_ENCONTRADO para rota inexistente', async () => {
      const res = await req('/rota-que-nao-existe');
      assert.equal(res.status, 404);
      assert.equal(res.body.erro, 'NAO_ENCONTRADO');
    });
  });

  describe('Autenticação (/auth)', () => {
    it('POST /auth/registrar cria usuário e retorna 201', async () => {
      mockQueryHandler = async (sql, params) => {
        assert.match(sql, /INSERT INTO usuario/i);
        assert.equal(params[2], 'maria@furg.br');
        assert.equal(params[4], 'aluno');
        return {
          rows: [
            {
              id: 10,
              nome: params[0],
              matricula: params[1],
              email: params[2],
              perfil: params[4],
              criado_em: '2026-10-14T12:00:00.000Z',
            },
          ],
        };
      };

      const res = await req('/auth/registrar', {
        method: 'POST',
        body: {
          nome: 'Maria Silva',
          matricula: '202312345',
          email: 'Maria@FURG.br',
          senha: 'senhaSegura123',
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.body.id, 10);
      assert.equal(res.body.email, 'maria@furg.br');
      assert.equal(res.body.senha_hash, undefined);
    });

    it('POST /auth/registrar retorna 409 quando e-mail já existe', async () => {
      mockQueryHandler = async () => {
        const err = new Error('duplicate key');
        err.code = '23505';
        err.constraint = 'usuario_email_key';
        throw err;
      };

      const res = await req('/auth/registrar', {
        method: 'POST',
        body: {
          nome: 'Maria Silva',
          matricula: '202312345',
          email: 'maria@furg.br',
          senha: 'senhaSegura123',
        },
      });

      assert.equal(res.status, 409);
      assert.equal(res.body.erro, 'CONFLITO');
    });

    it('POST /auth/login autentica por email e retorna token + usuario', async () => {
      const hash = await bcrypt.hash('senha123', 4);
      mockQueryHandler = async (sql, params) => {
        assert.match(sql, /LOWER\(email\)/i);
        assert.equal(params[0], 'aluno@furg.br');
        return {
          rows: [
            {
              id: 1,
              nome: 'Aluno Teste',
              matricula: '12345',
              email: 'aluno@furg.br',
              senha_hash: hash,
              perfil: 'aluno',
              criado_em: '2026-10-14T12:00:00.000Z',
            },
          ],
        };
      };

      const res = await req('/auth/login', {
        method: 'POST',
        body: { email: 'aluno@furg.br', senha: 'senha123' },
      });

      assert.equal(res.status, 200);
      assert.ok(res.body.token);
      assert.equal(res.body.usuario.email, 'aluno@furg.br');
      assert.equal(res.body.usuario.senha_hash, undefined);
    });

    it('POST /auth/login lida com hash inválido no banco retornando 401 sem quebrar', async () => {
      mockQueryHandler = async () => ({
        rows: [
          {
            id: 1,
            nome: 'Aluno Teste',
            matricula: '12345',
            email: 'aluno@furg.br',
            senha_hash: '$2b$10$hashInvalidoCurto',
            perfil: 'aluno',
          },
        ],
      });

      const res = await req('/auth/login', {
        method: 'POST',
        body: { email: 'aluno@furg.br', senha: 'senha123' },
      });

      assert.equal(res.status, 401);
      assert.equal(res.body.erro, 'NAO_AUTENTICADO');
    });

    it('GET /auth/eu exige token e retorna dados do usuário autenticado', async () => {
      const semToken = await req('/auth/eu');
      assert.equal(semToken.status, 401);
      assert.equal(semToken.body.erro, 'NAO_AUTENTICADO');

      mockQueryHandler = async () => ({
        rows: [
          {
            id: 1,
            nome: 'Aluno Teste',
            matricula: '12345',
            email: 'aluno@furg.br',
            perfil: 'aluno',
            criado_em: '2026-10-14T12:00:00.000Z',
          },
        ],
      });

      const comToken = await req('/auth/eu', { token: tokenAluno });
      assert.equal(comToken.status, 200);
      assert.equal(comToken.body.id, 1);
    });
  });

  describe('Localizações (/localizacoes)', () => {
    it('GET /localizacoes lista localizações para usuário autenticado', async () => {
      mockQueryHandler = async () => ({
        rows: [{ id: 1, nome: 'Armário 2 — Gaveta B', laboratorio: 'Lab. de Sistemas Embarcados' }],
      });

      const res = await req('/localizacoes', { token: tokenAluno });
      assert.equal(res.status, 200);
      assert.equal(res.body.length, 1);
    });

    it('POST /localizacoes bloqueia aluno (403) e permite admin (201)', async () => {
      const comoAluno = await req('/localizacoes', {
        method: 'POST',
        token: tokenAluno,
        body: { nome: 'Armário 3', laboratorio: 'Lab. de Robótica' },
      });
      assert.equal(comoAluno.status, 403);
      assert.equal(comoAluno.body.erro, 'SEM_PERMISSAO');

      mockQueryHandler = async () => ({
        rows: [{ id: 3, nome: 'Armário 3', laboratorio: 'Lab. de Robótica' }],
      });

      const comoAdmin = await req('/localizacoes', {
        method: 'POST',
        token: tokenAdmin,
        body: { nome: 'Armário 3', laboratorio: 'Lab. de Robótica' },
      });
      assert.equal(comoAdmin.status, 201);
      assert.equal(comoAdmin.body.id, 3);
    });
  });

  describe('Componentes (/componentes)', () => {
    const componenteRow = {
      id: 1,
      nome: 'Sensor Ultrassônico HC-SR04',
      categoria: 'sensor',
      codigo_qr: 'qr-hc-sr04-01',
      localizacao_id: 1,
      status: 'disponivel',
      criado_em: '2026-10-14T12:00:00.000Z',
      loc_id: 1,
      loc_nome: 'Armário 2 — Gaveta B',
      loc_laboratorio: 'Lab. de Sistemas Embarcados',
      emp_id: null,
      emp_usuario_id: null,
      emp_usuario_nome: null,
      emp_retirado_em: null,
    };

    it('GET /componentes filtra por status e busca', async () => {
      mockQueryHandler = async (sql, params) => {
        assert.match(sql, /c\.status = \$1/);
        assert.match(sql, /ILIKE \$2/);
        assert.deepEqual(params, ['disponivel', '%HC-SR04%']);
        return { rows: [componenteRow] };
      };

      const res = await req('/componentes?status=disponivel&busca=HC-SR04', { token: tokenAluno });
      assert.equal(res.status, 200);
      assert.equal(res.body.length, 1);
      assert.equal(res.body[0].localizacao.nome, 'Armário 2 — Gaveta B');
      assert.equal(res.body[0].emprestimo_aberto, null);
    });

    it('GET /componentes/qr/:codigo retorna detalhe ou 404 QR_INVALIDO', async () => {
      mockQueryHandler = async () => ({ rows: [] });
      const naoAchou = await req('/componentes/qr/inexistente', { token: tokenAluno });
      assert.equal(naoAchou.status, 404);
      assert.equal(naoAchou.body.erro, 'QR_INVALIDO');

      mockQueryHandler = async () => ({ rows: [componenteRow] });
      const achou = await req('/componentes/qr/qr-hc-sr04-01', { token: tokenAluno });
      assert.equal(achou.status, 200);
      assert.equal(achou.body.codigo_qr, 'qr-hc-sr04-01');
    });

    it('GET /componentes/:id retorna 404 NAO_ENCONTRADO quando não existe', async () => {
      mockQueryHandler = async () => ({ rows: [] });
      const res = await req('/componentes/999', { token: tokenAluno });
      assert.equal(res.status, 404);
      assert.equal(res.body.erro, 'NAO_ENCONTRADO');
    });

    it('DELETE /componentes/:id impede remoção se houver histórico de empréstimos', async () => {
      let passo = 0;
      mockQueryHandler = async () => {
        passo += 1;
        if (passo === 1) return { rows: [{ id: 1 }] };
        return { rows: [{ '?column?': 1 }] };
      };

      const res = await req('/componentes/1', { method: 'DELETE', token: tokenAdmin });
      assert.equal(res.status, 409);
      assert.equal(res.body.erro, 'COMPONENTE_COM_HISTORICO');
    });
  });

  describe('Empréstimos (/emprestimos)', () => {
    const emprestimoCompletoRow = {
      id: 5,
      usuario_id: 1,
      componente_id: 1,
      retirado_em: '2026-10-14T12:00:00.000Z',
      devolvido_em: null,
      usr_id: 1,
      usr_nome: 'Aluno Teste',
      usr_matricula: '12345',
      usr_email: 'aluno@furg.br',
      usr_perfil: 'aluno',
      usr_criado_em: '2026-10-14T10:00:00.000Z',
      comp_id: 1,
      comp_nome: 'Sensor Ultrassônico HC-SR04',
      comp_categoria: 'sensor',
      comp_codigo_qr: 'qr-hc-sr04-01',
      comp_localizacao_id: 1,
      comp_status: 'emprestado',
      comp_criado_em: '2026-10-14T10:00:00.000Z',
      loc_id: 1,
      loc_nome: 'Armário 2 — Gaveta B',
      loc_laboratorio: 'Lab. de Sistemas Embarcados',
    };

    it('POST /emprestimos registra retirada com sucesso (201)', async () => {
      mockClientHandler = () => ({
        query: async (sql) => {
          if (sql.includes('FROM componente')) {
            return { rows: [{ id: 1, nome: 'Sensor', status: 'disponivel' }] };
          }
          if (sql.includes('FROM emprestimo')) {
            return { rows: [] };
          }
          if (sql.includes('INSERT INTO emprestimo')) {
            return { rows: [{ id: 5 }] };
          }
          return { rows: [] };
        },
        release: () => {},
      });

      mockQueryHandler = async () => ({ rows: [emprestimoCompletoRow] });

      const res = await req('/emprestimos', {
        method: 'POST',
        token: tokenAluno,
        body: { componente_id: 1 },
      });

      assert.equal(res.status, 201);
      assert.equal(res.body.id, 5);
      assert.equal(res.body.componente.status, 'emprestado');
    });

    it('POST /emprestimos retorna 409 COMPONENTE_EM_MANUTENCAO', async () => {
      mockClientHandler = () => ({
        query: async (sql) => {
          if (sql.includes('FROM componente')) {
            return { rows: [{ id: 3, nome: 'Osciloscópio', status: 'manutencao' }] };
          }
          return { rows: [] };
        },
        release: () => {},
      });

      const res = await req('/emprestimos', {
        method: 'POST',
        token: tokenAluno,
        body: { componente_id: 3 },
      });

      assert.equal(res.status, 409);
      assert.equal(res.body.erro, 'COMPONENTE_EM_MANUTENCAO');
    });

    it('POST /emprestimos retorna 409 COMPONENTE_JA_EMPRESTADO com nome de quem pegou', async () => {
      mockClientHandler = () => ({
        query: async (sql) => {
          if (sql.includes('FROM componente')) {
            return { rows: [{ id: 2, nome: 'Arduino', status: 'emprestado' }] };
          }
          if (sql.includes('FROM emprestimo')) {
            return {
              rows: [
                {
                  id: 9,
                  usuario_id: 2,
                  usuario_nome: 'Maria Souza',
                  retirado_em: '2026-10-14T15:00:00.000Z',
                },
              ],
            };
          }
          return { rows: [] };
        },
        release: () => {},
      });

      const res = await req('/emprestimos', {
        method: 'POST',
        token: tokenAluno,
        body: { componente_id: 2 },
      });

      assert.equal(res.status, 409);
      assert.equal(res.body.erro, 'COMPONENTE_JA_EMPRESTADO');
      assert.match(res.body.mensagem, /Maria Souza/);
    });

    it('PATCH /emprestimos/:id/devolver impede outro aluno (403) e permite dono ou admin (200)', async () => {
      const tokenOutroAluno = gerarToken({
        id: 99,
        perfil: 'aluno',
        email: 'outro@furg.br',
        matricula: '54321',
      });

      mockClientHandler = () => ({
        query: async (sql) => {
          if (sql.includes('FROM emprestimo')) {
            return {
              rows: [
                {
                  id: 5,
                  usuario_id: 1,
                  componente_id: 1,
                  retirado_em: '2026-10-14T12:00:00.000Z',
                  devolvido_em: null,
                },
              ],
            };
          }
          return { rows: [] };
        },
        release: () => {},
      });

      const outro = await req('/emprestimos/5/devolver', {
        method: 'PATCH',
        token: tokenOutroAluno,
      });
      assert.equal(outro.status, 403);
      assert.equal(outro.body.erro, 'SEM_PERMISSAO');

      mockQueryHandler = async () => ({
        rows: [
          {
            ...emprestimoCompletoRow,
            devolvido_em: '2026-10-15T12:00:00.000Z',
            comp_status: 'disponivel',
          },
        ],
      });

      const admin = await req('/emprestimos/5/devolver', {
        method: 'PATCH',
        token: tokenAdmin,
      });
      assert.equal(admin.status, 200);
      assert.ok(admin.body.devolvido_em);
      assert.equal(admin.body.componente.status, 'disponivel');
    });

    it('PATCH /emprestimos/:id/devolver retorna 409 JA_DEVOLVIDO se já fechado', async () => {
      mockClientHandler = () => ({
        query: async (sql) => {
          if (sql.includes('FROM emprestimo')) {
            return {
              rows: [
                {
                  id: 5,
                  usuario_id: 1,
                  componente_id: 1,
                  retirado_em: '2026-10-14T12:00:00.000Z',
                  devolvido_em: '2026-10-15T12:00:00.000Z',
                },
              ],
            };
          }
          return { rows: [] };
        },
        release: () => {},
      });

      const res = await req('/emprestimos/5/devolver', {
        method: 'PATCH',
        token: tokenAluno,
      });
      assert.equal(res.status, 409);
      assert.equal(res.body.erro, 'JA_DEVOLVIDO');
    });

    it('GET /emprestimos/meus, /historico e /atrasados funcionam corretamente', async () => {
      mockQueryHandler = async (sql, params) => {
        if (sql.includes('INTERVAL')) {
          assert.deepEqual(params, [7]);
        }
        return { rows: [emprestimoCompletoRow] };
      };

      const meus = await req('/emprestimos/meus', { token: tokenAluno });
      assert.equal(meus.status, 200);
      assert.equal(meus.body.length, 1);

      const hist = await req('/emprestimos/historico?componente_id=1&usuario_id=1', {
        token: tokenAluno,
      });
      assert.equal(hist.status, 200);
      assert.equal(hist.body.length, 1);

      const histInvalido = await req('/emprestimos/historico?componente_id=abc', {
        token: tokenAluno,
      });
      assert.equal(histInvalido.status, 400);
      assert.equal(histInvalido.body.erro, 'DADOS_INVALIDOS');

      const atrasados = await req('/emprestimos/atrasados', { token: tokenAluno });
      assert.equal(atrasados.status, 200);
      assert.equal(atrasados.body.length, 1);
    });
  });

  describe('Segurança (revisão do PR #6)', () => {
    it('POST /auth/registrar ignora perfil "admin" e cria sempre aluno', async () => {
      let perfilGravado;
      mockQueryHandler = async (sql, params) => {
        perfilGravado = params[4];
        return {
          rows: [{ id: 11, nome: params[0], matricula: params[1], email: params[2], perfil: params[4] }],
        };
      };

      const res = await req('/auth/registrar', {
        method: 'POST',
        body: {
          nome: 'Intruso',
          matricula: '666',
          email: 'intruso@example.invalid',
          senha: 'qualquer123',
          perfil: 'admin',
        },
      });

      assert.equal(res.status, 201);
      assert.equal(perfilGravado, 'aluno');
      assert.equal(res.body.perfil, 'aluno');
    });

    function linhaEmprestimo(usuarioId, nome) {
      return {
        id: 100 + usuarioId,
        usuario_id: usuarioId,
        componente_id: 1,
        retirado_em: '2026-11-20T12:00:00.000Z',
        devolvido_em: null,
        usr_id: usuarioId,
        usr_nome: nome,
        usr_matricula: `mat-${usuarioId}`,
        usr_email: `u${usuarioId}@furg.br`,
        usr_perfil: 'aluno',
        usr_criado_em: '2026-10-01T12:00:00.000Z',
        comp_id: 1,
        comp_nome: 'Sensor',
        comp_categoria: 'sensor',
        comp_codigo_qr: 'qr-sensor-01',
        comp_localizacao_id: null,
        comp_status: 'emprestado',
        comp_criado_em: '2026-10-01T12:00:00.000Z',
        loc_id: null,
      };
    }

    it('Histórico e atrasados mostram só o nome de outras pessoas para aluno', async () => {
      mockQueryHandler = async () => ({
        rows: [linhaEmprestimo(1, 'Aluno Teste'), linhaEmprestimo(7, 'Outra Pessoa')],
      });

      for (const rota of ['/emprestimos/historico', '/emprestimos/atrasados']) {
        const res = await req(rota, { token: tokenAluno });
        assert.equal(res.status, 200);
        const proprio = res.body.find((e) => e.usuario_id === 1).usuario;
        const outro = res.body.find((e) => e.usuario_id === 7).usuario;
        assert.equal(proprio.email, 'u1@furg.br');
        assert.deepEqual(outro, { id: 7, nome: 'Outra Pessoa' });
      }

      const admin = await req('/emprestimos/historico', { token: tokenAdmin });
      assert.equal(admin.body.find((e) => e.usuario_id === 7).usuario.email, 'u7@furg.br');
    });

    it('Componente não aceita status "emprestado" por criação ou edição', async () => {
      const criar = await req('/componentes', {
        method: 'POST',
        token: tokenAdmin,
        body: { nome: 'X', categoria: 'y', codigo_qr: 'qr-x-01', localizacao_id: 1, status: 'emprestado' },
      });
      assert.equal(criar.status, 400);
      assert.equal(criar.body.erro, 'DADOS_INVALIDOS');

      const editar = await req('/componentes/1', {
        method: 'PUT',
        token: tokenAdmin,
        body: { status: 'emprestado' },
      });
      assert.equal(editar.status, 400);
      assert.equal(editar.body.erro, 'DADOS_INVALIDOS');
    });

    it('PUT /componentes/:id recusa mudar status com empréstimo aberto', async () => {
      mockQueryHandler = async (sql) => {
        if (/UPDATE componente/i.test(sql)) {
          assert.match(sql, /NOT EXISTS/i);
          return { rows: [] };
        }
        if (/SELECT 1 FROM componente/i.test(sql)) return { rows: [{ '?column?': 1 }] };
        return { rows: [] };
      };

      const res = await req('/componentes/1', {
        method: 'PUT',
        token: tokenAdmin,
        body: { status: 'manutencao' },
      });
      assert.equal(res.status, 409);
      assert.equal(res.body.erro, 'COMPONENTE_JA_EMPRESTADO');
    });
  });
  describe('Fotos dos componentes', () => {
    const PNG_1PX =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

    it('PUT /componentes/:id/foto exige admin', async () => {
      const res = await req('/componentes/1/foto', {
        method: 'PUT',
        token: tokenAluno,
        body: { imagem: `data:image/png;base64,${PNG_1PX}` },
      });
      assert.equal(res.status, 403);
    });

    it('PUT /componentes/:id/foto recusa formato que não é imagem', async () => {
      const res = await req('/componentes/1/foto', {
        method: 'PUT',
        token: tokenAdmin,
        body: { imagem: 'data:text/plain;base64,b2k=' },
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.erro, 'DADOS_INVALIDOS');
    });

    it('PUT /componentes/:id/foto grava os bytes e devolve foto_url', async () => {
      let gravado = null;
      mockQueryHandler = async (sql, params) => {
        if (/UPDATE componente SET foto/i.test(sql)) {
          gravado = params;
          return { rows: [{ id: 1 }] };
        }
        if (/FROM componente c/i.test(sql)) {
          return {
            rows: [{
              id: 1, nome: 'Sensor', categoria: 's', codigo_qr: 'qr', localizacao_id: null,
              status: 'disponivel', criado_em: new Date(), tem_foto: true,
              foto_atualizada_em: new Date('2026-01-01T00:00:00Z'),
            }],
          };
        }
        return { rows: [] };
      };
      const res = await req('/componentes/1/foto', {
        method: 'PUT',
        token: tokenAdmin,
        body: { imagem: `data:image/png;base64,${PNG_1PX}` },
      });
      assert.equal(res.status, 200);
      assert.ok(Buffer.isBuffer(gravado[0]));
      assert.equal(gravado[1], 'image/png');
      assert.equal(res.body.foto_url, `/componentes/1/foto?v=${Date.parse('2026-01-01T00:00:00Z')}`);
    });

    it('GET /componentes/:id/foto é público e devolve a imagem', async () => {
      mockQueryHandler = async (sql) => {
        if (/SELECT foto, foto_tipo/i.test(sql)) {
          return { rows: [{ foto: Buffer.from(PNG_1PX, 'base64'), foto_tipo: 'image/png' }] };
        }
        return { rows: [] };
      };
      const res = await fetch(`${baseUrl}/componentes/1/foto`);
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'image/png');
      const bytes = Buffer.from(await res.arrayBuffer());
      assert.equal(bytes.length, Buffer.from(PNG_1PX, 'base64').length);
    });

    it('GET /componentes/:id/foto sem foto devolve 404', async () => {
      const res = await req('/componentes/9/foto');
      assert.equal(res.status, 404);
    });

    it('Listagem traz foto_url nula quando não há foto', async () => {
      mockQueryHandler = async () => ({
        rows: [{ id: 2, nome: 'Arduino', categoria: 'm', codigo_qr: 'qr2', status: 'disponivel', tem_foto: false }],
      });
      const res = await req('/componentes', { token: tokenAluno });
      assert.equal(res.status, 200);
      assert.equal(res.body[0].foto_url, null);
    });
  });

  describe('Cadastro de pessoas pelo admin', () => {
    it('/usuarios é só para admin', async () => {
      const lista = await req('/usuarios', { token: tokenAluno });
      assert.equal(lista.status, 403);
      const criar = await req('/usuarios', {
        method: 'POST',
        token: tokenAluno,
        body: { nome: 'X', matricula: '1', email: 'x@furg.br', senha: 'senha123', perfil: 'admin' },
      });
      assert.equal(criar.status, 403);
      const semToken = await req('/usuarios');
      assert.equal(semToken.status, 401);
    });

    it('POST /usuarios cria aluno ou admin com senha em hash', async () => {
      let params = null;
      mockQueryHandler = async (sql, p) => {
        if (/INSERT INTO usuario/i.test(sql)) {
          params = p;
          return { rows: [{ id: 5, nome: p[0], matricula: p[1], email: p[2], perfil: p[4], ativo: true }] };
        }
        return { rows: [] };
      };
      const res = await req('/usuarios', {
        method: 'POST',
        token: tokenAdmin,
        body: { nome: 'Prof. Ana', matricula: '777', email: 'ana@furg.br', senha: 'segura1', perfil: 'admin' },
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.perfil, 'admin');
      assert.equal(res.body.senha_hash, undefined);
      assert.ok(await bcrypt.compare('segura1', params[3]));
    });

    it('POST /usuarios recusa perfil inválido e e-mail duplicado', async () => {
      const perfil = await req('/usuarios', {
        method: 'POST',
        token: tokenAdmin,
        body: { nome: 'X', matricula: '1', email: 'x@furg.br', senha: 'senha123', perfil: 'root' },
      });
      assert.equal(perfil.status, 400);

      mockQueryHandler = async () => {
        const erro = new Error('dup');
        erro.code = '23505';
        erro.constraint = 'usuario_email_key';
        throw erro;
      };
      const dup = await req('/usuarios', {
        method: 'POST',
        token: tokenAdmin,
        body: { nome: 'X', matricula: '1', email: 'x@furg.br', senha: 'senha123' },
      });
      assert.equal(dup.status, 409);
    });

    it('PATCH /usuarios/:id não deixa o admin se rebaixar ou se desativar', async () => {
      const rebaixar = await req('/usuarios/2', { method: 'PATCH', token: tokenAdmin, body: { perfil: 'aluno' } });
      assert.equal(rebaixar.status, 400);
      const desativar = await req('/usuarios/2', { method: 'PATCH', token: tokenAdmin, body: { ativo: false } });
      assert.equal(desativar.status, 400);
    });

    it('PATCH /usuarios/:id desativa outra conta', async () => {
      mockQueryHandler = async (sql, p) => {
        if (/UPDATE usuario/i.test(sql)) {
          assert.deepEqual(p, [false, 1]);
          return { rows: [{ id: 1, nome: 'Aluno', perfil: 'aluno', ativo: false }] };
        }
        return { rows: [] };
      };
      const res = await req('/usuarios/1', { method: 'PATCH', token: tokenAdmin, body: { ativo: false } });
      assert.equal(res.status, 200);
      assert.equal(res.body.ativo, false);
    });

    it('Login recusa conta desativada', async () => {
      const hash = await bcrypt.hash('senha123', 4);
      mockQueryHandler = async () => ({
        rows: [{ id: 1, nome: 'A', email: 'aluno@furg.br', senha_hash: hash, perfil: 'aluno', ativo: false }],
      });
      const res = await req('/auth/login', { method: 'POST', body: { email: 'aluno@furg.br', senha: 'senha123' } });
      assert.equal(res.status, 401);
      assert.match(res.body.mensagem, /desativada/);
    });
  });

  describe('Localizações (admin)', () => {
    it('PUT e DELETE de localização exigem admin', async () => {
      const put = await req('/localizacoes/1', { method: 'PUT', token: tokenAluno, body: { nome: 'a', laboratorio: 'b' } });
      assert.equal(put.status, 403);
      const del = await req('/localizacoes/1', { method: 'DELETE', token: tokenAluno });
      assert.equal(del.status, 403);
    });

    it('PUT /localizacoes/:id atualiza', async () => {
      mockQueryHandler = async (sql, p) => ({ rows: [{ id: p[2], nome: p[0], laboratorio: p[1] }] });
      const res = await req('/localizacoes/3', {
        method: 'PUT',
        token: tokenAdmin,
        body: { nome: 'Gaveta 4', laboratorio: 'LabSis' },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.nome, 'Gaveta 4');
    });
  });
});
