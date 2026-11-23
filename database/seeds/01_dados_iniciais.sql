-- Usuários de teste (senha em texto plano para ambos: senha123)
INSERT INTO usuario (nome, matricula, email, senha_hash, perfil) VALUES
('Aluno Teste', '12345', 'aluno@furg.br', '$2a$10$RS.X5xyxkl5W.1M92lidNOoagkD5OMTSLa6ewPx9yxT.uDfM7KfhK', 'aluno'),
('Admin Lab', '99999', 'admin@furg.br', '$2a$10$RS.X5xyxkl5W.1M92lidNOoagkD5OMTSLa6ewPx9yxT.uDfM7KfhK', 'admin');

-- Localizações
INSERT INTO localizacao (nome, laboratorio) VALUES
('Armário 2 — Gaveta B', 'Lab. de Sistemas Embarcados'),
('Armário 1 — Prateleira C', 'Lab. de Automação');

-- Componentes
INSERT INTO componente (nome, categoria, codigo_qr, localizacao_id, status) VALUES
('Sensor Ultrassônico HC-SR04', 'sensor', 'qr-hc-sr04-01', 1, 'emprestado'),
('Arduino Uno R3', 'microcontrolador', 'qr-arduino-01', 1, 'disponivel'),
('Osciloscópio Digital', 'equipamento', 'qr-osc-01', 2, 'manutencao');

-- Empréstimo em aberto inicial (coerente com status = 'emprestado' do componente 1)
INSERT INTO emprestimo (usuario_id, componente_id) VALUES (1, 1);