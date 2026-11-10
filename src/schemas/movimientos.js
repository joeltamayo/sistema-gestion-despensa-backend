const { z } = require("zod");
const { textoOpcional, fechaISO, paginacion, dir } = require("./comunes");
const { MAX_CANTIDAD } = require("../utils/cantidades");

// POST /api/movimientos
// Los decimales permitidos dependen de la unidad del producto, así que esa
// parte se revisa en el modelo, dentro de la transacción.
const crear = z
  .object({
    id_producto: z.number().int().positive(),
    tipo: z.enum(["entrada", "salida"]),
    cantidad: z.number().positive().max(MAX_CANTIDAD),
    motivo: textoOpcional(150),
  })
  .strict();

// GET /api/movimientos
const consulta = z
  .object({
    producto: z.coerce.number().int().positive().optional(),
    tipo: z.enum(["entrada", "salida"]).optional(),
    desde: fechaISO.optional(),
    hasta: fechaISO.optional(),
    orden: z.enum(["fecha", "cantidad"]).default("fecha"),
    dir: dir.default("desc"),
    ...paginacion,
  })
  .strict()
  .superRefine((d, ctx) => {
    if (d.desde && d.hasta && d.desde > d.hasta) {
      ctx.addIssue({ code: "custom", path: ["hasta"], message: "La fecha final no puede ser anterior a la inicial" });
    }
  });

module.exports = { crear, consulta };
