const dashboard = require("../models/dashboard.model");

exports.obtener = (req, res) => {
  res.json(dashboard.obtener(req.datos.query));
};
