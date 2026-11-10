const { z } = require("zod");
require("./_mapaErrores");

const login = z
  .object({
    correo: z.string().trim().toLowerCase().email().max(120),
    password: z.string().min(1).max(128),
  })
  .strict();

module.exports = { login };
