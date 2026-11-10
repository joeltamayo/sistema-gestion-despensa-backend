// Contraseñas: hash con bcrypt (bcryptjs, implementación en JavaScript que no necesita compilar nada en Windows). Cada hash incluye su propia sal aleatoria.
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const COSTO = 12;

// Hash de relleno: cuando el correo no existe, se compara igual contra este hash para que la respuesta tarde lo mismo y no se pueda averiguar qué correos existen.
const HASH_FALSO = bcrypt.hashSync(crypto.randomBytes(16).toString("hex"), COSTO);

const generarHash = (password) => bcrypt.hash(password, COSTO);
const compararPassword = (password, hash) => bcrypt.compare(password, hash || HASH_FALSO);

/** Política mínima para crear contraseñas. Devuelve un mensaje o null. */
function politicaPassword(password) {
  if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
  // bcrypt solo usa los primeros 72 bytes; más allá se ignorarían en silencio.
  if (Buffer.byteLength(password, "utf8") > 72) return "La contraseña no puede superar 72 bytes.";
  return null;
}

module.exports = { generarHash, compararPassword, politicaPassword };
