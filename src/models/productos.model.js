const db = require("../config/database");
const { HttpError } = require("../utils/httpError");
const { hoyLocal, sqliteAIso } = require("../utils/fechas");
const { redondear3 } = require("../utils/cantidades");

const BASE = `
  SELECT p.*, c.nombre AS categoria
  FROM productos p
  JOIN categorias c ON c.id_categoria = p.id_categoria`;

const sql = {
  porId: db.prepare(`${BASE} WHERE p.id_producto = ?`),
  categoriaExiste: db.prepare("SELECT 1 FROM categorias WHERE id_categoria = ?"),
  insertar: db.prepare(`
    INSERT INTO productos (nombre, marca, cantidad, unidad, stock_minimo, fecha_caducidad, id_categoria)
    VALUES (@nombre, @marca, @cantidad, @unidad, @stock_minimo, @fecha_caducidad, @id_categoria)`),
  insertarMovimiento: db.prepare(`
    INSERT INTO movimientos (id_producto, id_usuario, tipo, cantidad, motivo)
    VALUES (?, ?, 'entrada', ?, 'Inventario inicial')`),
  actualizar: db.prepare(`
    UPDATE productos
    SET nombre = @nombre, marca = @marca, unidad = @unidad, stock_minimo = @stock_minimo,
        fecha_caducidad = @fecha_caducidad, id_categoria = @id_categoria,
        updated_at = CURRENT_TIMESTAMP
    WHERE id_producto = @id`),
  cambiarEstado: db.prepare(
    "UPDATE productos SET activo = ?, updated_at = CURRENT_TIMESTAMP WHERE id_producto = ?"
  ),
};

// Columnas permitidas para ordenar (lista blanca: el texto del usuario nunca se concatena en el SQL).
const ORDEN = {
  nombre: (dir) => `p.nombre COLLATE NOCASE ${dir}`,
  cantidad: (dir) => `p.cantidad ${dir}`,
  created_at: (dir) => `p.created_at ${dir}`,
  // Los productos sin fecha de caducidad siempre van al final.
  fecha_caducidad: (dir) => `(p.fecha_caducidad IS NULL) ASC, p.fecha_caducidad ${dir}`,
};

/** Fechas de referencia: hoy y el último día que cuenta como "por vencer". */
const contextoFechas = (dias) => ({ hoy: hoyLocal(), limite: hoyLocal(dias) });

function serializar(p, { hoy, limite }) {
  let estadoCaducidad = null; // null = el producto no tiene fecha de caducidad
  if (p.fecha_caducidad) {
    if (p.fecha_caducidad < hoy) estadoCaducidad = "vencido";
    else if (p.fecha_caducidad <= limite) estadoCaducidad = "por_vencer";
    else estadoCaducidad = "vigente";
  }
  return {
    id_producto: p.id_producto,
    nombre: p.nombre,
    marca: p.marca,
    id_categoria: p.id_categoria,
    categoria: p.categoria,
    cantidad: p.cantidad,
    unidad: p.unidad,
    stock_minimo: p.stock_minimo,
    bajo_stock: p.cantidad <= p.stock_minimo,
    fecha_caducidad: p.fecha_caducidad,
    estado_caducidad: estadoCaducidad,
    activo: p.activo === 1,
    created_at: sqliteAIso(p.created_at),
    updated_at: sqliteAIso(p.updated_at),
  };
}

const escaparLike = (texto) => texto.replace(/[\\%_]/g, (c) => `\\${c}`);

function obtener(id, dias = 7) {
  const fila = sql.porId.get(id);
  if (!fila) throw new HttpError(404, "Producto no encontrado");
  return serializar(fila, contextoFechas(dias));
}

function listar(filtros) {
  const ctx = contextoFechas(filtros.dias);
  const condiciones = [];
  const params = {};

  if (filtros.estado === "activos") condiciones.push("p.activo = 1");
  if (filtros.estado === "inactivos") condiciones.push("p.activo = 0");

  if (filtros.q) {
    condiciones.push("p.nombre LIKE @q ESCAPE '\\'");
    params.q = `%${escaparLike(filtros.q)}%`;
  }
  if (filtros.categoria) {
    condiciones.push("p.id_categoria = @categoria");
    params.categoria = filtros.categoria;
  }
  if (filtros.bajo_stock) condiciones.push("p.cantidad <= p.stock_minimo");

  if (filtros.caducidad === "vencidos") {
    condiciones.push("p.fecha_caducidad IS NOT NULL AND p.fecha_caducidad < @hoy");
    params.hoy = ctx.hoy;
  } else if (filtros.caducidad === "por_vencer") {
    condiciones.push("p.fecha_caducidad BETWEEN @hoy AND @limite");
    params.hoy = ctx.hoy;
    params.limite = ctx.limite;
  }

  const donde = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  const dir = filtros.dir === "desc" ? "DESC" : "ASC";
  const orden = ORDEN[filtros.orden](dir);

  const { n: total } = db.prepare(`SELECT COUNT(*) AS n FROM productos p ${donde}`).get(params);
  const filas = db
    .prepare(`${BASE} ${donde} ORDER BY ${orden}, p.id_producto ASC LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit: filtros.limit, offset: (filtros.page - 1) * filtros.limit });

  return {
    datos: filas.map((f) => serializar(f, ctx)),
    paginacion: {
      pagina: filtros.page,
      limite: filtros.limit,
      total,
      paginas: Math.max(1, Math.ceil(total / filtros.limit)),
    },
  };
}

const exigirCategoria = (idCategoria) => {
  if (!sql.categoriaExiste.get(idCategoria)) {
    throw new HttpError(400, "Datos inválidos", [
      { campo: "id_categoria", mensaje: "La categoría indicada no existe" },
    ]);
  }
};

// Crea el producto. Si trae una cantidad inicial > 0, registra también laentrada "Inventario inicial" (todo en una transacción).
const crear = db.transaction((datos, idUsuario) => {
  exigirCategoria(datos.id_categoria);
  const cantidad = redondear3(datos.cantidad);
  const id = Number(sql.insertar.run({ ...datos, cantidad }).lastInsertRowid);
  if (cantidad > 0) sql.insertarMovimiento.run(id, idUsuario, cantidad);
  return obtener(id);
});

const actualizar = db.transaction((id, datos) => {
  const actual = sql.porId.get(id);
  if (!actual) throw new HttpError(404, "Producto no encontrado");
  exigirCategoria(datos.id_categoria);

  if (datos.unidad !== actual.unidad && actual.cantidad > 0) {
    throw new HttpError(409, "No se puede cambiar la unidad mientras el producto tenga existencias", [
      { campo: "unidad", mensaje: `Hay ${actual.cantidad} ${actual.unidad} en existencia` },
    ]);
  }

  sql.actualizar.run({ ...datos, id });
  return obtener(id);
});

/** DELETE: no se borra el producto, se desactiva para conservar su historial. */
const desactivar = db.transaction((id) => {
  const actual = sql.porId.get(id);
  if (!actual) throw new HttpError(404, "Producto no encontrado");
  if (actual.activo === 0) throw new HttpError(409, "El producto ya está desactivado");
  sql.cambiarEstado.run(0, id);
  return obtener(id);
});

const reactivar = db.transaction((id) => {
  const actual = sql.porId.get(id);
  if (!actual) throw new HttpError(404, "Producto no encontrado");
  if (actual.activo === 1) throw new HttpError(409, "El producto ya está activo");
  sql.cambiarEstado.run(1, id);
  return obtener(id);
});

module.exports = { listar, obtener, crear, actualizar, desactivar, reactivar };
