const { Router } = require("express");
const validar = require("../middleware/validar");
const esquemas = require("../schemas/categorias");
const controlador = require("../controllers/categorias.controller");

const router = Router();

router.get("/", controlador.listar);
router.get("/:id", validar({ params: esquemas.params }), controlador.obtener);
router.post("/", validar({ body: esquemas.crear }), controlador.crear);
router.put("/:id", validar({ params: esquemas.params, body: esquemas.actualizar }), controlador.actualizar);
router.delete("/:id", validar({ params: esquemas.params }), controlador.eliminar);

module.exports = router;
