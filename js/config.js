/* ============================================================
   CONFIGURACIÓN DEL EMPRENDIMIENTO
   Cambia aquí el nombre, el lema, el WhatsApp y el login del admin.
   ============================================================ */
const CONFIG = {
  marca: "Brisa Store",
  lema: "Accesorios hechos a mano con estilo costero",
  descripcion:
    "Somos un emprendimiento que crea manillas, collares y bolsos artesanales. Cada pieza es única y está hecha con cariño.",
  whatsapp: "573000000000", // código de país + número, sin + ni espacios
  email: "hola@brisastore.com",

  // Para que el formulario envíe un correo REAL:
  // 1) crea un formulario gratis en https://formspree.io
  // 2) copia el ID (lo que va después de /f/) y pégalo aquí.
  formspreeId: "",

  // Credenciales del panel admin (login del lado del cliente).
  admin: { usuario: "admin", clave: "admin123" },
};
