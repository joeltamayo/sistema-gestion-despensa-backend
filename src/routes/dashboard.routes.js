const { Router } = require("express");
const validar = require("../middleware/validar");
const esquemas = require("../schemas/dashboard");
const controlador = require("../controllers/dashboard.controller");

const router = Router();

router.get("/", validar({ query: esquemas.consulta }), controlador.obtener);

module.exports = router;
