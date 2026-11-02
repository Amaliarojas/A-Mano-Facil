# Brisa Store · Catálogo web (Proyecto final · Mi emprendimiento digital)

Sitio estático (HTML + CSS + JavaScript) listo para **GitHub Pages**.
Tipografía **Latin Modern** (la fuente de LaTeX) incluida en `fonts/`, sin depender de internet.

## Cumplimiento de la rúbrica

| # | Requisito | Dónde está |
|---|-----------|-----------|
| 01 | Landing / inicio | `index.html`: portada, "Quiénes somos" y navegación |
| 02 | Catálogo con detalles claros | Sección Catálogo: filtros, búsqueda, orden, precio máximo; al hacer clic se abre la vista de producto con galería de fotografías |
| 03 | Contacto real | Formulario validado: registra la solicitud y, con Formspree, llega por correo; botón de WhatsApp |
| 04 | Panel admin | `admin.html`: login, crear/editar/borrar productos, subir fotografías, ver solicitudes |
| 05 | IA aplicada | Asistente recomendador (`js/chatbot.js`): sugiere piezas por presupuesto, ocasión y categoría, y responde preguntas frecuentes |
| 06 | Publicación | GitHub Pages (pasos abajo) |
| — | Responsive | CSS mobile-first, menú móvil, filtros en horizontal en pantallas pequeñas |
| — | Animaciones | Aparición al hacer scroll, zoom en fotografías, transiciones (CSS puro, sin librerías) |

## Personalizar

1. `js/config.js`: nombre, lema, descripción, WhatsApp, correo y credenciales del admin (por defecto `admin` / `admin123`; cámbialas).
2. `js/productos.js`: productos publicados.
3. `css/styles.css`: colores en las variables de `:root` (`--green`, `--gold`, `--paper`...).

## Fotografías de los productos

Hay dos formas de agregarlas desde el panel admin (`admin.html`):

- **Subir archivos** (arrastrar o clic): se reducen a 900 px y se guardan en tu navegador. Máximo 6 por producto.
- **Ruta o URL**: pon las fotos en `img/productos/` (por ejemplo `img/productos/manilla-olas-1.jpg`) y escribe esa ruta. Es la opción más liviana y la recomendada para publicar.

La primera fotografía es la portada. El botón "Portada" cambia el orden.

### Cómo hacer que los visitantes vean tus cambios

Lo que haces en el admin se guarda **solo en tu navegador**. Para publicarlo:

1. En el admin pulsa **Descargar productos.js**.
2. Reemplaza `js/productos.js` del proyecto con ese archivo.
3. Si usaste rutas, asegúrate de que las fotos estén en `img/productos/`.
4. `git add .`, `git commit -m "feat: actualizar catálogo"`, `git push`.

## Contacto con correo real (Formspree, gratis)

1. Crea un formulario en https://formspree.io
2. Copia el ID (lo que va después de `/f/`) en `formspreeId`, dentro de `js/config.js`.

## Publicar en GitHub Pages

```bash
git init
git add .
git commit -m "feat: estructura inicial del proyecto"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```
Luego: **Settings → Pages → Source: Deploy from a branch → main / (root)**.
Tu sitio quedará en `https://TU_USUARIO.github.io/TU_REPO/`.

## Plan de 15 commits (mínimo exigido)

1. `feat: estructura inicial y README`
2. `feat: config.js con datos de la marca`
3. `feat: tipografía Latin Modern y variables de color`
4. `feat: navegación y menú responsive`
5. `feat: portada (hero)`
6. `feat: sección quiénes somos`
7. `feat: datos de productos y almacenamiento`
8. `feat: render del catálogo`
9. `feat: filtros, búsqueda y orden`
10. `feat: vista de producto con galería`
11. `feat: formulario de contacto con validación`
12. `feat: login del panel admin`
13. `feat: CRUD de productos y subida de fotografías`
14. `feat: asistente IA recomendador`
15. `style: animaciones y ajustes responsive`
16. `docs: README final y despliegue`

## Para la defensa (todos los integrantes deben poder explicarlo)

- **Frontend:** HTML da la estructura, CSS los estilos y el responsive, JS renderiza el catálogo, la galería y los eventos.
- **Datos:** `js/productos.js` (publicados) y `localStorage` (cambios del admin y solicitudes). No hay servidor.
- **Backend / autenticación:** en esta versión el login es del lado del cliente; en un proyecto real se reemplaza por una API (Node/Express + base de datos). Prepárate para explicar esta limitación.
- **IA:** reglas y puntaje de coincidencias sobre el catálogo; se puede evolucionar a un modelo de lenguaje llamándolo desde un backend para no exponer claves.
