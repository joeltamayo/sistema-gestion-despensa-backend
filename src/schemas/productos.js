const { z } = require("zod");
const { paramsId, texto, textoOpcional, fechaISO, paginacion, dir } = require("./comunes");
const { UNIDADES, MAX_CANTIDAD, validarCantidad } = require("../utils/cantidades");

const numeroNoNegativo = z.number().min(0).max(MAX_CANTIDAD);

// Campos que el usuario puede editar. La cantidad NO está aquí: las existencias solo cambian mediante movimientos (entradas y salidas).
const camposEditables = {
  nombre: texto(100),
  marca: textoOpcional(60),
  id_categoria: z.number().int().positive(),
  unidad: z.enum(UNIDADES),
  stock_minimo: numeroNoNegativo.default(0),
  fecha_caducidad: fechaISO.nullish().transform((v) => v ?? null),
};

// Revisa que las cantidades respeten los decimales permitidos por la unidad.
const porUnidad = (campos) => (datos, ctx) => {
  for (const campo of campos) {
    const mensaje = validarCantidad(datos[campo], datos.unidad);
    if (mensaje) ctx.addIssue({ code: "custom", path: [campo], message: mensaje });
  }
};

// POST: permite una cantidad inicial (si es > 0 se registra como entrada "Inventario inicial" para que el historial quede completo).
const crear = z
  .object({ ...camposEditables, cantidad: numeroNoNegativo.default(0) })
  .strict()
  .superRefine(porUnidad(["cantidad", "stock_minimo"]));

// PUT: reemplaza los datos editables. Enviar "cantidad" aquí se rechaza.
const actualizar = z.object(camposEditables).strict().superRefine(porUnidad(["stock_minimo"]));

// GET /api/productos
const consulta = z
  .object({
    q: z.string().trim().max(100).optional(),
    categoria: z.coerce.number().int().positive().optional(),
    bajo_stock: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => v === "true"),
    estado: z.enum(["activos", "inactivos", "todos"]).default("activos"),
    caducidad: z.enum(["vencidos", "por_vencer"]).optional(),
    dias: z.coerce.number().int().min(1).max(365).default(7),
    orden: z.enum(["nombre", "cantidad", "fecha_caducidad", "created_at"]).default("nombre"),
    dir: dir.default("asc"),
    ...paginacion,
  })
  .strict();

module.exports = { params: paramsId, crear, actualizar, consulta };
