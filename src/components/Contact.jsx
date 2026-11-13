
import { useState } from "react";
import { CONFIG } from "../data/config/tienda.js";
import { productosIniciales } from "../data/productos.js";

function Contact() {
  const [datos, setDatos] = useState({
    nombre: "",
    email: "",
    producto: "",
    mensaje: ""
  });

  const [aviso, setAviso] = useState({
    mensaje: "",
    tipo: ""
  });

  const [enviando, setEnviando] = useState(false);

  function manejarCambio(e) {
    const { name, value } = e.target;

    setDatos((anterior) => ({
      ...anterior,
      [name]: value
    }));
  }

  async function manejarEnvio(e) {
    e.preventDefault();

    const data = {
      nombre: datos.nombre.trim(),
      email: datos.email.trim(),
      producto: datos.producto,
      mensaje: datos.mensaje.trim()
    };

    if (data.nombre.length < 2) {
      setAviso({ mensaje: "Escribe tu nombre.", tipo: "err" });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      setAviso({ mensaje: "Escribe un correo válido.", tipo: "err" });
      return;
    }

    if (data.mensaje.length < 5) {
      setAviso({
        mensaje: "Cuéntanos un poco más en el mensaje.",
        tipo: "err"
      });
      return;
    }

    setEnviando(true);
    setAviso({ mensaje: "", tipo: "" });

    try {
      const respuesta = await fetch(
        "http://localhost:3000/api/solicitudes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(data)
        }
      );

      if (!respuesta.ok) {
        throw new Error("No se pudo guardar la solicitud");
      }

      setAviso({
        mensaje: "Gracias. Recibimos tu solicitud y te responderemos pronto.",
        tipo: "ok"
      });

      setDatos({
        nombre: "",
        email: "",
        producto: "",
        mensaje: ""
      });

    } catch (error) {
      console.error(error);

      setAviso({
        mensaje: "No pudimos enviar tu solicitud. Inténtalo nuevamente.",
        tipo: "err"
      });

    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="sec alt" id="contacto">
      <div className="wrap">
        <h2 className="sec-title">Contacto</h2>

        <div className="contacto">
          <div className="info">
            <p>
              Cuéntanos qué producto te interesa.
              Respondemos en menos de 24 horas.
            </p>

            <dl>
              <dt>Correo</dt>
              <dd>
                <a href={`mailto:${CONFIG.email}`}>
                  {CONFIG.email}
                </a>
              </dd>

              <dt>WhatsApp</dt>
              <dd>
                <a
                  href={`https://wa.me/${CONFIG.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Escríbenos por WhatsApp
                </a>
              </dd>

              <dt>Envíos</dt>
              <dd>A todo el país.</dd>
            </dl>
          </div>

          <form className="ed" id="formContacto" onSubmit={manejarEnvio} noValidate>
            <label>
              Nombre
              <input
                type="text"
                name="nombre"
                value={datos.nombre}
                onChange={manejarCambio}
                required
                maxLength="60"
                autoComplete="name"
              />
            </label>

            <label>
              Correo
              <input
                type="email"
                name="email"
                value={datos.email}
                onChange={manejarCambio}
                required
                autoComplete="email"
              />
            </label>

            <label>
              Producto de interés
              <select
                name="producto"
                value={datos.producto}
                onChange={manejarCambio}
              >
                <option value="">General</option>

                {productosIniciales.map((producto, indice) => (
                  <option key={producto.id ?? indice} value={producto.nombre}>
                    {producto.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Mensaje
              <textarea
                name="mensaje"
                value={datos.mensaje}
                onChange={manejarCambio}
                required
                maxLength="500"
              />
            </label>

            <div>
              <button className="btn" type="submit" disabled={enviando}>
                {enviando ? "Enviando..." : "Enviar solicitud"}
              </button>
            </div>

            {aviso.mensaje && (
              <div className={`aviso ${aviso.tipo}`} role="status">
                {aviso.mensaje}
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}

export default Contact;
