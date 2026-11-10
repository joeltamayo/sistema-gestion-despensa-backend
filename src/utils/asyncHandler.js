// Express 4 no captura los errores de funciones async por sí solo. Este envoltorio los manda al middleware de errores.
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
