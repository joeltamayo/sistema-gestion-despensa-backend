const { Router } = require("express");
const validar = require("../middleware/validar");
const esquemas = require("../schemas/productos");
const controlador = require("../controllers/productos.controller");

const router = Router();

router.get("/", validar({ query: esquemas.consulta }), controlador.listar);
router.get("/:id", validar({ params: esquemas.params }), controlador.obtener);
router.post("/", validar({ body: esquemas.crear }), controlador.crear);
router.put("/:id", validar({ params: esquemas.params, body: esquemas.actualizar }), controlador.actualizar);
router.delete("/:id", validar({ params: esquemas.params }), controlador.desactivar);
router.patch("/:id/reactivar", validar({ params: esquemas.params }), controlador.reactivar);

module.exports = router;
