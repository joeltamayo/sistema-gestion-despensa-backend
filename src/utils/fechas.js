// Utilidades de fechas.
//
// - SQLite guarda created_at / fecha como "AAAA-MM-DD HH:MM:SS" en UTC
//   (CURRENT_TIMESTAMP). La API las devuelve en formato ISO ("...T...Z") para
//   que el navegador las convierta correctamente a la hora local.
// - fecha_caducidad es solo una fecha ("AAAA-MM-DD") y se compara con el día
//   local de la computadora donde corre el servidor.
const pad = (n) => String(n).padStart(2, "0");

/** Fecha local de hoy (más `sumarDias`) como "AAAA-MM-DD". */
function hoyLocal(sumarDias = 0) {
  const d = new Date();
  d.setDate(d.getDate() + sumarDias);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** true si el texto es una fecha real con formato AAAA-MM-DD (rechaza 2026-02-31). */
function esFechaValida(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const [y, m, d] = texto.split("-").map(Number);
  const fecha = new Date(Date.UTC(y, m - 1, d));
  return fecha.getUTCFullYear() === y && fecha.getUTCMonth() === m - 1 && fecha.getUTCDate() === d;
}

/** "2026-11-03 06:15:00" (UTC de SQLite) -> "2026-11-03T06:15:00Z". */
function sqliteAIso(texto) {
  return texto ? `${texto.replace(" ", "T")}Z` : texto;
}

/** Date -> "AAAA-MM-DD HH:MM:SS" en UTC (formato de SQLite). */
function dateASqlite(fecha) {
  return fecha.toISOString().slice(0, 19).replace("T", " ");
}

/** Texto de SQLite (UTC) -> Date. */
function sqliteADate(texto) {
  return new Date(`${texto.replace(" ", "T")}Z`);
}

/** Momento actual + N minutos, en formato SQLite. */
function ahoraMasMinutos(minutos) {
  return dateASqlite(new Date(Date.now() + minutos * 60 * 1000));
}

/**
 * Inicio (00:00 hora local) del día "AAAA-MM-DD" (+ sumarDias), expresado en
 * UTC con formato SQLite. Sirve para filtrar movimientos por día local.
 */
function inicioDiaLocalEnUtc(fecha, sumarDias = 0) {
  const [y, m, d] = fecha.split("-").map(Number);
  return dateASqlite(new Date(y, m - 1, d + sumarDias, 0, 0, 0, 0));
}

module.exports = {
  hoyLocal,
  esFechaValida,
  sqliteAIso,
  dateASqlite,
  sqliteADate,
  ahoraMasMinutos,
  inicioDiaLocalEnUtc,
};
