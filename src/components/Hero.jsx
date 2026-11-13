

import { useState } from "react";
import { CONFIG } from "../data/config/tienda.js";
import { productosIniciales } from "../data/productos.js";

function Hero() {
  const productoDestacado = productosIniciales.find(
    (producto) => producto.imagenes.length > 0
  );

  const [imagenError, setImagenError] = useState(false);

  const rutaImagen = productoDestacado?.imagenes[0]
    ? productoDestacado.imagenes[0].startsWith("/")
      ? productoDestacado.imagenes[0]
      : `/${productoDestacado.imagenes[0]}`
    : "";

  return (
    <section className="hero" id="inicio">
      <div className="wrap">
        <div>
          <span className="cap">Productos para el cuerpo</span>

          <h1>{CONFIG.marca}</h1>

          <p className="lema">{CONFIG.lema}</p>

          <hr />

          <div className="btns">
            <a href="#catalogo" className="btn">
              Ver catálogo
            </a>

            <a href="#contacto" className="btn btn-ghost">
              Contactar
            </a>
          </div>
        </div>

        <figure className="hero-fig">
          <div className="hero-art" id="heroArt">
            {productoDestacado && !imagenError ? (
              <img
                src={rutaImagen}
                alt={productoDestacado.nombre}
                onError={() => setImagenError(true)}
              />
            ) : (
              <span className="inicial">
                {CONFIG.marca.charAt(0)}
              </span>
            )}
          </div>

          <figcaption id="heroCap">
            Figura 1.{" "}
            {imagenError
              ? "Colección de productos"
              : productoDestacado?.nombre || "Colección de productos"}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

export default Hero;
