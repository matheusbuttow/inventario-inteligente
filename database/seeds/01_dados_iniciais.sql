-- Usuários de teste (Senha fictícia usando hash bcrypt para testes locais)
INSERT INTO usuario (nome, matricula, email, senha_hash, perfil) VALUES
('Aluno Teste', '12345', 'aluno@furg.br', '$2b$10$exemploHashBcryptSenha123', 'aluno'),
('Admin Lab', '99999', 'admin@furg.br', '$2b$10$exemploHashBcryptSenha123', 'admin');

-- Localizações
INSERT INTO localizacao (nome, laboratorio) VALUES
('Armário 2 — Gaveta B', 'Lab. de Sistemas Embarcados'),
('Armário 1 — Prateleira C', 'Lab. de Automação');

-- Componentes
INSERT INTO componente (nome, categoria, codigo_qr, localizacao_id, status) VALUES
('Sensor Ultrassônico HC-SR04', 'sensor', 'qr-hc-sr04-01', 1, 'disponivel'),
('Arduino Uno R3', 'microcontrolador', 'qr-arduino-01', 1, 'disponivel'),
('Osciloscópio Digital', 'equipamento', 'qr-osc-01', 2, 'manutencao');

-- Emprestimo
INSERT INTO emprestimo (usuario_id, componente_id) VALUES (1, 1);