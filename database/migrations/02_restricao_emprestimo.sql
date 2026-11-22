-- Restrição para garantir que um componente só tenha um empréstimo aberto por vez
CREATE UNIQUE INDEX idx_um_emprestimo_aberto_por_componente 
ON emprestimo (componente_id) 
WHERE devolvido_em IS NULL;