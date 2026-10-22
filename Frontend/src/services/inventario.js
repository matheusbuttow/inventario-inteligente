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
export async function login(email, senha) {
  if (MOCK) { await espera(); return { token: "token-mock" }; }
  return (await api.post("/auth/login", { email, senha })).data;
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

export async function historico(filtros = {}) {
  if (MOCK) {
    await espera();
    return emprestimos
      .map((e) => ({ ...e, componente: componentes.find((c) => c.id === e.componente_id) }))
      .reverse();
  }
  return (await api.get("/emprestimos/historico", { params: filtros })).data;
}

export const mensagemDeErro = (err, padrao = "Algo deu errado.") =>
  err.response?.data?.mensagem || padrao;