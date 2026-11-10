// Manejo centralizado de errores. TODAS las respuestas de error tienen el mismo
// formato:   { "error": "mensaje", "detalles": [ { "campo", "mensaje" } ] }
// Los detalles técnicos (trazas, mensajes de SQLite) solo se escriben en la consola del servidor; nunca se envían al cliente.
const { ZodError } = require("zod");
const { HttpError } = require("../utils/httpError");

// Rutas que no existen -> 404. Va después de todas las rutas. */
function noEncontrado(req, res, next) {
  next(new HttpError(404, "Ruta no encontrada"));
}

// eslint-disable-next-line no-unused-vars
function manejadorErrores(err, req, res, next) {
  if (res.headersSent) return next(err);

  let status = 500;
  let cuerpo = { error: "Error interno del servidor" };

  if (err instanceof HttpError) {
    status = err.status;
    cuerpo = { error: err.message };
    if (err.detalles) cuerpo.detalles = err.detalles;
  } else if (err instanceof ZodError) {
    status = 400;
    cuerpo = {
      error: "Datos inválidos",
      detalles: err.issues.map((i) => ({ campo: i.path.join(".") || "cuerpo", mensaje: i.message })),
    };
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    cuerpo = { error: "El JSON enviado está mal formado" };
  } else if (err.type === "entity.too.large") {
    status = 413;
    cuerpo = { error: "El cuerpo de la solicitud es demasiado grande" };
  } else if (typeof err.code === "string" && err.code.startsWith("SQLITE_CONSTRAINT")) {
    // Segunda barrera: las restricciones de la base de datos.
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE" || err.code === "SQLITE_CONSTRAINT_PRIMARYKEY") {
      status = 409;
      cuerpo = { error: "Ya existe un registro con ese valor" };
    } else if (err.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
      status = 409;
      cuerpo = { error: "La operación entra en conflicto con otro registro relacionado" };
    } else {
      status = 400;
      cuerpo = { error: "Los datos no cumplen las restricciones de la base de datos" };
    }
    console.error(`[${new Date().toISOString()}] Restricción de SQLite (${err.code}): ${err.message}`);
  } else {
    console.error(`[${new Date().toISOString()}] Error no controlado en ${req.method} ${req.originalUrl}:`);
    console.error(err);
  }

  res.status(status).json(cuerpo);
}

module.exports = { noEncontrado, manejadorErrores };
