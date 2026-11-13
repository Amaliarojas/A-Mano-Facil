
export function formatCOP(n) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
}

export function escapeHTML(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

export function procesarImagen(file, max = 900, calidad = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      return reject(new Error("El archivo no es una imagen."));
    }

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
