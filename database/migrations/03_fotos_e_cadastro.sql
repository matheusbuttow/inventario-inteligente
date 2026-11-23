-- Fotos dos componentes e contas que podem ser desativadas pelo admin.
ALTER TABLE componente ADD COLUMN IF NOT EXISTS foto BYTEA;
ALTER TABLE componente ADD COLUMN IF NOT EXISTS foto_tipo VARCHAR(40);
ALTER TABLE componente ADD COLUMN IF NOT EXISTS foto_atualizada_em TIMESTAMPTZ;

ALTER TABLE usuario ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE;
