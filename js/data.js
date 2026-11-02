
const Store = {
  K_PROD: "catalogo_productos",
  K_MSG: "catalogo_mensajes",
  K_SESSION: "catalogo_admin_sesion",

  normalizar(p) {
    const imgs = Array.isArray(p.imagenes) ? p.imagenes : p.imagen ? [p.imagen] : [];
    return {
      id: p.id, nombre: p.nombre, categoria: p.categoria, precio: Number(p.precio) || 0,
      descripcion: p.descripcion || "", detalles: p.detalles || "",
      tags: Array.isArray(p.tags) ? p.tags : [],
      imagenes: imgs.filter(Boolean),
    };
  },
  getProducts() {
    try {
      const raw = localStorage.getItem(this.K_PROD);
      if (raw) return JSON.parse(raw).map((p) => this.normalizar(p));
    } catch (e) {}
    return DEFAULT_PRODUCTS.map((p) => this.normalizar(p));
  },
  saveProducts(list) {
    try { localStorage.setItem(this.K_PROD, JSON.stringify(list)); return true; }
    catch (e) { return false; }
  },
  resetProducts() { localStorage.removeItem(this.K_PROD); },

  getMessages() { try { return JSON.parse(localStorage.getItem(this.K_MSG)) || []; } catch (e) { return []; } },
  addMessage(m) {
    const list = this.getMessages();
    list.unshift({ ...m, id: Date.now(), fecha: new Date().toLocaleString("es-CO") });
    try { localStorage.setItem(this.K_MSG, JSON.stringify(list)); } catch (e) {}
  },
  saveMessages(list) { try { localStorage.setItem(this.K_MSG, JSON.stringify(list)); } catch (e) {} },

  /* Imagen provisional (SVG) cuando el producto aún no tiene fotografías */
  placeholder(p) {
    const tonos = [["#ece5d6", "#d9cfb8"], ["#e1e8e4", "#c9d6cf"], ["#eee3dc", "#dccabf"], ["#e3e6ee", "#cdd2e0"]];
    const [a, b] = tonos[(p.categoria || "").length % tonos.length];
    const ini = escapeHTML((p.nombre || "?").trim().charAt(0).toUpperCase());
    const svg =
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
      `<stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient></defs>` +
      `<rect width='400' height='500' fill='url(#g)'/><rect x='22' y='22' width='356' height='456' fill='none' stroke='#a8864f' stroke-width='1' opacity='.75'/>` +
      `<text x='200' y='300' text-anchor='middle' font-family='Georgia,serif' font-style='italic' font-size='200' fill='#1f3a3d' opacity='.16'>${ini}</text>` +
      `<text x='200' y='448' text-anchor='middle' font-family='Georgia,serif' font-size='14' letter-spacing='4' fill='#1f3a3d' opacity='.55'>SIN FOTOGRAFÍA</text></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  },
  /* Lista de imágenes a mostrar (nunca vacía) */
  imagenes(p) { return p.imagenes && p.imagenes.length ? p.imagenes : [this.placeholder(p)]; },
};

function formatCOP(n) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}
function escapeHTML(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* Reduce y comprime una imagen subida (máx. 900 px, JPEG) para que quepa en el navegador */
function procesarImagen(file, max = 900, calidad = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("El archivo no es una imagen."));
    const fr = new FileReader();
    fr.onerror = () => reject(new Error("No se pudo leer el archivo."));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("La imagen no es válida."));
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", calidad));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}
