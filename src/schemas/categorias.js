const { z } = require("zod");
const { paramsId, texto, textoOpcional } = require("./comunes");

const cuerpo = z
  .object({
    nombre: texto(60),
    descripcion: textoOpcional(200),
  })
  .strict();

module.exports = { params: paramsId, crear: cuerpo, actualizar: cuerpo };
