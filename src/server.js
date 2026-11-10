// Punto de entrada: pone a escuchar la aplicación.
const env = require("./config/env");
const db = require("./config/database");
const app = require("./app");

// Por defecto solo escucha en esta computadora (127.0.0.1). Para probar desde un teléfono en la misma red, define HOST=0.0.0.0 en el archivo .env.
const HOST = process.env.HOST || "127.0.0.1";

const servidor = app.listen(env.PUERTO, HOST, () => {
  console.log("Sistema de Gestión de Despensa - API");
  console.log(`  Escuchando en:   http://localhost:${env.PUERTO}`);
  console.log(`  Cliente permitido: ${env.ORIGEN_CLIENTE}`);
  console.log(`  Entorno:         ${env.NODE_ENV}`);
  console.log(`  Base de datos:   ${env.RUTA_BD}`);
});

servidor.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`El puerto ${env.PUERTO} ya está en uso. Cierra el otro proceso o cambia PUERTO en .env.`);
  } else {
    console.error(error);
  }
  process.exit(1);
});

// Cierre ordenado con Ctrl + C.
function cerrar() {
  console.log("\nCerrando el servidor...");
  servidor.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 3000).unref();
}
process.on("SIGINT", cerrar);
process.on("SIGTERM", cerrar);
