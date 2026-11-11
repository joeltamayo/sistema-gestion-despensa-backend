# Backend de Despensa

API REST del Sistema de Gestión de Despensa, construida con Node.js, Express y SQLite.

## Requisitos

- Node.js `20` o posterior.
- npm, incluido con Node.js.

## Instalación

Desde una terminal, entra en la carpeta donde esta ubicado el backend, por ejemplo:

```powershell
cd C:\Proyectos\Despensa\Backend
npm install
```

## Configuración

Antes de iniciar el servidor, crea el archivo `Backend/.env` con una clave de sesión
de al menos 32 caracteres:

```dotenv
SESSION_SECRET=coloca-aqui-una-clave-secreta-de-al-menos-32-caracteres
```

Puedes generar una clave segura con:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Variables disponibles:

| Variable | Obligatoria | Valor predeterminado | Descripción |
| --- | --- | --- | --- |
| `SESSION_SECRET` | Sí | — | Clave para firmar las sesiones. Mínimo 32 caracteres. |
| `PUERTO` | No | `3000` | Puerto donde escucha la API. |
| `ORIGEN_CLIENTE` | No | `http://localhost:5500` | URL del frontend autorizado por CORS. |
| `RUTA_BD` | No | `database/despensa.db` | Ruta de la base de datos SQLite, relativa a `Backend`. |
| `NODE_ENV` | No | `development` | Entorno de ejecución. |
| `HOST` | No | `127.0.0.1` | Interfaz de red. Usa `0.0.0.0` para permitir conexiones desde la red local. |
| `SESION_HORAS` | No | `2` | Duración de la sesión, entre 1 y 168 horas. |

No agregues `.env` al control de versiones; puede contener información sensible.

## Crear el usuario inicial

La API no tiene registro público. Crea la cuenta desde la terminal:

```powershell
npm run crear-usuario
```

El comando solicitará el correo y la contraseña. Si el correo ya existe, permite
restablecer su contraseña.

## Iniciar el backend

Para ejecutar el servidor:

```powershell
npm start
```

La API estará disponible en:

```text
http://localhost:3000
```

Para desarrollo, `nodemon` reinicia el servidor cuando detecta cambios:

```powershell
npm run dev
```

La base de datos y sus tablas se crean automáticamente al iniciar por primera vez.
La aplicación usa `database/despensa.db` si no se configura otra ruta.

## Datos de prueba (opcional)

Después de crear un usuario, puedes cargar categorías, productos y movimientos de
ejemplo:

```powershell
npm run seed
```

El comando no agrega datos si ya existen productos. Para borrar las categorías,
productos y movimientos y cargarlos nuevamente:

```powershell
npm run seed -- --reset
```

El usuario y su contraseña se conservan al usar `--reset`.

## Comprobar que funciona

Abre esta URL en el navegador o usa `curl`:

```text
http://localhost:3000/api/salud
```

Respuesta esperada:

```json
{"estado":"ok"}
```

El inicio de sesión se realiza mediante `POST /api/auth/login`. Las rutas de
categorías, productos, movimientos y dashboard requieren una sesión activa.


## Detener el servidor

Presiona `Ctrl + C` en la terminal donde está ejecutándose.