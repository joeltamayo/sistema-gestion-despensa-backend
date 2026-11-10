const movimientos = require("../models/movimientos.model");

exports.listar = (req, res) => {
  res.json(movimientos.listar(req.datos.query));
};

exports.crear = (req, res) => {
  const resultado = movimientos.registrar(req.datos.body, req.usuario.id_usuario);
  const verbo = resultado.movimiento.tipo === "entrada" ? "Entrada" : "Salida";
  res.status(201).json({ mensaje: `${verbo} registrada correctamente`, ...resultado });
};
