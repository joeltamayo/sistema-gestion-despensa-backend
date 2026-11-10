const { Router } = require("express");
const validar = require("../middleware/validar");
const requiereSesion = require("../middleware/auth");
const { limitadorLogin } = require("../middleware/limites");
const asyncHandler = require("../utils/asyncHandler");
const esquemas = require("../schemas/auth");
const controlador = require("../controllers/auth.controller");

const router = Router();

// El único endpoint público de la API (junto con /api/salud).
router.post("/login", limitadorLogin, validar({ body: esquemas.login }), asyncHandler(controlador.login));
router.get("/me", requiereSesion, controlador.yo);
router.post("/logout", asyncHandler(controlador.logout));

module.exports = router;
