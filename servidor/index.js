
const express = require("express");

const { MongoClient } = require("mongodb");
require("dotenv").config();

const cors = require("cors");
const session = require("express-session");

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3000;

// Conexión con MongoDB
const client = new MongoClient(process.env.MONGO_URI);
let db;
let solicitudes;

async function conectarDB() {
    try {
        await client.connect();

        db = client.db("amanofacilito");
        solicitudes = db.collection("solicitudes");

        console.log("¡Conexión con MongoDB exitosa!");
    } catch (error) {
        console.error("Error al conectar con MongoDB:", error);
    }
}

// Permite que el servidor reciba información en formato JSON

app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://saezarceandresantonio-coder.github.io"
    ],
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    }
}));

// Ruta principal para comprobar que el servidor funciona
app.get("/", (req, res) => {
    res.send("¡El servidor de A Mano Fácil está funcionando!");
});

// Verificar si el administrador inició sesión
function verificarAdmin(req, res, next) {
    if (req.session && req.session.admin) {
        return next();
    }

    res.status(401).json({
        mensaje: "Debes iniciar sesión para acceder."
    });
}

// Iniciar sesión del administrador
app.post("/api/admin/login", (req, res) => {
    const { usuario, clave } = req.body;

    if (
        usuario === process.env.ADMIN_USER &&
        clave === process.env.ADMIN_PASSWORD
    ) {
        req.session.admin = true;

        return res.json({
            mensaje: "Inicio de sesión correcto."
        });
    }

    res.status(401).json({
        mensaje: "Usuario o contraseña incorrectos."
    });
});

// Consultar el estado de la sesión
app.get("/api/admin/sesion", (req, res) => {
    res.json({
        autenticado: Boolean(req.session && req.session.admin)
    });
});

// Cerrar sesión
app.post("/api/admin/logout", (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({
                mensaje: "No se pudo cerrar la sesión."
            });
        }

        res.clearCookie("connect.sid");

        res.json({
            mensaje: "Sesión cerrada."
        });
    });
});



// Recibir solicitudes de los clientes
app.post("/api/solicitudes", async (req, res) => {
    try {
        const nuevaSolicitud = {
            ...req.body,
            fecha: new Date()
        };

        await solicitudes.insertOne(nuevaSolicitud);

        res.status(201).json({
            mensaje: "Solicitud guardada correctamente"
        });

    } catch (error) {
        console.error("Error al guardar solicitud:", error);

        res.status(500).json({
            mensaje: "No se pudo guardar la solicitud"
        });
    }
});


// Consultar las solicitudes de los clientes
app.get("/api/solicitudes", verificarAdmin, async (req, res) => {
    try {
        const lista = await solicitudes
            .find()
            .sort({ fecha: -1 })
            .toArray();

        res.json(lista);

    } catch (error) {
        console.error("Error al consultar solicitudes:", error);

        res.status(500).json({
            mensaje: "No se pudieron consultar las solicitudes"
        });
    }
});


// Encender el servidor
conectarDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor activo en http://localhost:${PORT}`);
    });
});


