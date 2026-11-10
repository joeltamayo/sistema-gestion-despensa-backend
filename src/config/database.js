// Conexión única a SQLite (better-sqlite3).
const fs = require("fs"); // para crear la carpeta si no existe
const path = require("path"); // para crear la carpeta si no existe
const Database = require("better-sqlite3"); // para conectarse a SQLite de manera sincrónica y con transacciones
const env = require("./env"); // para saber dónde está la base de datos

// Crea la carpeta de la base de datos si no existe.
if (env.RUTA_BD !== ":memory:") {
  fs.mkdirSync(path.dirname(env.RUTA_BD), { recursive: true });
}

// Conexión a la base de datos SQLite.
const db = new Database(env.RUTA_BD);

// SQLite NO aplica las claves foráneas a menos que se activen en cada conexión.
db.pragma("foreign_keys = ON");
// WAL: mejor rendimiento y lecturas sin bloquear escrituras.
db.pragma("journal_mode = WAL");

// Crea las tablas si todavía no existen.
db.exec(fs.readFileSync(path.join(env.RAIZ, "database", "schema.sql"), "utf8"));

module.exports = db; // Exporta la conexión a la base de datos para que pueda ser usada en otros módulos.
