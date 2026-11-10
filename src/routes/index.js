// Arma la API. Todo lo que cuelga de /api exige sesión, excepto el inicio de sesión y la ruta de prueba /api/salud.
const { Router } = require("express");
const requiereSesion = require("../middleware/auth");

const router = Router();

router.get("/salud", (req, res) => res.json({ estado: "ok" }));

router.use("/auth", require("./auth.routes"));
router.use("/categorias", requiereSesion, require("./categorias.routes"));
router.use("/productos", requiereSesion, require("./productos.routes"));
router.use("/movimientos", requiereSesion, require("./movimientos.routes"));
router.use("/dashboard", requiereSesion, require("./dashboard.routes"));

module.exports = router;
