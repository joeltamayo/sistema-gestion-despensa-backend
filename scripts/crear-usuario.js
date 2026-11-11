// Crea la cuenta de acceso (o restablece su contraseña) desde la terminal.
//
//   npm run crear-usuario
//
// No existe registro abierto en la API: la cuenta solo se crea aquí, en la computadora donde corre el servidor.
const readline = require("readline"); // Permite leer la entrada de la terminal (stdin) y escribir en la salida (stdout).
const { z } = require("zod"); // Validación de datos y generación de errores amigables. Ver Backend/src/schemas/_mapaErrores.js
require("../src/schemas/_mapaErrores"); // Carga el mapa de errores para que zod genere mensajes en español.

// Modelos y utilidades del servidor.
const usuarios = require("../src/models/usuarios.model");
const db = require("../src/config/database");
const env = require("../src/config/env");
const { generarHash, politicaPassword } = require("../src/utils/passwords");

// Lector de líneas único. Permite ocultar lo que se escribe (contraseñas) y
function crearLector() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: process.stdin.isTTY === true,
  });
  const pendientes = [];
  const esperando = [];
  let cerrado = false;
  let oculto = false;

  rl.on("line", (linea) => (esperando.length ? esperando.shift()(linea) : pendientes.push(linea)));
  rl.on("close", () => {
    cerrado = true;
    while (esperando.length) esperando.shift()(null);
  });

  if (rl.terminal && typeof rl._writeToOutput === "function") {
    const escribir = rl._writeToOutput.bind(rl);
    rl._writeToOutput = (texto) => {
      if (!oculto) escribir(texto);
    };
  }

  return {
    preguntar(texto, { secreto = false } = {}) {
      return new Promise((resolver) => {
        rl.setPrompt(texto);
        rl.prompt();
        oculto = secreto;
        const terminar = (linea) => {
          oculto = false;
          if (secreto && rl.terminal) process.stdout.write("\n");
          resolver(linea === null ? null : linea.trim() === "" && !secreto ? "" : linea);
        };
        if (pendientes.length) terminar(pendientes.shift());
        else if (cerrado) terminar(null);
        else esperando.push(terminar);
      });
    },
    cerrar: () => rl.close(),
  };
}

// Función principal: crea o actualiza un usuario.
async function principal() {
  const lector = crearLector();
  const salir = (mensaje, codigo = 1) => {
    console.error(mensaje);
    lector.cerrar();
    db.close();
    process.exit(codigo);
  };

  console.log("=== Sistema de Gestión de Despensa: crear usuario ===");
  console.log(`Base de datos: ${env.RUTA_BD}\n`);

  const correoCrudo = await lector.preguntar("Correo electrónico: ");
  if (correoCrudo === null) salir("\nEntrada cancelada.");
  const correo = z.string().trim().toLowerCase().email().max(120).safeParse(correoCrudo);
  if (!correo.success) salir("Correo no válido.");

  const existente = usuarios.buscarPorCorreo(correo.data);
  if (existente) {
    const resp = await lector.preguntar(
      "Ese correo ya existe. ¿Restablecer su contraseña (y quitar cualquier bloqueo)? (s/N): "
    );
    if (!resp || !/^s/i.test(resp.trim())) salir("No se hizo ningún cambio.", 0);
  }

  const password = await lector.preguntar("Contraseña (mínimo 8 caracteres): ", { secreto: true });
  if (password === null) salir("\nEntrada cancelada.");
  const problema = politicaPassword(password);
  if (problema) salir(problema);

  const repetida = await lector.preguntar("Repite la contraseña: ", { secreto: true });
  if (repetida !== password) salir("Las contraseñas no coinciden. No se hizo ningún cambio.");

  const hash = await generarHash(password);
  if (existente) {
    usuarios.cambiarPassword(existente.id_usuario, hash);
    console.log(`\nContraseña actualizada para ${correo.data}.`);
  } else {
    usuarios.crear(correo.data, hash);
    console.log(`\nUsuario creado: ${correo.data}`);
  }

  lector.cerrar();
  db.close();
}

principal().catch((error) => {
  console.error("No se pudo crear el usuario:", error.message);
  process.exit(1);
});
