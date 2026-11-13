import { CONFIG } from "../data/config/tienda.js";

function ProductDetail({ producto, onClose, onSolicitar }) {
  if (!producto) return null;

  const formatoPrecio = producto.precio.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  });

  const mensajeWhatsApp = encodeURIComponent(
    `Hola, me interesa: ${producto.nombre}`
  );

  return (
    <div
      className="detalle open"
      id="detalle"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalle de ${producto.nombre}`}
    >
      <div className="detalle-bar">
        <div className="wrap">
          <button
            className="volver"
            type="button"
            onClick={onClose}
          >
            ← Volver al catálogo
          </button>

          <button
            className="cerrar"
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
          >
            ×
          </button>
        </div>
      </div>

      <div className="wrap detalle-body">
        <div className="det-grid">
          <div className="galeria">
            <div className="gal-main">
              {producto.imagenes.length > 0 ? (
                <img
                  src={producto.imagenes[0]}
                  alt={producto.nombre}
                />
              ) : (
                <p className="sin-foto">
                  Aún no hay fotografías de esta pieza.
                </p>
              )}
            </div>
          </div>

          <div className="ficha-prod">
            <span className="cap">{producto.categoria}</span>

            <h2>{producto.nombre}</h2>

            <div className="precio-gr">{formatoPrecio}</div>

            <p className="desc">{producto.descripcion}</p>

            <dl className="datos">
              {producto.detalles && (
                <>
                  <dt>Detalles</dt>
                  <dd>{producto.detalles}</dd>
                </>
              )}

              <dt>Categoría</dt>
              <dd>{producto.categoria}</dd>

              {producto.tags?.length > 0 && (
                <>
                  <dt>Etiquetas</dt>
                  <dd>{producto.tags.join(", ")}</dd>
                </>
              )}
            </dl>

            <div className="acciones">
              <button
                className="btn"
                type="button"
                onClick={() => onSolicitar(producto)}
              >
                Solicitar esta pieza
              </button>

              <a
                className="btn btn-ghost"
                href={`https://wa.me/${CONFIG.whatsapp}?text=${mensajeWhatsApp}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
