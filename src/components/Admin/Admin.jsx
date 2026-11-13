
import { useEffect, useRef, useState } from "react";
import { productosIniciales } from "../../data/productos.js";
import { formatCOP, procesarImagen } from "../../utils/adminUtils.js";

const API = "http://localhost:3000";
const CLAVE_PRODUCTOS = "catalogo_productos";
const MAX_FOTOS = 6;

function obtenerProductos() {
  try {
    const guardados = localStorage.getItem(CLAVE_PRODUCTOS);

    if (guardados) {
      return JSON.parse(guardados);
    }
  } catch (error) {
    console.error("Error al leer productos:", error);
  }

  return productosIniciales;
}

function Admin() {
  const [autenticado, setAutenticado] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [aviso, setAviso] = useState("");

  const [productos, setProductos] = useState(obtenerProductos);
  const [pestaña, setPestaña] = useState("prod");
  const [productoEditando, setProductoEditando] = useState(null);

  const [fotos, setFotos] = useState([]);
  const [cargandoFotos, setCargandoFotos] = useState(false);
  const [urlFoto, setUrlFoto] = useState("");
  const fileInputRef = useRef(null);

  const [solicitudes, setSolicitudes] = useState([]);
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState(false);
  const [errorSolicitudes, setErrorSolicitudes] = useState("");

  const [formulario, setFormulario] = useState({
    nombre: "",
    categoria: "",
    precio: "",
    descripcion: "",
    detalles: "",
    tags: "",
  });

  // Comprobar si existe una sesión de administrador
  useEffect(() => {
    async function comprobarSesion() {
      try {
        const respuesta = await fetch(`${API}/api/admin/sesion`, {
          credentials: "include",
        });

        const datos = await respuesta.json();
        setAutenticado(datos.autenticado);
      } catch (error) {
        setAviso("No se pudo conectar con el servidor.");
      } finally {
        setCargando(false);
      }
    }

    comprobarSesion();
  }, []);

  // Consultar solicitudes cuando se abre esa pestaña
  useEffect(() => {
    if (!autenticado || pestaña !== "msg") return;

    async function obtenerSolicitudes() {
      setCargandoSolicitudes(true);
      setErrorSolicitudes("");

      try {
        const respuesta = await fetch(`${API}/api/solicitudes`, {
          credentials: "include",
        });

        if (!respuesta.ok) {
          throw new Error("No se pudieron cargar las solicitudes.");
        }

        const datos = await respuesta.json();
        setSolicitudes(Array.isArray(datos) ? datos : []);
      } catch (error) {
        setErrorSolicitudes(error.message);
      } finally {
        setCargandoSolicitudes(false);
      }
    }

    obtenerSolicitudes();
  }, [autenticado, pestaña]);

  // Guardar catálogo en el navegador
  function guardarProductos(lista) {
    try {
      localStorage.setItem(CLAVE_PRODUCTOS, JSON.stringify(lista));
      setProductos(lista);
      return true;
    } catch (error) {
      setAviso("No hay espacio suficiente para guardar los productos.");
      return false;
    }
  }

  // Iniciar sesión
  async function iniciarSesion(e) {
    e.preventDefault();
    setAviso("");

    try {
      const respuesta = await fetch(`${API}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ usuario, clave }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setAviso(datos.mensaje || "Usuario o contraseña incorrectos.");
        return;
      }

      setAutenticado(true);
      setUsuario("");
      setClave("");
    } catch (error) {
      setAviso("No se pudo conectar con el servidor.");
    }
  }

  // Cerrar sesión
  async function cerrarSesion() {
    try {
      await fetch(`${API}/api/admin/logout`, {
        method: "POST",
        credentials: "include",
      });

      setAutenticado(false);
      setAviso("");
    } catch (error) {
      setAviso("No se pudo cerrar la sesión.");
    }
  }

  // Actualizar campos del formulario
  function cambiarCampo(e) {
    const { name, value } = e.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  // Procesar fotografías seleccionadas
  async function agregarArchivos(e) {
    const archivos = Array.from(e.target.files || []);

    if (!archivos.length) return;

    const disponibles = MAX_FOTOS - fotos.length;

    if (disponibles <= 0) {
      setAviso("Solo puedes agregar un máximo de 6 fotografías.");
      e.target.value = "";
      return;
    }

    const seleccionados = archivos.slice(0, disponibles);

    setCargandoFotos(true);
    setAviso("");

    try {
      const nuevasFotos = await Promise.all(
        seleccionados.map((archivo) => procesarImagen(archivo))
      );

      setFotos((anteriores) => [
        ...anteriores,
        ...nuevasFotos,
      ]);

      if (archivos.length > disponibles) {
        setAviso("Se agregaron las fotografías permitidas. El máximo es 6.");
      }
    } catch (error) {
      setAviso(error.message || "No se pudieron procesar las imágenes.");
    } finally {
      setCargandoFotos(false);
      e.target.value = "";
    }
  }

  // Agregar fotografía mediante URL
  function agregarUrl() {
    const url = urlFoto.trim();

    if (!url) {
      setAviso("Escribe una URL o ruta de imagen.");
      return;
    }

    if (fotos.length >= MAX_FOTOS) {
      setAviso("Solo puedes agregar un máximo de 6 fotografías.");
      return;
    }

    setFotos((anteriores) => [...anteriores, url]);
    setUrlFoto("");
    setAviso("");
  }

  // Elegir fotografía de portada
  function elegirPortada(index) {
    setFotos((anteriores) => {
      const nuevas = [...anteriores];
      const [seleccionada] = nuevas.splice(index, 1);
      nuevas.unshift(seleccionada);
      return nuevas;
    });
  }

  // Eliminar fotografía
  function eliminarFoto(index) {
    setFotos((anteriores) =>
      anteriores.filter((_, i) => i !== index)
    );
  }

  // Limpiar formulario
  function limpiarFormulario() {
    setFormulario({
      nombre: "",
      categoria: "",
      precio: "",
      descripcion: "",
      detalles: "",
      tags: "",
    });

    setProductoEditando(null);
    setFotos([]);
    setUrlFoto("");
    setAviso("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // Guardar producto nuevo o editado
  function guardarProducto(e) {
    e.preventDefault();

    if (cargandoFotos) {
      setAviso("Espera a que terminen de procesarse las fotografías.");
      return;
    }

    const datos = {
      nombre: formulario.nombre.trim(),
      categoria: formulario.categoria.trim(),
      precio: Number(formulario.precio),
      descripcion: formulario.descripcion.trim(),
      detalles: formulario.detalles.trim(),
      tags: formulario.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      imagenes: fotos,
    };

    let nuevaLista;

    if (productoEditando !== null) {
      nuevaLista = productos.map((producto) =>
        producto.id === productoEditando
          ? { ...producto, ...datos }
          : producto
      );
    } else {
      nuevaLista = [
        ...productos,
        {
          id: Date.now(),
          ...datos,
        },
      ];
    }

    if (guardarProductos(nuevaLista)) {
      limpiarFormulario();
      setAviso("Producto guardado correctamente.");
    }
  }

  // Cargar datos de un producto para editarlo
  function editarProducto(producto) {
    setProductoEditando(producto.id);

    setFormulario({
      nombre: producto.nombre || "",
      categoria: producto.categoria || "",
      precio: producto.precio || "",
      descripcion: producto.descripcion || "",
      detalles: producto.detalles || "",
      tags: Array.isArray(producto.tags)
        ? producto.tags.join(", ")
        : "",
    });

    setFotos(producto.imagenes || []);
    setUrlFoto("");
    setAviso("");
  }

  // Eliminar producto
  function eliminarProducto(id) {
    if (!window.confirm("¿Seguro que deseas eliminar este producto?")) {
      return;
    }

    const nuevaLista = productos.filter(
      (producto) => producto.id !== id
    );

    guardarProductos(nuevaLista);

    if (productoEditando === id) {
      limpiarFormulario();
    }
  }

  // Descargar catálogo
  function exportarProductos() {
    const contenido =
      "// Archivo generado desde el administrador\n\n" +
      `export const productosIniciales = ${JSON.stringify(productos, null, 2)};\n`;

    const archivo = new Blob([contenido], {
      type: "text/javascript;charset=utf-8",
    });

    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = "productos.js";
    enlace.click();

    URL.revokeObjectURL(url);
  }

  // Restaurar catálogo inicial
  function restaurarProductos() {
    if (!window.confirm("¿Restaurar el catálogo inicial?")) {
      return;
    }

    localStorage.removeItem(CLAVE_PRODUCTOS);
    setProductos(productosIniciales);
    limpiarFormulario();
    setAviso("Catálogo inicial restaurado.");
  }

  // Mostrar valores de las solicitudes
  function mostrarValor(valor) {
    if (valor === null || valor === undefined || valor === "") {
      return "No especificado";
    }

    if (typeof valor === "object") {
      return JSON.stringify(valor);
    }

    return String(valor);
  }

  if (cargando) {
    return <p className="wrap">Comprobando sesión...</p>;
  }

  return (
    <>
      <header className="nav">
        <div className="wrap">
          <a href="index.html" className="logo">
            ← Volver a la tienda
          </a>

          {autenticado && (
            <button
              className="btn btn-sm btn-ghost"
              onClick={cerrarSesion}
            >
              Cerrar sesión
            </button>
          )}
        </div>
      </header>

      <main className="wrap admin-wrap">
        {!autenticado ? (
          <section>
            <form className="login-box" onSubmit={iniciarSesion}>
              <h2>Acceso administrador</h2>

              <label>
                Usuario
                <input
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  required
                />
              </label>

              <label>
                Contraseña
                <input
                  type="password"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  required
                />
              </label>

              <button className="btn" type="submit">
                Entrar
              </button>

              <div className="aviso">{aviso}</div>
            </form>
          </section>
        ) : (
          <section>
            <h2 style={{ marginBottom: "1.2rem" }}>
              Panel de gestión
            </h2>

            <div className="tabs">
              <button
                className={pestaña === "prod" ? "active" : ""}
                onClick={() => setPestaña("prod")}
              >
                Productos
              </button>

              <button
                className={pestaña === "msg" ? "active" : ""}
                onClick={() => setPestaña("msg")}
              >
                Solicitudes
              </button>
            </div>

            {pestaña === "prod" && (
              <div className="panel-grid">
                <form className="admin-form" onSubmit={guardarProducto}>
                  <h3>
                    {productoEditando !== null
                      ? "Editar producto"
                      : "Nuevo producto"}
                  </h3>

                  <label>
                    Nombre
                    <input
                      name="nombre"
                      value={formulario.nombre}
                      onChange={cambiarCampo}
                      maxLength="60"
                      required
                    />
                  </label>

                  <label>
                    Categoría
                    <input
                      name="categoria"
                      value={formulario.categoria}
                      onChange={cambiarCampo}
                      maxLength="30"
                      required
                    />
                  </label>

                  <label>
                    Precio (COP)
                    <input
                      name="precio"
                      type="number"
                      min="0"
                      step="500"
                      value={formulario.precio}
                      onChange={cambiarCampo}
                      required
                    />
                  </label>

                  <label>
                    Descripción corta
                    <textarea
                      name="descripcion"
                      value={formulario.descripcion}
                      onChange={cambiarCampo}
                      maxLength="160"
                      required
                    />
                  </label>

                  <label>
                    Detalles
                    <textarea
                      name="detalles"
                      value={formulario.detalles}
                      onChange={cambiarCampo}
                      maxLength="300"
                    />
                  </label>

                  <label>
                    Etiquetas (separadas por coma)
                    <input
                      name="tags"
                      value={formulario.tags}
                      onChange={cambiarCampo}
                    />
                  </label>

                  {/* Administrar fotografías */}
                  <div>
                    <label>
                      Fotografías del producto ({fotos.length}/{MAX_FOTOS})
                    </label>

                    <div
                      className="drop"
                      role="button"
                      tabIndex={0}
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          fileInputRef.current?.click();
                        }
                      }}
                    >
                      <strong>Seleccionar fotografías</strong>
                      <p className="nota">
                        Haz clic para buscar imágenes en tu computador.
                        Máximo 6 fotografías.
                      </p>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={agregarArchivos}
                    />

                    {cargandoFotos && (
                      <p className="nota">Procesando fotografías...</p>
                    )}

                    <div className="previews">
                      {fotos.map((foto, index) => (
                        <div
                          key={`${index}-${foto.slice(0, 30)}`}
                          style={{
                            display: "inline-flex",
                            flexDirection: "column",
                            gap: "5px",
                            margin: "8px",
                            padding: "8px",
                            border: index === 0
                              ? "2px solid #6CAE75"
                              : "1px solid #ccc",
                            borderRadius: "8px",
                          }}
                        >
                          <img
                            src={foto}
                            alt={`Fotografía ${index + 1}`}
                            style={{
                              width: "100px",
                              height: "100px",
                              objectFit: "cover",
                              borderRadius: "5px",
                            }}
                          />

                          {index === 0 && (
                            <small>Portada</small>
                          )}

                          {index !== 0 && (
                            <button
                              className="btn btn-sm"
                              type="button"
                              onClick={() => elegirPortada(index)}
                            >
                              Elegir portada
                            </button>
                          )}

                          <button
                            className="btn btn-sm btn-danger"
                            type="button"
                            onClick={() => eliminarFoto(index)}
                          >
                            Eliminar
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="fila-url">
                      <input
                        type="text"
                        value={urlFoto}
                        onChange={(e) => setUrlFoto(e.target.value)}
                        placeholder="Pega aquí una URL o ruta de imagen"
                      />

                      <button
                        className="btn btn-sm"
                        type="button"
                        onClick={agregarUrl}
                      >
                        Agregar URL
                      </button>
                    </div>
                  </div>

                  <div className="aviso">{aviso}</div>

                  <div className="fila-url">
                    <button
                      className="btn"
                      type="submit"
                      disabled={cargandoFotos}
                    >
                      Guardar
                    </button>

                    {productoEditando !== null && (
                      <button
                        className="btn btn-ghost"
                        type="button"
                        onClick={limpiarFormulario}
                      >
                        Cancelar edición
                      </button>
                    )}
                  </div>
                </form>

                {/* Tabla de productos */}
                <div>
                  <div className="scroll-x">
                    <table className="tabla">
                      <thead>
                        <tr>
                          <th></th>
                          <th>Producto</th>
                          <th>Precio</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>

                      <tbody>
                        {productos.map((producto) => (
                          <tr key={producto.id}>
                            <td>
                              {producto.imagenes?.[0] && (
                                <img
                                  src={producto.imagenes[0]}
                                  alt={producto.nombre}
                                  width="50"
                                />
                              )}
                            </td>

                            <td>
                              <strong>{producto.nombre}</strong>
                              <br />
                              <small>{producto.categoria}</small>
                            </td>

                            <td>{formatCOP(producto.precio)}</td>

                            <td>
                              <button
                                className="btn btn-sm"
                                type="button"
                                onClick={() => editarProducto(producto)}
                              >
                                Editar
                              </button>

                              <button
                                className="btn btn-sm btn-danger"
                                type="button"
                                onClick={() => eliminarProducto(producto.id)}
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pie-tabla">
                    <button
                      className="btn btn-sm"
                      type="button"
                      onClick={exportarProductos}
                    >
                      Descargar productos.js
                    </button>

                    <button
                      className="btn btn-sm btn-danger"
                      type="button"
                      onClick={restaurarProductos}
                    >
                      Restaurar catálogo inicial
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Solicitudes de clientes */}
            {pestaña === "msg" && (
              <div>
                <h3>Solicitudes de clientes</h3>

                {cargandoSolicitudes && (
                  <p>Cargando solicitudes...</p>
                )}

                {errorSolicitudes && (
                  <div className="aviso">{errorSolicitudes}</div>
                )}

                {!cargandoSolicitudes &&
                  !errorSolicitudes &&
                  solicitudes.length === 0 && (
                    <p>No hay solicitudes registradas todavía.</p>
                  )}

                {!cargandoSolicitudes &&
                  solicitudes.map((solicitud, index) => (
                    <article
                      key={solicitud._id || index}
                      className="admin-form"
                      style={{ marginBottom: "1rem" }}
                    >
                      <h4>
                        Solicitud {index + 1}
                      </h4>

                      {Object.entries(solicitud)
                        .filter(([campo]) => campo !== "_id" && campo !== "__v")
                        .map(([campo, valor]) => (
                          <p key={campo}>
                            <strong>
                              {campo === "fecha"
                                ? "Fecha"
                                : campo.charAt(0).toUpperCase() + campo.slice(1)}
                              :
                            </strong>{" "}
                            {campo === "fecha" && valor
                              ? new Date(valor).toLocaleString("es-CO")
                              : mostrarValor(valor)}
                          </p>
                        ))}
                    </article>
                  ))}
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}

export default Admin;
