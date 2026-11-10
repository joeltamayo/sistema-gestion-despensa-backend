// Limita los intentos FALLIDOS de inicio de sesión por dirección IP. (skipSuccessfulRequests: un login correcto no cuenta contra el límite.)
// Se combina con el bloqueo temporal de la cuenta (ver controlador de auth).
const { rateLimit } = require("express-rate-limit");
const env = require("../config/env");
const { HttpError } = require("../utils/httpError");

const limitadorLogin = rateLimit({
  windowMs: env.LOGIN_VENTANA_MIN * 60 * 1000,
  limit: env.LOGIN_MAX_INTENTOS,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res, next) => {
    const reinicio = req.rateLimit && req.rateLimit.resetTime ? req.rateLimit.resetTime.getTime() : Date.now();
    const segundos = Math.max(1, Math.ceil((reinicio - Date.now()) / 1000));
    res.set("Retry-After", String(segundos));
    next(
      new HttpError(
        429,
        `Demasiados intentos fallidos. Intenta de nuevo en ${Math.ceil(segundos / 60)} minuto(s).`
      )
    );
  },
});

module.exports = { limitadorLogin };
