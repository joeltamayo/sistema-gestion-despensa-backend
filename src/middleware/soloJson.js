// Protección adicional contra CSRF: las solicitudes que envían datos para modificar algo deben usar Content-Type: application/json. Un formulario HTML
// de otro sitio no puede enviar ese tipo de contenido sin una verificación previa (preflight) que CORS rechaza.
const { HttpError } = require("../utils/httpError");

const METODOS_CON_CUERPO = new Set(["POST", "PUT", "PATCH"]);

module.exports = function soloJson(req, res, next) {
  if (METODOS_CON_CUERPO.has(req.method)) {
    const tieneCuerpo =
      req.headers["transfer-encoding"] !== undefined || Number(req.headers["content-length"] || 0) > 0;
    if (tieneCuerpo && !req.is("application/json")) {
      return next(new HttpError(415, "El cuerpo debe enviarse como JSON (Content-Type: application/json)"));
    }
  }
  next();
};
