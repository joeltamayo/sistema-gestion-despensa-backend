// Valida params, query y body con esquemas de zod ANTES de llegar al controlador. Los datos ya validados (y convertidos) quedan en req.datos.
//   router.post("/", validar({ body: esquemas.crear }), controlador.crear);
function validar(esquemas) {
  return (req, res, next) => {
    try {
      req.datos = {};
      for (const origen of ["params", "query", "body"]) {
        if (esquemas[origen]) req.datos[origen] = esquemas[origen].parse(req[origen] ?? {});
      }
      next();
    } catch (error) {
      next(error); // ZodError -> 400 en el middleware de errores
    }
  };
}

module.exports = validar;
