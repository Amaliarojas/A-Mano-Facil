
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  let productos = Store.getProducts();
  const state = { cat: "Todas", q: "", orden: "destacados", max: Infinity };
  let galIr = null; // función de la galería abierta
  const buscar = (id) => productos.find((p) => String(p.id) === String(id));



  /* ---------- Marca ---------- */
  function aplicarMarca() {
    document.title = `${CONFIG.marca} | Catálogo`;
    $$("[data-marca]").forEach((el) => (el.textContent = CONFIG.marca));
    $$("[data-lema]").forEach((el) => (el.textContent = CONFIG.lema));
    $$("[data-descripcion]").forEach((el) => (el.textContent = CONFIG.descripcion));
    $$("[data-email]").forEach((el) => (el.textContent = CONFIG.email));
    $("#waLink").href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent("Hola, quiero más información")}`;
    $("#anio").textContent = new Date().getFullYear();
  }

  function heroArt() {
    const p = productos.find((x) => x.imagenes.length);
    const art = $("#heroArt");
    if (p) {
      art.innerHTML = `<img src="${escapeHTML(p.imagenes[0])}" alt="${escapeHTML(p.nombre)}" data-pid="${p.id}">`;
      $("#heroCap").textContent = `Figura 1. ${p.nombre}.`;
    } else {
      art.innerHTML = `<span class="inicial">${escapeHTML(CONFIG.marca.charAt(0))}</span>`;
      $("#heroCap").textContent = `Figura 1. Colección artesanal ${new Date().getFullYear()}.`;
    }
    fallbackImgs(art);
  }


  /* ---------- Menú móvil ---------- */
  $("#menuBtn").addEventListener("click", (e) => {
    const abierto = $("#menu").classList.toggle("open");
    e.currentTarget.classList.toggle("open", abierto);
    e.currentTarget.setAttribute("aria-expanded", abierto);
  });
  $$("#menu a").forEach((a) => a.addEventListener("click", () => { $("#menu").classList.remove("open"); $("#menuBtn").classList.remove("open"); }));

  /* ---------- Imágenes: si una ruta falla, se usa la provisional ---------- */
  function fallbackImgs(root) {
    $$("img[data-pid]", root).forEach((img) =>
      img.addEventListener("error", () => {
        const p = buscar(img.dataset.pid);
        if (p && !img.dataset.fb) { img.dataset.fb = "1"; img.src = Store.placeholder(p); }
      })
    );
  }



  /* ---------- Catálogo ---------- */
  function cardHTML(p) {
    const im = Store.imagenes(p);
    return `<article class="item" tabindex="0" role="button" data-id="${p.id}" aria-label="Ver ${escapeHTML(p.nombre)}">
      <div class="item-media">
        <img class="a" src="${escapeHTML(im[0])}" alt="${escapeHTML(p.nombre)}" data-pid="${p.id}" loading="lazy">
        ${p.imagenes.length > 1 ? `<img class="b" src="${escapeHTML(im[1])}" alt="" data-pid="${p.id}" loading="lazy">` : ""}
      </div>
      <div class="item-info">
        <span class="cap">${escapeHTML(p.categoria)}</span>
        <h3>${escapeHTML(p.nombre)}</h3>
        <span class="precio">${formatCOP(p.precio)}</span>
        <span class="ver">Ver detalle →</span>
      </div></article>`;
  }

  function bindCards(root) {
    $$(".item", root).forEach((c) => {
      const abrir = () => abrirDetalle(c.dataset.id);
      c.addEventListener("click", abrir);
      c.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrir(); } });
    });
    fallbackImgs(root);
  }

  function renderFiltros() {
    const cats = ["Todas", ...new Set(productos.map((p) => p.categoria))];
    const cuenta = (c) => (c === "Todas" ? productos.length : productos.filter((p) => p.categoria === c).length);
    $("#cats").innerHTML = cats
      .map((c) => `<li><button class="${c === state.cat ? "active" : ""}" data-cat="${escapeHTML(c)}"><span>${escapeHTML(c)}</span><span class="n">${cuenta(c)}</span></button></li>`)
      .join("");
    $$("#cats button").forEach((b) => b.addEventListener("click", () => { state.cat = b.dataset.cat; renderFiltros(); renderProductos(); }));

    const precios = productos.map((p) => p.precio);
    const tope = precios.length ? Math.ceil(Math.max(...precios) / 5000) * 5000 : 100000;
    const r = $("#rango");
    r.min = 0; r.max = tope; r.step = 5000;
    if (state.max === Infinity || state.max > tope) r.value = tope;
    $("#rangoVal").textContent = `Hasta ${formatCOP(Number(r.value))}`;
  }

  function renderProductos() {
    const q = state.q.trim().toLowerCase();
    let lista = productos.filter(
      (p) =>
        (state.cat === "Todas" || p.categoria === state.cat) &&
        p.precio <= state.max &&
        (!q || (p.nombre + " " + p.descripcion + " " + p.categoria).toLowerCase().includes(q))
    );
    if (state.orden === "menor") lista.sort((a, b) => a.precio - b.precio);
    if (state.orden === "mayor") lista.sort((a, b) => b.precio - a.precio);
    if (state.orden === "nombre") lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

    $("#conteo").textContent = `${lista.length} ${lista.length === 1 ? "pieza" : "piezas"}`;
    const cont = $("#productos");
    cont.innerHTML = lista.length ? lista.map(cardHTML).join("") : `<p class="vacio">No encontramos piezas con esos filtros.</p>`;
    bindCards(cont);
  }

  function llenarSelect() {
    const sel = $("#selProducto");
    sel.innerHTML = `<option value="">General</option>` + productos.map((p) => `<option value="${escapeHTML(p.nombre)}">${escapeHTML(p.nombre)}</option>`).join("");
  }

  $("#buscador").addEventListener("input", (e) => { state.q = e.target.value; renderProductos(); });
  $("#orden").addEventListener("change", (e) => { state.orden = e.target.value; renderProductos(); });
  $("#rango").addEventListener("input", (e) => {
    const v = Number(e.target.value);
    state.max = v >= Number(e.target.max) ? Infinity : v;
    $("#rangoVal").textContent = `Hasta ${formatCOP(v)}`;
    renderProductos();
  });



  /* ---------- Vista de producto con galería ---------- */
  function abrirDetalle(id) {
    const p = buscar(id);
    if (!p) return;
    const imgs = Store.imagenes(p);
    const hayFotos = p.imagenes.length > 0;
    const rel = productos
      .filter((x) => x.id !== p.id)
      .sort((a, b) => (b.categoria === p.categoria) - (a.categoria === p.categoria))
      .slice(0, 3);

    $("#detBody").innerHTML = `
      <div class="det-grid">
        <div class="galeria">
          <div class="gal-main" id="galMain">
            <img id="galImg" src="${escapeHTML(imgs[0])}" alt="${escapeHTML(p.nombre)}" data-pid="${p.id}" draggable="false">
            ${imgs.length > 1 ? `<button class="flecha izq" id="galPrev" aria-label="Fotografía anterior">←</button><button class="flecha der" id="galNext" aria-label="Fotografía siguiente">→</button>` : ""}
            ${hayFotos ? `<span class="contador" id="galCont">1 / ${imgs.length}</span>` : ""}
          </div>
          ${imgs.length > 1 ? `<div class="thumbs" id="thumbs">${imgs.map((s, k) => `<button class="${k ? "" : "on"}" data-k="${k}" aria-label="Ver fotografía ${k + 1}"><img src="${escapeHTML(s)}" alt="" data-pid="${p.id}"></button>`).join("")}</div>` : ""}
          ${hayFotos ? "" : `<p class="sin-foto">Aún no hay fotografías de esta pieza.</p>`}
        </div>
        <div class="ficha-prod">
          <span class="cap">${escapeHTML(p.categoria)}</span>
          <h2>${escapeHTML(p.nombre)}</h2>
          <div class="precio-gr">${formatCOP(p.precio)}</div>
          <p class="desc">${escapeHTML(p.descripcion)}</p>
          <dl class="datos">
            ${p.detalles ? `<dt>Detalles</dt><dd>${escapeHTML(p.detalles)}</dd>` : ""}
            <dt>Categoría</dt><dd>${escapeHTML(p.categoria)}</dd>
            ${p.tags.length ? `<dt>Etiquetas</dt><dd>${p.tags.map(escapeHTML).join(", ")}</dd>` : ""}
          </dl>
          <div class="acciones">
            <button class="btn" id="dSolicitar">Solicitar esta pieza</button>
            <a class="btn btn-ghost" target="_blank" rel="noopener" href="https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent("Hola, me interesa: " + p.nombre)}">WhatsApp</a>
          </div>
        </div>
      </div>
      ${rel.length ? `<div class="relacionados"><span class="cap">También te puede interesar</span><div class="items mini" id="relGrid">${rel.map(cardHTML).join("")}</div></div>` : ""}`;

    // Galería
    let k = 0;
    const main = $("#galMain"), img = $("#galImg");
    galIr = (n) => {
      k = (n + imgs.length) % imgs.length;
      img.src = imgs[k];
      main.classList.remove("zoom");
      img.style.transformOrigin = "center";
      const c = $("#galCont"); if (c) c.textContent = `${k + 1} / ${imgs.length}`;
      $$("#thumbs button").forEach((b, i) => b.classList.toggle("on", i === k));
    };
    if (imgs.length > 1) {
      $("#galPrev").addEventListener("click", () => galIr(k - 1));
      $("#galNext").addEventListener("click", () => galIr(k + 1));
      $$("#thumbs button").forEach((b) => b.addEventListener("click", () => galIr(Number(b.dataset.k))));
      let x0 = null;
      main.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
      main.addEventListener("touchend", (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 45) galIr(k + (dx < 0 ? 1 : -1)); x0 = null; });
    }
    main.addEventListener("click", (e) => { if (!e.target.closest(".flecha")) main.classList.toggle("zoom"); });
    main.addEventListener("mousemove", (e) => {
      if (!main.classList.contains("zoom")) return;
      const r = main.getBoundingClientRect();
      img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
    });

    $("#dSolicitar").addEventListener("click", () => solicitar(p));
    fallbackImgs($("#detBody"));
    const rg = $("#relGrid"); if (rg) bindCards(rg);

    const d = $("#detalle");
    d.classList.add("open");
    d.setAttribute("aria-hidden", "false");
    d.scrollTop = 0;
    document.body.style.overflow = "hidden";
    $("#detVolver").focus({ preventScroll: true });
  }

  function cerrarDetalle() {
    const d = $("#detalle");
    d.classList.remove("open");
    d.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    galIr = null;
  }
  $("#detVolver").addEventListener("click", cerrarDetalle);
  $("#detCerrar").addEventListener("click", cerrarDetalle);
  document.addEventListener("keydown", (e) => {
    if (!$("#detalle").classList.contains("open")) return;
    if (e.key === "Escape") cerrarDetalle();
    if (e.key === "ArrowRight" && galIr) { const n = $("#galNext"); if (n) n.click(); }
    if (e.key === "ArrowLeft" && galIr) { const n = $("#galPrev"); if (n) n.click(); }
  });

  function solicitar(p) {
    cerrarDetalle();
    $("#selProducto").value = p.nombre;
    const m = $("#formContacto [name=mensaje]");
    if (!m.value.trim()) m.value = `Hola, me interesa la pieza "${p.nombre}".`;
    $("#contacto").scrollIntoView({ behavior: "smooth" });
  }



  /* ---------- Formulario de contacto ---------- */
  function aviso(msg, tipo) { const a = $("#aviso"); a.className = "aviso " + tipo; a.textContent = msg; }

  $("#formContacto").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    const data = { nombre: f.nombre.value.trim(), email: f.email.value.trim(), producto: f.producto.value, mensaje: f.mensaje.value.trim() };
    if (data.nombre.length < 2) return aviso("Escribe tu nombre.", "err");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return aviso("Escribe un correo válido.", "err");
    if (data.mensaje.length < 5) return aviso("Cuéntanos un poco más en el mensaje.", "err");

    const btn = f.querySelector("button[type=submit]");
    btn.disabled = true;
    Store.addMessage(data); // se registra siempre (lo ve el panel admin en este navegador)
    try {
      if (CONFIG.formspreeId) {
        const r = await fetch(`https://formspree.io/f/${CONFIG.formspreeId}`, {
          method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data),
        });
        if (!r.ok) throw new Error("formspree");
      }
      aviso("Gracias. Recibimos tu solicitud y te responderemos pronto.", "ok");
      f.reset();
    } catch (err) {
      aviso("Guardamos tu solicitud, pero no se pudo enviar el correo. Escríbenos por WhatsApp.", "err");
    } finally { btn.disabled = false; }
  });


  /* ---------- Animación de entrada ---------- */
  let io;
  function observarReveal() {
    if (!("IntersectionObserver" in window)) { $$(".reveal").forEach((el) => el.classList.add("visible")); return; }
    io = io || new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("visible"); io.unobserve(en.target); } }), { threshold: 0.1 });
    $$(".reveal:not(.visible)").forEach((el) => io.observe(el));
  }


  /* ---------- Asistente ---------- */
  let chatIniciado = false;
  function iniciarChat() {
    const msgs = $("#chatMsgs");
    const add = (html, tipo) => {
      const d = document.createElement("div");
      d.className = "msg " + tipo;
      d.innerHTML = html;
      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;
      $$(".sug", d).forEach((s) => s.addEventListener("click", () => abrirDetalle(s.dataset.id)));
    };
    add(`Hola, soy el asistente de ${escapeHTML(CONFIG.marca)}. Dime qué buscas, para quién es o tu presupuesto, y te recomiendo piezas.`, "bot");

    const quick = ["Un suplemento para mí", "Horario de atención", "Algo para la digestión", "¿Hacen envíos?"];
    $("#chatQuick").innerHTML = quick.map((q) => `<button type="button">${q}</button>`).join("");
    $$("#chatQuick button").forEach((b) => b.addEventListener("click", () => enviar(b.textContent)));

    function enviar(texto) {
      if (!texto.trim()) return;
      add(escapeHTML(texto), "user");
      const r = Asistente.responder(texto, productos);
      setTimeout(() => {
        let html = escapeHTML(r.texto);
        if (r.productos && r.productos.length)
          html += r.productos.map((p) => `<span class="sug" data-id="${p.id}">${escapeHTML(p.nombre)} · ${formatCOP(p.precio)}</span>`).join("");
        add(html, "bot");
      }, 300);
    }
    $("#chatForm").addEventListener("submit", (e) => { e.preventDefault(); const i = $("#chatInput"); enviar(i.value); i.value = ""; });
  }
  $("#chatFab").addEventListener("click", () => {
    $("#chat").classList.toggle("open");
    if (!chatIniciado) { iniciarChat(); chatIniciado = true; }
  });
  $("#chatClose").addEventListener("click", () => $("#chat").classList.remove("open"));

  /* ---------- Inicio ---------- */
  aplicarMarca();
  heroArt();
  llenarSelect();
  renderFiltros();
  renderProductos();
  observarReveal();
})();
