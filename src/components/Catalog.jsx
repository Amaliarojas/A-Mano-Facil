
import { useState } from "react";
import { productosIniciales } from "../data/productos.js";
import ProductDetail from "./ProductDetail";
import Chatbot from "./Chatbot";

function Catalog() {
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [precioMaximo, setPrecioMaximo] = useState(100000);
  const [orden, setOrden] = useState("normal");
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  const categorias = [
    "Todas",
    ...new Set(productosIniciales.map((p) => p.categoria))
  ];

  const precioTope = Math.ceil(
    Math.max(...productosIniciales.map((p) => p.precio)) / 5000
  ) * 5000;

  function formatoPrecio(precio) {
    return precio.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    });
  }

  let productosFiltrados = productosIniciales.filter((producto) => {
    const texto = (
      producto.nombre +
      " " +
      producto.descripcion +
      " " +
      producto.categoria
    ).toLowerCase();

    const coincideBusqueda = texto.includes(busqueda.toLowerCase());
    const coincideCategoria =
      categoria === "Todas" || producto.categoria === categoria;
    const coincidePrecio = producto.precio <= precioMaximo;

    return coincideBusqueda && coincideCategoria && coincidePrecio;
  });

  if (orden === "menor") {
    productosFiltrados.sort((a, b) => a.precio - b.precio);
  }

  if (orden === "mayor") {
    productosFiltrados.sort((a, b) => b.precio - a.precio);
  }

  if (orden === "nombre") {
    productosFiltrados.sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es")
    );
  }

  function solicitarProducto(producto) {
    setProductoSeleccionado(null);

    const contacto = document.getElementById("contacto");

    if (contacto) {
      contacto.scrollIntoView({ behavior: "smooth" });
    }
  }
return (
  <section className="sec" id="catalogo">
    <div className="wrap">
      <h2 className="sec-title">Catálogo</h2>

      <div className="tienda">
        <aside className="filtros">
          <div className="bloque">
            <label htmlFor="buscador">Buscar</label>
            <input
              id="buscador"
              type="search"
              placeholder="Nombre o descripción"
              autoComplete="off"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="bloque">
            <h3>Categorías</h3>
            <ul className="cats">
              {categorias.map((cat) => (
                <li key={cat}>
                  <button
                    type="button"
                    className={categoria === cat ? "active" : ""}
                    onClick={() => setCategoria(cat)}
                  >
                    <span>{cat}</span>
                    <span className="n">
                      {cat === "Todas"
                        ? productosIniciales.length
                        : productosIniciales.filter(
                            (p) => p.categoria === cat
                          ).length}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="bloque">
            <label htmlFor="rango">Precio máximo</label>
            <input
              type="range"
              id="rango"
              min="0"
              max={precioTope}
              step="5000"
              value={Math.min(precioMaximo, precioTope)}
              onChange={(e) => setPrecioMaximo(Number(e.target.value))}
            />
            <output className="nota">
              Hasta {formatoPrecio(precioMaximo)}
            </output>
          </div>
        </aside>

        <div>
          <div className="barra">
            <span id="conteo">
              {productosFiltrados.length}{" "}
              {productosFiltrados.length === 1 ? "pieza" : "piezas"}
            </span>

            <label className="orden">
              Ordenar
              <select
                id="orden"
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
              >
                <option value="normal">Destacados</option>
                <option value="menor">Precio: menor a mayor</option>
                <option value="mayor">Precio: mayor a menor</option>
                <option value="nombre">Nombre (A–Z)</option>
              </select>
            </label>
          </div>

          <div className="items">
            {productosFiltrados.length > 0 ? (
              productosFiltrados.map((producto) => (
                <article
                  className="item"
                  key={producto.id}
                  onClick={() => setProductoSeleccionado(producto)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setProductoSeleccionado(producto);
                    }
                  }}
                >
                  <div className="item-media">
                    <img
                      src={producto.imagenes[0]}
                      alt={producto.nombre}
                      loading="lazy"
                    />
                  </div>

                  <div className="item-info">
                    <span className="cap">{producto.categoria}</span>
                    <h3>{producto.nombre}</h3>
                    <span className="precio">
                      {formatoPrecio(producto.precio)}
                    </span>
                    <span className="ver">Ver detalle →</span>
                  </div>
                </article>
              ))
            ) : (
              <p className="vacio">
                No encontramos piezas con esos filtros.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>

    <ProductDetail
      producto={productoSeleccionado}
      onClose={() => setProductoSeleccionado(null)}
      onSolicitar={solicitarProducto}
    />
    <Chatbot
      productos={productosIniciales}
      onSeleccionarProducto={setProductoSeleccionado}
     />

  </section>
);
}

export default Catalog;
