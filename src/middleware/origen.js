// Si la solicitud viene de un navegador (trae la cabecera Origin) y ese origen no es el cliente autorizado, se rechaza con 403.
const env = require("../config/env");
const { HttpError } = require("../utils/httpError");

module.exports = function verificarOrigen(req, res, next) {
  const origen = req.headers.origin;
  if (origen && origen !== env.ORIGEN_CLIENTE) {
    return next(new HttpError(403, "Origen no permitido"));
  }
  next();
};
