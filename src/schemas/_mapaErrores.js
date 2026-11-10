// Mensajes de validación de zod en español (se aplican a todos los esquemas).
const { z } = require("zod");

const TIPOS = {
  string: "texto",
  number: "número",
  integer: "número entero",
  float: "número",
  nan: "número",
  boolean: "verdadero o falso",
  object: "objeto",
  array: "lista",
};

z.setErrorMap((issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === "undefined") return { message: "Es obligatorio" };
      if (issue.received === "null") return { message: "No puede ser nulo" };
      return { message: `Debe ser de tipo ${TIPOS[issue.expected] || issue.expected}` };

    case z.ZodIssueCode.too_small:
      if (issue.type === "string") {
        return { message: issue.minimum === 1 ? "No puede estar vacío" : `Debe tener al menos ${issue.minimum} caracteres` };
      }
      if (issue.type === "number") {
        return { message: issue.inclusive ? `Debe ser mayor o igual a ${issue.minimum}` : `Debe ser mayor que ${issue.minimum}` };
      }
      return { message: `Debe tener al menos ${issue.minimum} elementos` };

    case z.ZodIssueCode.too_big:
      if (issue.type === "string") return { message: `Debe tener como máximo ${issue.maximum} caracteres` };
      if (issue.type === "number") {
        return { message: issue.inclusive ? `Debe ser menor o igual a ${issue.maximum}` : `Debe ser menor que ${issue.maximum}` };
      }
      return { message: `Debe tener como máximo ${issue.maximum} elementos` };

    case z.ZodIssueCode.invalid_enum_value:
      return { message: `Valor no permitido. Opciones: ${issue.options.join(", ")}` };

    case z.ZodIssueCode.unrecognized_keys:
      return { message: `Campos no permitidos: ${issue.keys.join(", ")}` };

    case z.ZodIssueCode.invalid_string:
      if (issue.validation === "email") return { message: "Correo electrónico no válido" };
      if (issue.validation === "regex") return { message: "Formato no válido" };
      return { message: "Texto no válido" };

    default:
      return { message: ctx.defaultError };
  }
});
