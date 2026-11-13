
import { useState, useEffect, useRef } from "react";
import { CONFIG } from "../data/config/tienda.js";

function Chatbot({ productos, onSeleccionarProducto }) {
  const [abierto, setAbierto] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [mensajes, setMensajes] = useState([
    {
      id: 1,
      tipo: "bot",
      texto: "¡Hola! Soy tu asistente de compras. Cuéntame qué buscas y te ayudaré a elegir."
    }
  ]);

  const mensajesRef = useRef(null);

  const norm = (texto) =>
    texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  function formatoCOP(precio) {
    return precio.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    });
  }

  const FAQ = [
    {
      k: ["envio", "enviar", "domicilio", "despacho", "entrega", "llega"],
      r: "Hacemos envíos a todo el país. Normalmente tardan de 2 a 5 días hábiles según la ciudad."
    },
    {
      k: ["pago", "pagar", "transferencia", "nequi", "efectivo", "tarjeta"],
      r: "Puedes pagar por transferencia o Nequi. Coordinamos el pago por WhatsApp o por el formulario de contacto."
    },
    {
      k: ["horario", "hora", "atienden", "abierto"],
      r: "Atendemos de lunes a sábado, de 8:00 a. m. a 6:00 p. m. Fuera de horario respondemos al día siguiente."
    },
    {
      k: ["contacto", "whatsapp", "telefono", "correo", "email"],
      r: `Escríbenos por WhatsApp o usa el formulario de contacto de esta página. También por correo: ${CONFIG.email}`
    },
    {
      k: ["ingredientes", "ingrediente", "composicion", "componente", "contiene"],
      r: "Puedes consultar la descripción y los detalles de cada producto en nuestro catálogo para conocer su composición e información disponible."
    }
  ];

  const CATEGORIAS = {
    salud: "Salud y Bienestar",
    bienestar: "Salud y Bienestar",
    suplemento: "Suplementos",
    suplementos: "Suplementos"
  };

  const OCASIONES = {
    digestion: ["digestión", "fibra"],
    fibra: ["fibra", "digestión"],
    metabolismo: ["metabolismo"],
    piel: ["piel", "belleza"],
    belleza: ["belleza", "piel"],
    articulaciones: ["articulaciones"],
    deportes: ["deportes"],
    ejercicio: ["deportes"],
    vitaminas: ["vitaminas"],
    magnesio: ["magnesio", "minerales"],
    bienestar: ["bienestar"],
    natural: ["natural"]
  };

  function presupuesto(texto) {
    const coincidencia = texto.match(
      /(\d{1,3}(?:[.,]\d{3})+|\d+)\s*(mil|k)?/
    );

    if (!coincidencia) return null;

    let numero = parseInt(
      coincidencia[1].replace(/[.,]/g, ""),
      10
    );

    if (coincidencia[2] || numero < 1000) {
      numero *= 1000;
    }

    return numero >= 5000 ? numero : null;
  }

  function recomendar(texto) {
    const tope = presupuesto(texto);
    let categoria = null;

    for (const clave in CATEGORIAS) {
      if (texto.includes(clave)) {
        categoria = CATEGORIAS[clave];
      }
    }

    const tags = new Set();

    for (const clave in OCASIONES) {
      if (texto.includes(clave)) {
        OCASIONES[clave].forEach((tag) => tags.add(tag));
      }
    }

    if (!tope && !categoria && !tags.size) return null;

    const recomendados = productos
      .filter((p) => !tope || p.precio <= tope)
      .map((p) => {
        let puntuacion = 0;

        if (categoria && p.categoria === categoria) {
          puntuacion += 3;
        }

        (p.tags || []).forEach((tag) => {
          if (tags.has(tag)) puntuacion += 2;
        });

        return { producto: p, puntuacion };
      })
      .filter(
        (item) =>
          item.puntuacion > 0 || (!categoria && !tags.size)
      )
      .sort(
        (a, b) =>
          b.puntuacion - a.puntuacion ||
          a.producto.precio - b.producto.precio
      )
      .slice(0, 3)
      .map((item) => item.producto);

    if (!recomendados.length) {
      const masBarato = [...productos].sort(
        (a, b) => a.precio - b.precio
      )[0];

      return {
        texto: "No encontré algo exacto con ese criterio. Lo más económico que tenemos es:",
        productos: masBarato ? [masBarato] : []
      };
    }

    const partes = [];

    if (categoria) partes.push(categoria.toLowerCase());
    if (tope) partes.push(`hasta ${formatoCOP(tope)}`);

    return {
      texto: `Te recomiendo${partes.length ? " (" + partes.join(", ") + ")" : ""}. Toca un producto para ver sus fotografías y detalles.`,
      productos: recomendados
    };
  }

  function responder(texto) {
    const t = norm(texto);

    if (/^(hola|buenas|hey|buenos dias|buenas tardes|buenas noches)\b/.test(t)) {
      return {
        texto: "Hola. Cuéntame qué buscas (tipo de producto, necesidad o presupuesto) y te ayudo a elegir."
      };
    }

    if (/gracias|chao|adios/.test(t)) {
      return {
        texto: "Con gusto. Si necesitas algo más, aquí estoy."
      };
    }

    const pregunta = FAQ.find((f) =>
      f.k.some((clave) => t.includes(clave))
    );

    if (pregunta) {
      return { texto: pregunta.r };
    }

    if (/catalogo|que (tienen|venden|hay)|productos/.test(t)) {
      const categorias = [
        ...new Set(productos.map((p) => p.categoria))
      ];

      return {
        texto: `Tenemos ${categorias.join(", ")}. ¿Cuál te interesa?`,
        productos: productos.slice(0, 3)
      };
    }

    const recomendacion = recomendar(t);

    if (recomendacion) return recomendacion;

    return {
      texto: "No estoy seguro de haber entendido. Prueba con: “algo para la digestión”, “un suplemento”, “algo para la piel” o “productos hasta 80 mil”. También puedes preguntarme por envíos y pagos."
    };
  }

  function enviarMensaje(texto = mensaje) {
    const textoLimpio = texto.trim();

    if (!textoLimpio) return;

    const respuesta = responder(textoLimpio);

    setMensajes((anteriores) => [
      ...anteriores,
      {
        id: Date.now(),
        tipo: "user",
        texto: textoLimpio
      },
      {
        id: Date.now() + 1,
        tipo: "bot",
        texto: respuesta.texto,
        productos: respuesta.productos || []
      }
    ]);

    setMensaje("");
  }

  useEffect(() => {
    const contenedor = mensajesRef.current;

    if (contenedor) {
      contenedor.scrollTop = contenedor.scrollHeight;
    }
  }, [mensajes, abierto]);

  return (
    <>
      <button
        className="chat-fab"
        type="button"
        aria-label="Abrir asistente de compras"
        onClick={() => setAbierto(true)}
      >
        Asistente
      </button>

      <div
        className={`chat ${abierto ? "open" : ""}`}
        aria-live="polite"
        aria-hidden={!abierto}
      >
        <div className="chat-head">
          <span>Asistente de compras</span>

          <button
            type="button"
            aria-label="Cerrar chat"
            onClick={() => setAbierto(false)}
          >
            ×
          </button>
        </div>

        <div className="chat-msgs" ref={mensajesRef}>
          {mensajes.map((item) => (
            <div className={`msg ${item.tipo}`} key={item.id}>
              {item.texto}

              {item.productos?.map((producto) => (
                <button
                  className="sug"
                  type="button"
                  key={producto.id}
                  onClick={() => {
                    onSeleccionarProducto(producto);
                    setAbierto(false);
                  }}
                >
                  {producto.nombre} — {formatoCOP(producto.precio)}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="chat-quick">
          {["Envíos", "Pagos", "Catálogo"].map((opcion) => (
            <button
              type="button"
              key={opcion}
              onClick={() => enviarMensaje(opcion)}
            >
              {opcion}
            </button>
          ))}
        </div>

        <form
          className="chat-form"
          onSubmit={(e) => {
            e.preventDefault();
            enviarMensaje();
          }}
        >
          <input
            type="text"
            placeholder="Ej: Un suplemento para mí"
            autoComplete="off"
            aria-label="Escribe tu mensaje"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
          />

          <button className="btn btn-sm" type="submit">
            Enviar
          </button>
        </form>
      </div>
    </>
  );
}

export default Chatbot;
