// Carga datos de prueba (categorías, productos y movimientos) para probar la API y el cliente sin tener que capturar todo a mano.

//   npm run seed             -> agrega los datos (se niega si ya hay productos)
//   npm run seed -- --reset  -> BORRA categorías, productos y movimientos y los vuelve a cargar

// Requiere que ya exista el usuario (npm run crear-usuario): los movimientos se registran a nombre de ese usuario. El usuario y su contraseña NO se tocan.
const db = require("../src/config/database");
const env = require("../src/config/env");
//const usuarios = require("../src/models/usuarios.model");
const categorias = require("../src/models/categorias.model");
const productos = require("../src/models/productos.model");
const movimientos = require("../src/models/movimientos.model");
const { hoyLocal } = require("../src/utils/fechas");
const { redondear3 } = require("../src/utils/cantidades");

const reiniciar = process.argv.includes("--reset");

function salir(mensaje, codigo = 1) {
  (codigo === 0 ? console.log : console.error)(mensaje);
  db.close();
  process.exit(codigo);
}

console.log("=== Sistema de Gestión de Despensa: datos de prueba ===");
console.log(`Base de datos: ${env.RUTA_BD}\n`);

const usuario = db.prepare("SELECT id_usuario, correo FROM usuarios ORDER BY id_usuario LIMIT 1").get();
if (!usuario) salir("Todavía no existe ningún usuario. Primero ejecuta:  npm run crear-usuario");

const existentes = db.prepare("SELECT COUNT(*) AS n FROM productos").get().n;
if (existentes > 0 && !reiniciar) {
  salir(
    `Ya hay ${existentes} producto(s) en la base de datos, no se agregó nada.\n` +
      "Para borrar todo y volver a cargar los datos de prueba:  npm run seed -- --reset"
  );
}
const borrarTodo = () =>
  db.exec(`
    DELETE FROM movimientos;
    DELETE FROM productos;
    DELETE FROM categorias;
    DELETE FROM sqlite_sequence WHERE name IN ('movimientos','productos','categorias');
  `);

// Caducidades relativas a HOY, para que siempre haya vencidos y por vencer.
const dia = (n) => hoyLocal(n);

const CATEGORIAS = [
  ["Granos y cereales", "Arroz, frijol, avena, pasta"],
  ["Lácteos y huevo", "Productos refrigerados"],
  ["Enlatados", "Conservas y latas"],
  ["Bebidas", "Jugos, café, té y agua"],
  ["Limpieza", "Productos para el hogar"],
  ["Frutas y verduras", "Productos frescos"],
  ["Botanas y dulces", null],
  ["Sin productos", "Categoría vacía: sirve para probar el borrado"],
];

// [nombre, marca, cantidad, unidad, stock_minimo, caducidad, categoría, activo]
const PRODUCTOS = [
  ["Arroz blanco", "Verde Valle", 3.5, "kg", 1, dia(240), "Granos y cereales"],
  ["Frijol negro", "San Miguel", 0.8, "kg", 1, dia(300), "Granos y cereales"], // bajo stock
  ["Avena en hojuelas", "Quaker", 750, "g", 300, dia(120), "Granos y cereales"],
  ["Pasta spaghetti", "La Moderna", 6, "pza", 2, dia(400), "Granos y cereales"],
  ["Lentejas", null, 0, "kg", 0.5, dia(200), "Granos y cereales"], // agotado
  ["Leche entera", "Lala", 1, "l", 2, dia(-3), "Lácteos y huevo"], // vencida + bajo stock
  ["Yogur natural", "Danone", 4.75, "pza", 2, dia(3), "Lácteos y huevo"], // por vencer
  ["Queso panela", "Nochebuena", 0.4, "kg", 0.25, dia(6), "Lácteos y huevo"], // por vencer
  ["Huevo", "San Juan", 18, "pza", 12, dia(14), "Lácteos y huevo"],
  ["Atún en agua", "Dolores", 8, "pza", 4, dia(700), "Enlatados"],
  ["Chiles chipotles", "La Costeña", 3, "pza", 2, dia(500), "Enlatados"],
  ["Frijoles refritos", "Isadora", 2, "pza", 3, dia(-20), "Enlatados"], // vencido + bajo stock
  ["Café soluble", "Nescafé", 200, "g", 100, dia(365), "Bebidas"],
  ["Jugo de naranja", "Del Valle", 1.5, "l", 1, dia(5), "Bebidas"], // por vencer
  ["Agua embotellada", "Bonafont", 12, "l", 6, null, "Bebidas"],
  ["Detergente líquido", "Ariel", 2, "l", 1, null, "Limpieza"],
  ["Cloro", "Cloralex", 0.5, "l", 1, null, "Limpieza"], // bajo stock
  ["Jabón de trastes", "Axión", 2, "pza", 1, null, "Limpieza"],
  ["Plátano", null, 1.25, "kg", 0.5, dia(4), "Frutas y verduras"], // por vencer
  ["Manzana", null, 6, "pza", 3, dia(10), "Frutas y verduras"],
  ["Galletas", "Marías Gamesa", 0.75, "pza", 1, dia(90), "Botanas y dulces"], // 3/4 de pieza
  ["Sal de mesa", "La Fina", 1, "kg", 0.5, null, "Granos y cereales", false], // desactivado
];

// [nombre del producto, tipo, cantidad, motivo, hace cuántos días]
const MOVIMIENTOS = [
  ["Arroz blanco", "salida", 0.5, "Comida de la semana", 1],
  ["Arroz blanco", "entrada", 2, "Compra del súper", 6],
  ["Arroz blanco", "salida", 0.25, "Arroz con leche", 3],
  ["Frijol negro", "salida", 0.2, "Frijoles de la olla", 2],
  ["Avena en hojuelas", "salida", 50, "Desayuno", 1],
  ["Huevo", "salida", 6, "Desayunos", 2],
  ["Huevo", "entrada", 12, "Compra", 8],
  ["Yogur natural", "salida", 1.25, "Desayuno", 1],
  ["Leche entera", "salida", 1, "Café y cereal", 4],
  ["Lentejas", "salida", 0.5, "Sopa de lentejas", 5],
  ["Atún en agua", "salida", 2, "Tostadas", 3],
  ["Atún en agua", "entrada", 6, "Compra", 9],
  ["Café soluble", "salida", 30, null, 2],
  ["Agua embotellada", "salida", 3, null, 1],
  ["Detergente líquido", "salida", 0.5, "Lavado", 7],
  ["Plátano", "salida", 0.75, "Licuado", 1],
  ["Galletas", "salida", 0.25, "Colación", 0],
];

// Carga los datos de prueba en la base de datos.
function cargar() {
  const idCategoria = new Map();
  for (const [nombre, descripcion] of CATEGORIAS) {
    idCategoria.set(nombre, categorias.crear({ nombre, descripcion }).id_categoria);
  }

  // Efecto neto de los movimientos sobre cada producto.
  const neto = new Map();
  for (const [nombre, tipo, cantidad] of MOVIMIENTOS) {
    neto.set(nombre, (neto.get(nombre) || 0) + (tipo === "entrada" ? cantidad : -cantidad));
  }

  // Crea los productos y registra los movimientos, a nombre del usuario creado previamente.
  const idProducto = new Map();
  const desactivar = [];
  for (const [nombre, marca, final, unidad, stock_minimo, fecha_caducidad, categoria, activo] of PRODUCTOS) {
    const inicial = redondear3(final - (neto.get(nombre) || 0));
    if (inicial < 0) throw new Error(`Datos de prueba incoherentes: "${nombre}" quedaría con inicial ${inicial}`);
    const p = productos.crear(
      { nombre, marca, cantidad: inicial, unidad, stock_minimo, fecha_caducidad, id_categoria: idCategoria.get(categoria) },
      usuario.id_usuario
    );
    idProducto.set(nombre, p.id_producto);
    if (activo === false) desactivar.push(p.id_producto);
  }

  const fechas = [];
  for (const [nombre, tipo, cantidad, motivo, haceDias] of MOVIMIENTOS) {
    if (!idProducto.has(nombre)) throw new Error(`Movimiento de un producto que no existe: "${nombre}"`);
    const m = movimientos.registrar({ id_producto: idProducto.get(nombre), tipo, cantidad, motivo }, usuario.id_usuario);
    fechas.push([m.movimiento.id_movimiento, haceDias]);
  }
  for (const id of desactivar) productos.desactivar(id);

  // Reparte las fechas de los movimientos en los últimos días (y la entrada "Inventario inicial" en días más antiguos) para que el historial se vea real.
  const poner = db.prepare("UPDATE movimientos SET fecha = datetime('now', ?) WHERE id_movimiento = ?");
  db.prepare("SELECT id_movimiento FROM movimientos WHERE motivo = 'Inventario inicial'")
    .all()
    .forEach((fila, i) => poner.run(`-${10 + (i % 5)} days`, fila.id_movimiento));
  for (const [id, haceDias] of fechas) poner.run(`-${haceDias} days`, id);
}

// Todo o nada: si algo falla, no queda nada a medias.
try {
  db.transaction(() => {
    if (reiniciar) borrarTodo();
    cargar();
  })();
  if (reiniciar) console.log("Datos anteriores borrados (el usuario se conserva).");
} catch (error) {
  salir(`No se pudieron cargar los datos de prueba: ${error.message}`);
}

// Muestra un resumen de lo que se cargó.
const total = (tabla) => db.prepare(`SELECT COUNT(*) AS n FROM ${tabla}`).get().n;
console.log(`Listo. Datos a nombre de ${usuario.correo}:`);
console.log(`  Categorías:  ${total("categorias")}`);
console.log(`  Productos:   ${total("productos")} (1 desactivado)`);
console.log(`  Movimientos: ${total("movimientos")}`);
db.close();
