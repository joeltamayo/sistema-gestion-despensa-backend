// Construye la aplicación Express (sin ponerla a escuchar; eso lo hace server.js).
// El ORDEN de los middleware:  cabeceras de seguridad -> origen/CORS -> cuerpo JSON -> sesión -> rutas -> errores
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const env = require("./config/env");
const { sesion } = require("./config/session");
const verificarOrigen = require("./middleware/origen");
const soloJson = require("./middleware/soloJson");
const { noEncontrado, manejadorErrores } = require("./middleware/errores");
const rutas = require("./routes");

const app = express();

app.disable("x-powered-by"); // no revelar que el servidor usa Express
if (env.esProduccion) app.set("trust proxy", 1); // detrás de un proxy HTTPS (cookie secure)

// 1. Cabeceras HTTP de protección.
app.use(helmet());

// 2. Solo el cliente autorizado puede llamar a la API desde un navegador.
app.use(verificarOrigen);
app.use(
  cors({
    origin: env.ORIGEN_CLIENTE, // origen exacto; con credenciales no se puede usar "*"
    credentials: true, // permite enviar la cookie de sesión
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type"],
    maxAge: 600,
  })
);

// La API devuelve datos privados: que el navegador no los guarde en caché.
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// Registro sencillo en la consola mientras se desarrolla (no guarda datos del cuerpo).
if (env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    const inicio = Date.now();
    res.on("finish", () => {
      console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - inicio} ms)`);
    });
    next();
  });
}

// 3. Cuerpo JSON (máximo 10 KB) y rechazo de otros tipos de contenido.
app.use(soloJson);
app.use(express.json({ limit: "10kb" }));

// 4. Sesión (cookie httpOnly + almacén persistente en SQLite).
app.use(sesion);

// 5. Rutas, 404 y errores.
app.use("/api", rutas);
app.use(noEncontrado);
app.use(manejadorErrores);

module.exports = app;
