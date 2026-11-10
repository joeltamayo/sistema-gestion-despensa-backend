// Reglas de cantidades según la unidad de medida.
//
//   kg, l    -> hasta 3 decimales (1 g = 0.001 kg, 1 ml = 0.001 l)
//   g, ml    -> solo enteros
//   pza      -> múltiplos de 0.25 (un cuarto, medio, tres cuartos y entero)
const UNIDADES = ["kg", "g", "l", "ml", "pza"];
const MAX_CANTIDAD = 1_000_000;

/** Redondea a 3 decimales para evitar errores de coma flotante (0.1 + 0.2). */
const redondear3 = (n) => Math.round((n + Number.EPSILON) * 1000) / 1000;

// Devuelve un mensaje de error si `valor` no es válido para `unidad`, o null si es correcto.

function validarCantidad(valor, unidad) {
  if (typeof valor !== "number" || !Number.isFinite(valor)) return "Debe ser un número";

  switch (unidad) {
    case "kg":
    case "l":
      if (Math.abs(valor * 1000 - Math.round(valor * 1000)) > 1e-6) {
        return `Para ${unidad} se permiten hasta 3 decimales`;
      }
      return null;
    case "g":
    case "ml":
      return Number.isInteger(valor) ? null : `Para ${unidad} solo se permiten números enteros`;
    case "pza":
      return Math.abs(valor * 4 - Math.round(valor * 4)) < 1e-9
        ? null
        : "Para pza debe ser múltiplo de 0.25 (un cuarto, medio, tres cuartos o entero)";
    default:
      return null;
  }
}

module.exports = { UNIDADES, MAX_CANTIDAD, redondear3, validarCantidad };
