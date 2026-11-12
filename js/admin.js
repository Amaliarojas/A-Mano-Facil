
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const MAX_FOTOS = 6;
  let fotos = []; // imágenes del producto que se está editando


  async function mostrar() {
    let ok = false;

    try {
      const respuesta = await fetch("http://localhost:3000/api/admin/sesion", {
        credentials: "include"
      });

      if (!respuesta.ok) {
        throw new Error("No se pudo verificar la sesión");
      }

      const estado = await respuesta.json();
      ok = estado.autenticado;

    } catch (error) {
      console.error(error);
      $("#loginAviso").className = "aviso err";
      $("#loginAviso").textContent = "No se pudo conectar con el servidor.";
    }

    $("#loginView").style.display = ok ? "none" : "block";
    $("#panelView").style.display = ok ? "block" : "none";
    $("#btnSalir").style.display = ok ? "inline-block" : "none";

    if (ok) {
      renderProductos();
      renderMensajes();
      renderFotos();
    }
  }

  // Iniciar sesión
  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const a = $("#loginAviso");
    a.className = "aviso";
    a.textContent = "Verificando acceso...";

    try {
      const respuesta = await fetch("http://localhost:3000/api/admin/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          usuario: $("#usr").value,
          clave: $("#pwd").value
        })
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.mensaje);
      }

      a.textContent = "";
      await mostrar();

    } catch (error) {
      a.className = "aviso err";
      a.textContent = error.message || "No se pudo iniciar sesión.";
    }
  });

  // Cerrar sesión
  $("#btnSalir").addEventListener("click", async () => {
    try {
      await fetch("http://localhost:3000/api/admin/logout", {
        method: "POST",
        credentials: "include"
      });

      await mostrar();

    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  });



  $$("[data-tab]").forEach((b) =>
    b.addEventListener("click", () => {
      $$("[data-tab]").forEach((x) => x.classList.toggle("active", x === b));
      $("#tab-prod").style.display = b.dataset.tab === "prod" ? "grid" : "none";
      $("#tab-msg").style.display = b.dataset.tab === "msg" ? "block" : "none";
    })
  );

  /* ---------- Fotografías ---------- */
  const form = $("#formProd");
  function avisoForm(msg, tipo) { const a = $("#formAviso"); a.className = "aviso " + (tipo || ""); a.textContent = msg || ""; }

  function renderFotos() {
    $("#cuentaFotos").textContent = `(${fotos.length} de ${MAX_FOTOS})`;
    $("#previews").innerHTML = fotos
      .map(
        (s, i) => `<div class="prev"><img src="${escapeHTML(s)}" alt="Fotografía ${i + 1}">
          ${i === 0 ? '<span class="portada">Portada</span>' : ""}
          <div class="prev-acc">${i > 0 ? `<button type="button" data-cover="${i}">Portada</button>` : ""}<button type="button" data-rm="${i}">Quitar</button></div></div>`
      )
      .join("");
    $$("[data-cover]").forEach((b) => b.addEventListener("click", () => { const [f] = fotos.splice(Number(b.dataset.cover), 1); fotos.unshift(f); renderFotos(); }));
    $$("[data-rm]").forEach((b) => b.addEventListener("click", () => { fotos.splice(Number(b.dataset.rm), 1); renderFotos(); }));
  }

  async function agregarArchivos(files) {
    avisoForm("");
    const lista = [...files];
    const libre = MAX_FOTOS - fotos.length;
    if (!libre) return avisoForm(`Máximo ${MAX_FOTOS} fotografías por producto.`, "err");
    if (lista.length > libre) avisoForm(`Solo caben ${libre} más; se agregaron las primeras.`, "err");
    for (const f of lista.slice(0, libre)) {
      try { fotos.push(await procesarImagen(f)); }
      catch (e) { avisoForm(`${f.name}: ${e.message}`, "err"); }
    }
    renderFotos();
  }

  const drop = $("#drop"), input = $("#fileInput");
  drop.addEventListener("click", () => input.click());
  drop.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } });
  input.addEventListener("change", () => { agregarArchivos(input.files); input.value = ""; });
  ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", (e) => agregarArchivos(e.dataTransfer.files));

  $("#btnUrl").addEventListener("click", () => {
    const v = $("#urlFoto").value.trim();
    if (!v) return;
    if (fotos.length >= MAX_FOTOS) return avisoForm(`Máximo ${MAX_FOTOS} fotografías por producto.`, "err");
    fotos.push(v);
    $("#urlFoto").value = "";
    renderFotos();
  });

  /* ---------- Productos ---------- */
  function renderProductos() {
    const lista = Store.getProducts();
    $("#listaCats").innerHTML = [...new Set(lista.map((p) => p.categoria))].map((c) => `<option value="${escapeHTML(c)}">`).join("");
    $("#tbody").innerHTML = lista
      .map(
        (p) => `<tr>
        <td><img src="${escapeHTML(Store.imagenes(p)[0])}" alt=""></td>
        <td><b>${escapeHTML(p.nombre)}</b><br><small class="nota">${escapeHTML(p.categoria)} · ${p.imagenes.length} foto(s)</small></td>
        <td>${formatCOP(p.precio)}</td>
        <td style="white-space:nowrap"><button class="btn btn-sm btn-ghost" data-edit="${p.id}">Editar</button>
            <button class="btn btn-sm btn-danger" data-del="${p.id}">Borrar</button></td></tr>`
      )
      .join("");
    $$("[data-edit]").forEach((b) => b.addEventListener("click", () => editar(b.dataset.edit)));
    $$("[data-del]").forEach((b) => b.addEventListener("click", () => borrar(b.dataset.del)));
  }

  function limpiar() {
    form.reset();
    form.pid.value = "";
    fotos = [];
    renderFotos();
    avisoForm("");
    $("#formTitulo").textContent = "Nuevo producto";
    $("#btnCancelar").style.display = "none";
  }

  function editar(id) {
    const p = Store.getProducts().find((x) => String(x.id) === String(id));
    if (!p) return;
    form.pid.value = p.id;
    form.nombre.value = p.nombre;
    form.categoria.value = p.categoria;
    form.precio.value = p.precio;
    form.descripcion.value = p.descripcion;
    form.detalles.value = p.detalles || "";
    form.tags.value = (p.tags || []).join(", ");
    fotos = p.imagenes.slice();
    renderFotos();
    avisoForm("");
    $("#formTitulo").textContent = "Editar producto";
    $("#btnCancelar").style.display = "inline-block";
    form.scrollIntoView({ behavior: "smooth" });
  }

  function borrar(id) {
    if (!confirm("¿Borrar este producto?")) return;
    Store.saveProducts(Store.getProducts().filter((p) => String(p.id) !== String(id)));
    renderProductos();
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const lista = Store.getProducts();
    const datos = {
      nombre: form.nombre.value.trim(),
      categoria: form.categoria.value.trim(),
      precio: Math.max(0, Number(form.precio.value) || 0),
      descripcion: form.descripcion.value.trim(),
      detalles: form.detalles.value.trim(),
      tags: form.tags.value.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
      imagenes: fotos.slice(),
    };
    if (form.pid.value) {
      const i = lista.findIndex((p) => String(p.id) === form.pid.value);
      if (i >= 0) lista[i] = { ...lista[i], ...datos };
    } else {
      lista.push({ id: Date.now(), ...datos });
    }
    if (!Store.saveProducts(lista)) {
      return avisoForm("No se pudo guardar: el almacenamiento del navegador está lleno. Quita fotos, o usa rutas de la carpeta img/ en lugar de subir archivos.", "err");
    }
    limpiar();
    avisoForm("Producto guardado.", "ok");
    renderProductos();
  });
  $("#btnCancelar").addEventListener("click", limpiar);
  $("#btnReset").addEventListener("click", () => {
    if (confirm("Se perderán tus cambios y volverá el catálogo inicial. ¿Seguro?")) { Store.resetProducts(); limpiar(); renderProductos(); }
  });

  /* ---------- Exportar para publicar ---------- */
  $("#btnExport").addEventListener("click", () => {
    const txt = `/* Generado desde el panel admin. Reemplaza js/productos.js con este archivo y haz commit + push. */\nconst DEFAULT_PRODUCTS = ${JSON.stringify(Store.getProducts(), null, 2)};\n`;
    const blob = new Blob([txt], { type: "text/javascript" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "productos.js";
    a.click();
    URL.revokeObjectURL(a.href);
    const kb = Math.round(blob.size / 1024);
    const av = $("#exportAviso");
    av.className = "aviso " + (kb > 2500 ? "err" : "ok");
    av.textContent = kb > 2500
      ? `Archivo de ${kb} KB: es pesado. Para una página más rápida, guarda las fotos en la carpeta img/productos/ y usa rutas en lugar de subir archivos.`
      : `Descargado productos.js (${kb} KB). Reemplaza js/productos.js y súbelo a GitHub.`;
  });
  
  /* ---------- Solicitudes ---------- */
  async function renderMensajes() {
    const contenedor = $("#listaMsg");

    contenedor.innerHTML = `<p class="nota">Cargando solicitudes...</p>`;

    try {
      const respuesta = await fetch("http://localhost:3000/api/solicitudes", {
    credentials: "include"
     });

      if (!respuesta.ok) {
        throw new Error("No se pudieron consultar las solicitudes");
      }

      const lista = await respuesta.json();

      $("#cntMsg").textContent = lista.length ? `(${lista.length})` : "";

      contenedor.innerHTML = lista.length
        ? lista.map((m) => `
            <div class="msg-card">
              <b>${escapeHTML(m.nombre)}</b> ·
              <a href="mailto:${escapeHTML(m.email)}" style="border-bottom:1px solid var(--gold)">
                ${escapeHTML(m.email)}
              </a>
              <br>
              <small>
                ${new Date(m.fecha).toLocaleString("es-CO")}
                · Producto: ${escapeHTML(m.producto || "General")}
              </small>
              <p style="margin:.6rem 0">${escapeHTML(m.mensaje)}</p>
            </div>
          `).join("")
        : `<p class="nota" style="margin-bottom:1rem">Aún no hay solicitudes.</p>`;

    } catch (error) {
      console.error("Error al cargar solicitudes:", error);

      $("#cntMsg").textContent = "";

      contenedor.innerHTML = `
        <p class="nota">
          No se pudieron cargar las solicitudes. Comprueba que el servidor esté funcionando.
        </p>
      `;
    }
  }

})();
