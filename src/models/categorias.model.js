const db = require("../config/database");
const { HttpError } = require("../utils/httpError");
const { sqliteAIso } = require("../utils/fechas");

const sql = {
  listar: db.prepare(`
    SELECT c.*, (SELECT COUNT(*) FROM productos p WHERE p.id_categoria = c.id_categoria) AS total_productos
    FROM categorias c
    ORDER BY c.nombre COLLATE NOCASE`),
  porId: db.prepare(`
    SELECT c.*, (SELECT COUNT(*) FROM productos p WHERE p.id_categoria = c.id_categoria) AS total_productos
    FROM categorias c
    WHERE c.id_categoria = ?`),
  crear: db.prepare("INSERT INTO categorias (nombre, descripcion) VALUES (@nombre, @descripcion)"),
  actualizar: db.prepare(`
    UPDATE categorias
    SET nombre = @nombre, descripcion = @descripcion, updated_at = CURRENT_TIMESTAMP
    WHERE id_categoria = @id`),
  eliminar: db.prepare("DELETE FROM categorias WHERE id_categoria = ?"),
  contarProductos: db.prepare("SELECT COUNT(*) AS n FROM productos WHERE id_categoria = ?"),
};

const serializar = (c) => ({
  id_categoria: c.id_categoria,
  nombre: c.nombre,
  descripcion: c.descripcion,
  total_productos: c.total_productos,
  created_at: sqliteAIso(c.created_at),
  updated_at: sqliteAIso(c.updated_at),
});

const esDuplicado = (error) => error.code === "SQLITE_CONSTRAINT_UNIQUE";
const duplicada = () =>
  new HttpError(409, "Ya existe una categoría con ese nombre", [
    { campo: "nombre", mensaje: "Ya existe una categoría con ese nombre" },
  ]);

function listar() {
  return sql.listar.all().map(serializar);
}

function obtener(id) {
  const fila = sql.porId.get(id);
  if (!fila) throw new HttpError(404, "Categoría no encontrada");
  return serializar(fila);
}

function crear(datos) {
  try {
    const { lastInsertRowid } = sql.crear.run(datos);
    return obtener(Number(lastInsertRowid));
  } catch (error) {
    if (esDuplicado(error)) throw duplicada();
    throw error;
  }
}

function actualizar(id, datos) {
  obtener(id); // 404 si no existe
  try {
    sql.actualizar.run({ ...datos, id });
  } catch (error) {
    if (esDuplicado(error)) throw duplicada();
    throw error;
  }
  return obtener(id);
}

/** Elimina la categoría solo si no tiene productos (activos o desactivados). */
const eliminar = db.transaction((id) => {
  obtener(id); // 404 si no existe
  const { n } = sql.contarProductos.get(id);
  if (n > 0) {
    throw new HttpError(
      409,
      `No se puede eliminar: la categoría tiene ${n} producto(s) asociado(s). Mueve o elimina esos productos primero.`
    );
  }
  sql.eliminar.run(id);
});

module.exports = { listar, obtener, crear, actualizar, eliminar };
