const { Router } = require("express");
const validar = require("../middleware/validar");
const esquemas = require("../schemas/movimientos");
const controlador = require("../controllers/movimientos.controller");

const router = Router();

router.get("/", validar({ query: esquemas.consulta }), controlador.listar);
router.post("/", validar({ body: esquemas.crear }), controlador.crear);

module.exports = router;
