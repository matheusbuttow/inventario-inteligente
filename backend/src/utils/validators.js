const PERFIS_VALIDOS = ['aluno', 'admin'];
const STATUS_VALIDOS = ['disponivel', 'emprestado', 'manutencao'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseIntPositivo(valor) {
  if (typeof valor === 'number') {
    return Number.isInteger(valor) && valor >= 1 ? valor : null;
  }
  if (typeof valor === 'string' && /^\d+$/.test(valor.trim())) {
    const num = Number(valor.trim());
    return Number.isSafeInteger(num) && num >= 1 ? num : null;
  }
  return null;
}

function textoValido(valor, { min = 1, max = Infinity } = {}) {
  if (typeof valor !== 'string') return null;
  const limpo = valor.trim();
  if (limpo.length < min || limpo.length > max) return null;
  return limpo;
}

function emailValido(valor) {
  const limpo = textoValido(valor, { min: 3, max: 120 });
  if (!limpo) return null;
  return EMAIL_REGEX.test(limpo) ? limpo.toLowerCase() : null;
}

module.exports = {
  PERFIS_VALIDOS,
  STATUS_VALIDOS,
  parseIntPositivo,
  textoValido,
  emailValido,
};
