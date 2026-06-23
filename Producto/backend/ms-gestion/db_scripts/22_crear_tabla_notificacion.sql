BEGIN;

CREATE TABLE IF NOT EXISTS notificacion (
    id_notificacion VARCHAR(15)  PRIMARY KEY,
    usuario_id      VARCHAR(15)  NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    tipo            VARCHAR(50)  NOT NULL,
    titulo          VARCHAR(200) NOT NULL,
    mensaje         TEXT         NOT NULL,
    leida           BOOLEAN      NOT NULL DEFAULT FALSE,
    creada_en       TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_notificacion_usuario_id ON notificacion(usuario_id);
CREATE INDEX IF NOT EXISTS ix_notificacion_leida     ON notificacion(leida);

COMMIT;
