// Lee y valida las variables de entorno (.env). Si algo esencial falta, el servidor no arranca y explica qué corregir.
const path = require("path");

const RAIZ = path.resolve(__dirname, "../..");
require("dotenv").config({ path: path.join(RAIZ, ".env"), quiet: true });

function entero(nombre, porDefecto, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const crudo = process.env[nombre];
  if (crudo === undefined || crudo === "") return porDefecto;
  const valor = Number(crudo);
  if (!Number.isInteger(valor) || valor < min || valor > max) {
    throw new Error(`La variable ${nombre} debe ser un entero entre ${min} y ${max} (valor actual: "${crudo}").`);
  }
  return valor;
}

const NODE_ENV = process.env.NODE_ENV || "development";
const esProduccion = NODE_ENV === "production";

const SESSION_SECRET = process.env.SESSION_SECRET || "";
if (SESSION_SECRET.length < 32) {
  throw new Error(
    "Falta SESSION_SECRET en el archivo .env o es demasiado corta (mínimo 32 caracteres).\n" +
      "Genera una con:\n" +
      "  node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
  );
}

// El origen se compara texto contra texto, así que se quita el "/" final.
const ORIGEN_CLIENTE = (process.env.ORIGEN_CLIENTE || "http://localhost:5500").replace(/\/+$/, "");

const rutaBdCruda = process.env.RUTA_BD || "database/despensa.db";
const RUTA_BD = rutaBdCruda === ":memory:" ? rutaBdCruda : path.resolve(RAIZ, rutaBdCruda);

module.exports = {
  RAIZ,
  NODE_ENV,
  esProduccion,
  PUERTO: entero("PUERTO", 3000, { min: 1, max: 65535 }),
  ORIGEN_CLIENTE,
  SESSION_SECRET,
  RUTA_BD,
  SESION_HORAS: entero("SESION_HORAS", 2, { min: 1, max: 168 }),
  LOGIN_MAX_INTENTOS: entero("LOGIN_MAX_INTENTOS", 5),
  LOGIN_VENTANA_MIN: entero("LOGIN_VENTANA_MIN", 15),
  BLOQUEO_INTENTOS: entero("BLOQUEO_INTENTOS", 5),
  BLOQUEO_MIN: entero("BLOQUEO_MIN", 15),
};
