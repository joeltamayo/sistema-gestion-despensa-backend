const { z } = require("zod");
require("./_mapaErrores");

// GET /api/dashboard?dias=7&ultimos=5
const consulta = z
  .object({
    dias: z.coerce.number().int().min(1).max(365).default(7), // umbral de "por vencer"
    ultimos: z.coerce.number().int().min(1).max(20).default(5), // movimientos recientes a mostrar
  })
  .strict();

module.exports = { consulta };
