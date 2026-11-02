/* ============================================================
   ASISTENTE RECOMENDADOR (IA aplicada)
   Entiende el mensaje (presupuesto, categoría, ocasión y preguntas
   frecuentes) y recomienda productos REALES del catálogo.
   Funciona en el navegador, sin exponer ninguna API key.

   Para usar un modelo de lenguaje real (Claude u otro), llámalo desde
   un backend propio (Node/Express o función serverless) y adapta
   Asistente.responder(): así la clave nunca se publica en GitHub.
   ============================================================ */
const Asistente = (function () {
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  const FAQ = [
    { k: ["envio", "enviar", "domicilio", "despacho", "entrega", "llega"],
      r: "Hacemos envíos a todo el país. Normalmente tardan de 2 a 5 días hábiles según la ciudad." },
    { k: ["pago", "pagar", "transferencia", "nequi", "efectivo", "tarjeta"],
      r: "Puedes pagar por transferencia o Nequi. Coordinamos el pago por WhatsApp o por el formulario de contacto." },
    { k: ["horario", "hora", "atienden", "abierto"],
      r: "Atendemos de lunes a sábado, de 8:00 a. m. a 6:00 p. m. Fuera de horario respondemos al día siguiente." },
    { k: ["contacto", "whatsapp", "telefono", "correo", "email"],
      r: `Escríbenos por WhatsApp o usa el formulario de contacto de esta página. También por correo: ${CONFIG.email}` },
    { k: ["material", "hipoalergenico", "alergia", "dura", "duran"],
      r: "Usamos fibras naturales, concha, perlas de río y acero inoxidable hipoalergénico. Con buen cuidado duran años." },
    { k: ["personalizado", "personalizar", "a medida", "encargo", "pedido especial"],
      r: "Sí, aceptamos pedidos personalizados. Cuéntanos tu idea en el formulario de contacto." },
  ];

  const CATEGORIAS = { manilla: "Manillas", pulsera: "Manillas", collar: "Collares", cadena: "Collares", bolso: "Bolsos", cartera: "Bolsos", set: "Sets", combo: "Sets" };
  const OCASIONES = {
    regalo: ["regalo"], cumple: ["cumpleanos"], aniversario: ["aniversario"], pareja: ["pareja"], novia: ["pareja", "mujer"],
    novio: ["pareja", "unisex"], mama: ["mujer", "regalo"], amiga: ["mujer", "regalo"], playa: ["playa"], elegante: ["elegante"],
    salir: ["salir"], diario: ["diario"], economico: ["economico"], barato: ["economico"],
  };

  function presupuesto(t) {
    const m = t.match(/(\d{1,3}(?:[.,]\d{3})+|\d+)\s*(mil|k)?/);
    if (!m) return null;
    let n = parseInt(m[1].replace(/[.,]/g, ""), 10);
    if (m[2] || n < 1000) n *= 1000;
    return n >= 5000 ? n : null;
  }

  function recomendar(t, productos) {
    const tope = presupuesto(t);
    let cat = null;
    for (const k in CATEGORIAS) if (t.includes(k)) cat = CATEGORIAS[k];
    const tags = new Set();
    for (const k in OCASIONES) if (t.includes(k)) OCASIONES[k].forEach((x) => tags.add(x));

    if (!tope && !cat && !tags.size) return null;

    const ranked = productos
      .filter((p) => !tope || p.precio <= tope)
      .map((p) => {
        let s = 0;
        if (cat && p.categoria === cat) s += 3;
        (p.tags || []).forEach((tg) => { if (tags.has(tg)) s += 2; });
        return { p, s };
      })
      .filter((x) => x.s > 0 || (!cat && !tags.size))
      .sort((a, b) => b.s - a.s || a.p.precio - b.p.precio)
      .slice(0, 3)
      .map((x) => x.p);

    if (!ranked.length) {
      const masBarato = [...productos].sort((a, b) => a.precio - b.precio)[0];
      return { texto: "No encontré algo exacto con ese criterio. Lo más económico que tenemos es:", productos: masBarato ? [masBarato] : [] };
    }
    const partes = [];
    if (cat) partes.push(cat.toLowerCase());
    if (tope) partes.push(`hasta ${formatCOP(tope)}`);
    return { texto: `Te recomiendo${partes.length ? " (" + partes.join(", ") + ")" : ""}. Toca una pieza para ver sus fotografías y detalles.`, productos: ranked };
  }

  function responder(mensaje, productos) {
    const t = norm(mensaje);
    if (/^(hola|buenas|hey|buenos dias|buenas tardes|buenas noches)\b/.test(t))
      return { texto: "Hola. Cuéntame qué buscas (tipo de producto, ocasión o presupuesto) y te ayudo a elegir." };
    if (/gracias|chao|adios/.test(t)) return { texto: "Con gusto. Si necesitas algo más, aquí estoy." };

    const faq = FAQ.find((f) => f.k.some((k) => t.includes(k)));
    if (faq) return { texto: faq.r };

    if (/catalogo|que (tienen|venden|hay)|productos/.test(t))
      return { texto: `Tenemos ${[...new Set(productos.map((p) => p.categoria))].join(", ")}. ¿Cuál te interesa?`, productos: productos.slice(0, 3) };

    const rec = recomendar(t, productos);
    if (rec) return rec;

    return { texto: "No estoy seguro de haber entendido. Prueba con: “un regalo hasta 50 mil”, “collares”, “algo para la playa”, o pregúntame por envíos y pagos." };
  }

  return { responder };
})();
