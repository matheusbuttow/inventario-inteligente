-- 1. Tabela de Usuários
CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    matricula VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    perfil VARCHAR(20) NOT NULL CHECK (perfil IN ('aluno', 'admin')),
    criado_em TIMESTAMP DEFAULT NOW()
);

-- 2. Tabela de Localizações
CREATE TABLE localizacao (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(80) NOT NULL,
    laboratorio VARCHAR(80) NOT NULL
);

-- 3. Tabela de Componentes
CREATE TABLE componente (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    categoria VARCHAR(60),
    codigo_qr VARCHAR(64) UNIQUE NOT NULL,
    localizacao_id INT REFERENCES localizacao(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('disponivel', 'emprestado', 'manutencao')),
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Índice exigido para filtro por status (Semana 1)
CREATE INDEX idx_componente_status ON componente(status);

-- 4. Tabela de Empréstimos
CREATE TABLE emprestimo (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    componente_id INT NOT NULL REFERENCES componente(id) ON DELETE RESTRICT,
    retirado_em TIMESTAMP DEFAULT NOW(),
    devolvido_em TIMESTAMP NULL -- Fica nulo enquanto o item não for devolvido
);