-- Esquema de la base de datos del Sistema de Gestión de Despensa (SQLite)
-- Se aplica automáticamente al iniciar el servidor (CREATE ... IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario        INTEGER PRIMARY KEY AUTOINCREMENT,
  correo            TEXT    NOT NULL UNIQUE,
  password_hash     TEXT    NOT NULL,
  intentos_fallidos INTEGER NOT NULL DEFAULT 0 CHECK (intentos_fallidos >= 0),
  bloqueado_hasta   TEXT,
  created_at        TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categorias (
  id_categoria INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre       TEXT NOT NULL UNIQUE COLLATE NOCASE,
  descripcion  TEXT,
  created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS productos (
  id_producto     INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre          TEXT    NOT NULL,
  marca           TEXT,
  cantidad        REAL    NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
  unidad          TEXT    NOT NULL CHECK (unidad IN ('kg', 'g', 'l', 'ml', 'pza')),
  stock_minimo    REAL    NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
  fecha_caducidad TEXT    CHECK (
                    fecha_caducidad IS NULL
                    OR fecha_caducidad GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
                  ),
  id_categoria    INTEGER NOT NULL
                    REFERENCES categorias (id_categoria) ON DELETE RESTRICT,
  activo          INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
  created_at      TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movimientos (
  id_movimiento INTEGER PRIMARY KEY AUTOINCREMENT,
  id_producto   INTEGER NOT NULL
                  REFERENCES productos (id_producto) ON DELETE RESTRICT,
  id_usuario    INTEGER NOT NULL
                  REFERENCES usuarios (id_usuario) ON DELETE RESTRICT,
  tipo          TEXT    NOT NULL CHECK (tipo IN ('entrada', 'salida')),
  cantidad      REAL    NOT NULL CHECK (cantidad > 0),
  motivo        TEXT    CHECK (motivo IS NULL OR length(motivo) <= 150),
  fecha         TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos (id_categoria);
CREATE INDEX IF NOT EXISTS idx_productos_nombre    ON productos (nombre);
CREATE INDEX IF NOT EXISTS idx_productos_caducidad ON productos (fecha_caducidad);
CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON movimientos (id_producto);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha    ON movimientos (fecha);