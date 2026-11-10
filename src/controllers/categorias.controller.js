const categorias = require("../models/categorias.model");

exports.listar = (req, res) => {
  res.json({ datos: categorias.listar() });
};

exports.obtener = (req, res) => {
  res.json({ categoria: categorias.obtener(req.datos.params.id) });
};

exports.crear = (req, res) => {
  const categoria = categorias.crear(req.datos.body);
  res.status(201).json({ mensaje: "Categoría registrada correctamente", categoria });
};

exports.actualizar = (req, res) => {
  const categoria = categorias.actualizar(req.datos.params.id, req.datos.body);
  res.json({ mensaje: "Categoría modificada correctamente", categoria });
};

exports.eliminar = (req, res) => {
  categorias.eliminar(req.datos.params.id);
  res.json({ mensaje: "Categoría eliminada correctamente" });
};
