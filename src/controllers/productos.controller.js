const productos = require("../models/productos.model");

exports.listar = (req, res) => {
  res.json(productos.listar(req.datos.query));
};

exports.obtener = (req, res) => {
  res.json({ producto: productos.obtener(req.datos.params.id) });
};

exports.crear = (req, res) => {
  const producto = productos.crear(req.datos.body, req.usuario.id_usuario);
  res.status(201).json({ mensaje: "Producto registrado correctamente", producto });
};

exports.actualizar = (req, res) => {
  const producto = productos.actualizar(req.datos.params.id, req.datos.body);
  res.json({ mensaje: "Producto modificado correctamente", producto });
};

exports.desactivar = (req, res) => {
  const producto = productos.desactivar(req.datos.params.id);
  res.json({ mensaje: "Producto desactivado correctamente", producto });
};

exports.reactivar = (req, res) => {
  const producto = productos.reactivar(req.datos.params.id);
  res.json({ mensaje: "Producto reactivado correctamente", producto });
};
