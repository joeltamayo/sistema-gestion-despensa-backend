const env = require("../config/env");
const { NOMBRE_COOKIE, opcionesCookie } = require("../config/session");
const usuarios = require("../models/usuarios.model");
const { compararPassword } = require("../utils/passwords");
const { sqliteADate } = require("../utils/fechas");
const { HttpError } = require("../utils/httpError");

// Versiones con promesas de los métodos de express-session (que usan callbacks).
const regenerar = (req) => new Promise((ok, fallo) => req.session.regenerate((e) => (e ? fallo(e) : ok())));
const guardar = (req) => new Promise((ok, fallo) => req.session.save((e) => (e ? fallo(e) : ok())));
const destruir = (req) => new Promise((ok) => req.session.destroy(() => ok()));

// POST /api/auth/login
async function login(req, res) {
  const { correo, password } = req.datos.body;
  const usuario = usuarios.buscarPorCorreo(correo);

  // ¿Cuenta bloqueada por demasiados intentos fallidos?
  if (usuario && usuario.bloqueado_hasta) {
    const hasta = sqliteADate(usuario.bloqueado_hasta);
    if (hasta > new Date()) {
      const minutos = Math.ceil((hasta.getTime() - Date.now()) / 60000);
      throw new HttpError(
        429,
        `Cuenta bloqueada temporalmente por demasiados intentos fallidos. Intenta de nuevo en ${minutos} minuto(s).`
      );
    }
    usuarios.reiniciarIntentos(usuario.id_usuario); // el bloqueo ya venció
  }

  // Se compara SIEMPRE (con un hash de relleno si el correo no existe) para que la respuesta tarde lo mismo y el mensaje sea idéntico en ambos casos.
  const correcta = await compararPassword(password, usuario && usuario.password_hash);

  if (!usuario || !correcta) {
    if (usuario) {
      const resultado = usuarios.registrarFallo(usuario.id_usuario);
      if (resultado.bloqueado) {
        throw new HttpError(
          429,
          `Demasiados intentos fallidos. La cuenta quedó bloqueada ${env.BLOQUEO_MIN} minutos.`
        );
      }
    }
    throw new HttpError(401, "Credenciales incorrectas");
  }

  usuarios.reiniciarIntentos(usuario.id_usuario);

  // Se crea una sesión nueva al iniciar sesión (evita la fijación de sesión).
  await regenerar(req);
  req.session.idUsuario = usuario.id_usuario;
  await guardar(req);

  res.json({
    mensaje: "Sesión iniciada correctamente",
    usuario: { id_usuario: usuario.id_usuario, correo: usuario.correo },
  });
}

// GET /api/auth/me  (protegida por el middleware de sesión)
function yo(req, res) {
  res.json({ usuario: req.usuario });
}

// POST /api/auth/logout  (si la sesión ya no existe, también responde 200)
async function logout(req, res) {
  await destruir(req);
  res.clearCookie(NOMBRE_COOKIE, opcionesCookie);
  res.json({ mensaje: "Sesión cerrada correctamente" });
}

module.exports = { login, yo, logout };
