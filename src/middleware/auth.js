// Protección de rutas: exige una sesión válida. Sin ella responde 401 y la solicitud nunca llega al controlador.
const usuarios = require("../models/usuarios.model");
const { HttpError } = require("../utils/httpError");

module.exports = function requiereSesion(req, res, next) {
  const idUsuario = req.session && req.session.idUsuario;
  if (!idUsuario) return next(new HttpError(401, "Debes iniciar sesión"));

  const usuario = usuarios.buscarPorId(idUsuario);
  if (!usuario) {
    // La sesión apunta a un usuario que ya no existe.
    return req.session.destroy(() => next(new HttpError(401, "Sesión no válida")));
  }

  req.usuario = { id_usuario: usuario.id_usuario, correo: usuario.correo };
  next();
};
