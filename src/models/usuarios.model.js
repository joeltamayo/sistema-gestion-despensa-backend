// Acceso a datos de usuarios. Todas las consultas usan parámetros (?), nunca se concatena texto del usuario dentro del SQL.
const db = require("../config/database");
const env = require("../config/env");
const { ahoraMasMinutos } = require("../utils/fechas");

const sql = {
  porCorreo: db.prepare("SELECT * FROM usuarios WHERE correo = ?"),
  porId: db.prepare("SELECT id_usuario, correo, created_at FROM usuarios WHERE id_usuario = ?"),
  contar: db.prepare("SELECT COUNT(*) AS n FROM usuarios"),
  crear: db.prepare("INSERT INTO usuarios (correo, password_hash) VALUES (?, ?)"),
  cambiarPassword: db.prepare(
    "UPDATE usuarios SET password_hash = ?, intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id_usuario = ?"
  ),
  reiniciarIntentos: db.prepare(
    "UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id_usuario = ?"
  ),
  sumarFallo: db.prepare("UPDATE usuarios SET intentos_fallidos = intentos_fallidos + 1 WHERE id_usuario = ?"),
  intentos: db.prepare("SELECT intentos_fallidos FROM usuarios WHERE id_usuario = ?"),
  bloquear: db.prepare("UPDATE usuarios SET bloqueado_hasta = ?, intentos_fallidos = 0 WHERE id_usuario = ?"),
};

const buscarPorCorreo = (correo) => sql.porCorreo.get(correo.toLowerCase());
const buscarPorId = (id) => sql.porId.get(id);
const contar = () => sql.contar.get().n;
const crear = (correo, passwordHash) => Number(sql.crear.run(correo.toLowerCase(), passwordHash).lastInsertRowid);
const cambiarPassword = (id, passwordHash) => sql.cambiarPassword.run(passwordHash, id);
const reiniciarIntentos = (id) => sql.reiniciarIntentos.run(id);

// Suma un intento fallido. Al llegar a BLOQUEO_INTENTOS bloquea la cuenta BLOQUEO_MIN minutos (aunque el atacante cambie de dirección IP).
const registrarFallo = db.transaction((id) => {
  sql.sumarFallo.run(id);
  const { intentos_fallidos: intentos } = sql.intentos.get(id);
  if (intentos >= env.BLOQUEO_INTENTOS) {
    sql.bloquear.run(ahoraMasMinutos(env.BLOQUEO_MIN), id);
    return { bloqueado: true, restantes: 0 };
  }
  return { bloqueado: false, restantes: env.BLOQUEO_INTENTOS - intentos };
});

module.exports = {
  buscarPorCorreo,
  buscarPorId,
  contar,
  crear,
  cambiarPassword,
  reiniciarIntentos,
  registrarFallo,
};
