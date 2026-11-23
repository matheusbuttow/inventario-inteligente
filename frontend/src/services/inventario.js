import api from "./api";

const MOCK = import.meta.env.VITE_USE_MOCK === "true";
const espera = (ms = 300) => new Promise((r) => setTimeout(r, ms));

function erroApi(status, erro, mensagem) {
  const e = new Error(mensagem);
  e.response = { status, data: { erro, mensagem } };
  return e;
}

// ---------- dados falsos ----------
const eu = { id: 1, nome: "Lucas Derick" };
let proxEmprestimo = 3;

const componentes = [
  { id: 1, nome: "Sensor Ultrassônico HC-SR04", categoria: "sensor", codigo_qr: "QR-001",
    localizacao: { nome: "Armário 2 — Gaveta B", laboratorio: "Lab. de Sistemas Embarcados" },
    status: "disponivel" },
  { id: 2, nome: "Arduino Uno R3", categoria: "microcontrolador", codigo_qr: "QR-002",
    localizacao: { nome: "Armário 1 — Gaveta A", laboratorio: "Lab. de Sistemas Embarcados" },
    status: "emprestado" },
  { id: 3, nome: "Módulo Bluetooth HC-05", categoria: "módulo", codigo_qr: "QR-003",
    localizacao: { nome: "Armário 2 — Gaveta C", laboratorio: "Lab. de Sistemas Embarcados" },
    status: "manutencao" },
];

const emprestimos = [
  { id: 1, usuario_id: 2, usuario_nome: "Maria Souza", componente_id: 2,
    retirado_em: new Date(Date.now() - 9 * 864e5).toISOString(), devolvido_em: null },
  { id: 2, usuario_id: 1, usuario_nome: eu.nome, componente_id: 1,
    retirado_em: new Date(Date.now() - 20 * 864e5).toISOString(),
    devolvido_em: new Date(Date.now() - 18 * 864e5).toISOString() },
];

function comEmprestimo(c) {
  const aberto = emprestimos.find((e) => e.componente_id === c.id && !e.devolvido_em);
  return { ...c, emprestimo_aberto: aberto || null };
}

// ---------- funções usadas pelas telas ----------
// ---------- sessão ----------
export function usuarioLogado() {
  try {
    return JSON.parse(localStorage.getItem("usuario") || "null");
  } catch {
    return null;
  }
}

export function sair() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
}

export const ehAdmin = () => usuarioLogado()?.perfil === "admin";

export async function login(email, senha) {
  const dados = MOCK
    ? (await espera(), {
        token: "token-mock",
        usuario: { ...eu, perfil: email.startsWith("admin") ? "admin" : "aluno" },
      })
    : (await api.post("/auth/login", { email, senha })).data;
  localStorage.setItem("token", dados.token);
  localStorage.setItem("usuario", JSON.stringify(dados.usuario));
  return dados;
}

export async function listarComponentes({ status, busca } = {}) {
  if (MOCK) {
    await espera();
    return componentes
      .filter((c) => !status || c.status === status)
      .filter((c) => !busca || c.nome.toLowerCase().includes(busca.toLowerCase()))
      .map(comEmprestimo);
  }
  return (await api.get("/componentes", { params: { status, busca } })).data;
}

export async function buscarComponente(id) {
  if (MOCK) {
    await espera();
    const c = componentes.find((x) => x.id === Number(id));
    if (!c) throw erroApi(404, "NAO_ENCONTRADO", "Componente não encontrado.");
    return comEmprestimo(c);
  }
  return (await api.get(`/componentes/${id}`)).data;
}

export async function buscarPorQr(codigo) {
  if (MOCK) {
    await espera(150);
    const c = componentes.find((x) => x.codigo_qr === codigo.trim());
    if (!c) throw erroApi(404, "QR_INVALIDO", "QR Code não reconhecido.");
    return comEmprestimo(c);
  }
  return (await api.get(`/componentes/qr/${encodeURIComponent(codigo.trim())}`)).data;
}

export async function pegar(componenteId) {
  if (MOCK) {
    await espera(150);
    const c = componentes.find((x) => x.id === componenteId);
    if (c.status === "manutencao")
      throw erroApi(409, "COMPONENTE_EM_MANUTENCAO", "Componente em manutenção.");
    if (c.status === "emprestado")
      throw erroApi(409, "COMPONENTE_JA_EMPRESTADO", "Este componente já está emprestado.");
    c.status = "emprestado";
    const novo = { id: proxEmprestimo++, usuario_id: eu.id, usuario_nome: eu.nome,
      componente_id: c.id, retirado_em: new Date().toISOString(), devolvido_em: null };
    emprestimos.push(novo);
    return novo;
  }
  return (await api.post("/emprestimos", { componente_id: componenteId })).data;
}

export async function devolver(emprestimoId) {
  if (MOCK) {
    await espera(150);
    const e = emprestimos.find((x) => x.id === emprestimoId);
    if (!e || e.devolvido_em) throw erroApi(409, "JA_DEVOLVIDO", "Empréstimo já devolvido.");
    e.devolvido_em = new Date().toISOString();
    componentes.find((c) => c.id === e.componente_id).status = "disponivel";
    return e;
  }
  return (await api.patch(`/emprestimos/${emprestimoId}/devolver`)).data;
}

export async function meusEmprestimos() {
  if (MOCK) {
    await espera();
    return emprestimos
      .filter((e) => e.usuario_id === eu.id && !e.devolvido_em)
      .map((e) => ({ ...e, componente: componentes.find((c) => c.id === e.componente_id) }));
  }
  return (await api.get("/emprestimos/meus")).data;
}

export async function atrasados() {
  if (MOCK) { await espera(); return []; }
  return (await api.get("/emprestimos/atrasados")).data;
}

export async function historico(filtros = {}) {
  if (MOCK) {
    await espera();
    return emprestimos
      .map((e) => ({ ...e, componente: componentes.find((c) => c.id === e.componente_id) }))
      .reverse();
  }
  return (await api.get("/emprestimos/historico", { params: filtros })).data;
}

// ---------- fotos ----------
const BASE_API = import.meta.env.VITE_API_URL || "http://localhost:3000";

// foto_url vem relativa da API (/componentes/1/foto?v=...); no mock já é uma data URL.
export const urlDaFoto = (componente) => {
  const url = componente?.foto_url;
  if (!url) return null;
  return url.startsWith("data:") ? url : `${BASE_API}${url}`;
};

export async function salvarFoto(componenteId, dataUrl) {
  if (MOCK) {
    await espera(150);
    const c = componentes.find((x) => x.id === Number(componenteId));
    c.foto_url = dataUrl;
    return comEmprestimo(c);
  }
  return (await api.put(`/componentes/${componenteId}/foto`, { imagem: dataUrl })).data;
}

export async function removerFoto(componenteId) {
  if (MOCK) {
    await espera(150);
    const c = componentes.find((x) => x.id === Number(componenteId));
    c.foto_url = null;
    return comEmprestimo(c);
  }
  return (await api.delete(`/componentes/${componenteId}/foto`)).data;
}

// ---------- cadastro de componentes (admin) ----------
const locaisMock = [
  { id: 1, nome: "Armário 1 — Gaveta A", laboratorio: "Lab. de Sistemas Embarcados" },
  { id: 2, nome: "Armário 2 — Gaveta B", laboratorio: "Lab. de Sistemas Embarcados" },
];

export async function criarComponente(dados) {
  if (MOCK) {
    await espera(150);
    if (componentes.some((c) => c.codigo_qr === dados.codigo_qr))
      throw erroApi(409, "CONFLITO", "Já existe um componente com este código QR.");
    const novo = { ...dados, id: Math.max(0, ...componentes.map((c) => c.id)) + 1,
      localizacao: locaisMock.find((l) => l.id === Number(dados.localizacao_id)) || null };
    componentes.push(novo);
    return comEmprestimo(novo);
  }
  return (await api.post("/componentes", dados)).data;
}

export async function atualizarComponente(id, dados) {
  if (MOCK) {
    await espera(150);
    const c = componentes.find((x) => x.id === Number(id));
    Object.assign(c, dados, {
      localizacao: locaisMock.find((l) => l.id === Number(dados.localizacao_id)) || c.localizacao,
    });
    return comEmprestimo(c);
  }
  return (await api.put(`/componentes/${id}`, dados)).data;
}

export async function removerComponente(id) {
  if (MOCK) {
    await espera(150);
    const i = componentes.findIndex((x) => x.id === Number(id));
    componentes.splice(i, 1);
    return;
  }
  await api.delete(`/componentes/${id}`);
}

// ---------- localizações (admin cadastra; todos listam) ----------
export async function listarLocalizacoes() {
  if (MOCK) { await espera(); return [...locaisMock]; }
  return (await api.get("/localizacoes")).data;
}

export async function criarLocalizacao(dados) {
  if (MOCK) {
    await espera(150);
    const novo = { ...dados, id: Math.max(0, ...locaisMock.map((l) => l.id)) + 1 };
    locaisMock.push(novo);
    return novo;
  }
  return (await api.post("/localizacoes", dados)).data;
}

export async function atualizarLocalizacao(id, dados) {
  if (MOCK) {
    await espera(150);
    const l = locaisMock.find((x) => x.id === id);
    Object.assign(l, dados);
    return l;
  }
  return (await api.put(`/localizacoes/${id}`, dados)).data;
}

export async function removerLocalizacao(id) {
  if (MOCK) {
    await espera(150);
    locaisMock.splice(locaisMock.findIndex((x) => x.id === id), 1);
    return;
  }
  await api.delete(`/localizacoes/${id}`);
}

// ---------- pessoas (só admin) ----------
const pessoasMock = [
  { id: 1, nome: eu.nome, matricula: "12345", email: "aluno@furg.br", perfil: "aluno", ativo: true },
  { id: 2, nome: "Administrador", matricula: "99999", email: "admin@furg.br", perfil: "admin", ativo: true },
];

export async function listarUsuarios() {
  if (MOCK) { await espera(); return pessoasMock.map((p) => ({ ...p })); }
  return (await api.get("/usuarios")).data;
}

export async function criarUsuario(dados) {
  if (MOCK) {
    await espera(150);
    if (pessoasMock.some((p) => p.email === dados.email))
      throw erroApi(409, "CONFLITO", "Este e-mail já está cadastrado.");
    const resto = { ...dados };
    delete resto.senha;
    const novo = { ...resto, id: Math.max(0, ...pessoasMock.map((p) => p.id)) + 1, ativo: true };
    pessoasMock.push(novo);
    return novo;
  }
  return (await api.post("/usuarios", dados)).data;
}

export async function atualizarUsuario(id, dados) {
  if (MOCK) {
    await espera(150);
    const p = pessoasMock.find((x) => x.id === id);
    const resto = { ...dados };
    delete resto.senha;
    Object.assign(p, resto);
    return { ...p };
  }
  return (await api.patch(`/usuarios/${id}`, dados)).data;
}

export const mensagemDeErro = (err, padrao = "Algo deu errado.") =>
  err.response?.data?.mensagem || padrao;