// Piezas de validación reutilizables por todos los esquemas.
const { z } = require("zod");
require("./_mapaErrores");
const { esFechaValida } = require("../utils/fechas");

// Parámetro de ruta  /api/algo/:id
const paramsId = z.object({ id: z.coerce.number().int().positive() });

// Texto obligatorio con límite de longitud (se recortan espacios al inicio y al final).
const texto = (max) => z.string().trim().min(1).max(max);

// Texto opcional: si falta, es null o viene vacío, se guarda null.
const textoOpcional = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => v || null);

// Fecha AAAA-MM-DD real (rechaza 2026-02-31).
const fechaISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Usa el formato AAAA-MM-DD")
  .refine(esFechaValida, "La fecha no es válida");

// Paginación: page desde 1; limit solo 5, 10, 15 o 25.
const LIMITES = [5, 10, 15, 25];
const paginacion = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .refine((v) => LIMITES.includes(v), "El límite debe ser 5, 10, 15 o 25")
    .default(10),
};

const dir = z.enum(["asc", "desc"]);

module.exports = { paramsId, texto, textoOpcional, fechaISO, paginacion, dir, LIMITES };
