// Sesiones con cookie, guardadas en SQLite para que sobrevivan a reinicios.
const session = require("express-session");
const SqliteStore = require("better-sqlite3-session-store")(session);
const db = require("./database");
const env = require("./env");

const NOMBRE_COOKIE = "despensa.sid";

const opcionesCookie = {
  httpOnly: true, // JavaScript del navegador no puede leer la cookie
  sameSite: "lax", // no se envía en solicitudes originadas desde otros sitios
  secure: env.esProduccion, // solo por HTTPS en producción
};

const sesion = session({
  name: NOMBRE_COOKIE, // evita el nombre predeterminado "connect.sid"
  secret: env.SESSION_SECRET,
  store: new SqliteStore({ client: db, expired: { clear: true, intervalMs: 15 * 60 * 1000 } }),
  resave: false,
  saveUninitialized: false, // no crea sesiones para visitantes que no inician sesión
  cookie: { ...opcionesCookie, maxAge: env.SESION_HORAS * 60 * 60 * 1000 },
});

module.exports = { sesion, NOMBRE_COOKIE, opcionesCookie };
