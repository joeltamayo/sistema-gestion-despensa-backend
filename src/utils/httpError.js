// Error "esperado" de la aplicación: lleva el código HTTP que se debe responder.
// El middleware de errores lo convierte en { error, detalles }.
class HttpError extends Error {
  constructor(status, mensaje, detalles) {
    super(mensaje);
    this.name = "HttpError";
    this.status = status;
    this.detalles = detalles;
  }
}

// Atajo para indicar qué campo falló: [{ campo, mensaje }]
const detalleCampo = (campo, mensaje) => [{ campo, mensaje }];

module.exports = { HttpError, detalleCampo };
