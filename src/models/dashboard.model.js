const db = require("../config/database");
const { hoyLocal } = require("../utils/fechas");
const movimientos = require("./movimientos.model");

// Una sola consulta con conteos condicionales. Solo cuenta productos activos.
const resumenSql = db.prepare(`
  SELECT
    COUNT(*)                                                                    AS productos_activos,
    COALESCE(SUM(CASE WHEN cantidad <= stock_minimo THEN 1 ELSE 0 END), 0)       AS bajo_stock,
    COALESCE(SUM(CASE WHEN cantidad = 0 THEN 1 ELSE 0 END), 0)                   AS agotados,
    COALESCE(SUM(CASE WHEN fecha_caducidad IS NOT NULL
                       AND fecha_caducidad < @hoy THEN 1 ELSE 0 END), 0)          AS vencidos,
    COALESCE(SUM(CASE WHEN fecha_caducidad BETWEEN @hoy AND @limite THEN 1 ELSE 0 END), 0) AS por_vencer,
    COALESCE(SUM(CASE WHEN fecha_caducidad IS NULL THEN 1 ELSE 0 END), 0)        AS sin_caducidad
  FROM productos
  WHERE activo = 1`);

const conteos = db.prepare(`
  SELECT
    (SELECT COUNT(*) FROM productos WHERE activo = 0) AS productos_desactivados,
    (SELECT COUNT(*) FROM categorias)                 AS categorias,
    (SELECT COUNT(*) FROM movimientos)                AS movimientos_totales`);

function obtener({ dias, ultimos }) {
  const hoy = hoyLocal();
  const limite = hoyLocal(dias);
  return {
    parametros: { hoy, dias, limite_por_vencer: limite },
    resumen: { ...resumenSql.get({ hoy, limite }), ...conteos.get() },
    ultimos_movimientos: movimientos.ultimos(ultimos),
  };
}

module.exports = { obtener };
