const db = require("../config/database");
const { HttpError } = require("../utils/httpError");
const { sqliteAIso, inicioDiaLocalEnUtc } = require("../utils/fechas");
const { redondear3, validarCantidad } = require("../utils/cantidades");

const BASE = `
  SELECT m.*, p.nombre AS producto, p.unidad, u.correo AS usuario
  FROM movimientos m
  JOIN productos p ON p.id_producto = m.id_producto
  JOIN usuarios  u ON u.id_usuario  = m.id_usuario`;

const sql = {
  porId: db.prepare(`${BASE} WHERE m.id_movimiento = ?`),
  producto: db.prepare("SELECT id_producto, nombre, cantidad, unidad, activo FROM productos WHERE id_producto = ?"),
  actualizarExistencias: db.prepare(
    "UPDATE productos SET cantidad = ?, updated_at = CURRENT_TIMESTAMP WHERE id_producto = ?"
  ),
  insertar: db.prepare(`
    INSERT INTO movimientos (id_producto, id_usuario, tipo, cantidad, motivo)
    VALUES (@id_producto, @id_usuario, @tipo, @cantidad, @motivo)`),
  ultimos: db.prepare(`${BASE} ORDER BY m.fecha DESC, m.id_movimiento DESC LIMIT ?`),
};

const serializar = (m) => ({
  id_movimiento: m.id_movimiento,
  id_producto: m.id_producto,
  producto: m.producto,
  unidad: m.unidad,
  tipo: m.tipo,
  cantidad: m.cantidad,
  motivo: m.motivo,
  usuario: m.usuario,
  fecha: sqliteAIso(m.fecha),
});

/**
 * Registra una entrada o salida. Existencias e historial se modifican en UNA
 * transacción: si algo falla (por ejemplo, existencias insuficientes), no se
 * guarda ninguno de los dos cambios.
 */
const registrar = db.transaction((datos, idUsuario) => {
  const producto = sql.producto.get(datos.id_producto);
  if (!producto) throw new HttpError(404, "Producto no encontrado");
  if (producto.activo === 0) {
    throw new HttpError(409, "El producto está desactivado. Reactívalo antes de registrar movimientos.");
  }

  const errorCantidad = validarCantidad(datos.cantidad, producto.unidad);
  if (errorCantidad) {
    throw new HttpError(400, "Datos inválidos", [{ campo: "cantidad", mensaje: errorCantidad }]);
  }

  const cantidad = redondear3(datos.cantidad);
  const nuevas = redondear3(producto.cantidad + (datos.tipo === "entrada" ? cantidad : -cantidad));
  if (nuevas < 0) {
    throw new HttpError(
      409,
      `Existencias insuficientes: hay ${producto.cantidad} ${producto.unidad} de "${producto.nombre}" y se intentan sacar ${cantidad} ${producto.unidad}`
    );
  }

  sql.actualizarExistencias.run(nuevas, producto.id_producto);
  const { lastInsertRowid } = sql.insertar.run({
    id_producto: producto.id_producto,
    id_usuario: idUsuario,
    tipo: datos.tipo,
    cantidad,
    motivo: datos.motivo,
  });

  return {
    movimiento: serializar(sql.porId.get(Number(lastInsertRowid))),
    existencias_actuales: { cantidad: nuevas, unidad: producto.unidad },
  };
});

function listar(filtros) {
  const condiciones = [];
  const params = {};

  if (filtros.producto) {
    condiciones.push("m.id_producto = @producto");
    params.producto = filtros.producto;
  }
  if (filtros.tipo) {
    condiciones.push("m.tipo = @tipo");
    params.tipo = filtros.tipo;
  }
  // Los días se interpretan en hora local; "hasta" incluye todo ese día.
  if (filtros.desde) {
    condiciones.push("m.fecha >= @desde");
    params.desde = inicioDiaLocalEnUtc(filtros.desde);
  }
  if (filtros.hasta) {
    condiciones.push("m.fecha < @hasta");
    params.hasta = inicioDiaLocalEnUtc(filtros.hasta, 1);
  }

  const donde = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  const dir = filtros.dir === "asc" ? "ASC" : "DESC";
  const orden = filtros.orden === "cantidad" ? `m.cantidad ${dir}, m.fecha DESC` : `m.fecha ${dir}`;

  const { n: total } = db.prepare(`SELECT COUNT(*) AS n FROM movimientos m ${donde}`).get(params);
  const filas = db
    .prepare(`${BASE} ${donde} ORDER BY ${orden}, m.id_movimiento ${dir} LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit: filtros.limit, offset: (filtros.page - 1) * filtros.limit });

  return {
    datos: filas.map(serializar),
    paginacion: {
      pagina: filtros.page,
      limite: filtros.limit,
      total,
      paginas: Math.max(1, Math.ceil(total / filtros.limit)),
    },
  };
}

const ultimos = (n) => sql.ultimos.all(n).map(serializar);

module.exports = { registrar, listar, ultimos };
