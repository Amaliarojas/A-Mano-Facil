
import { useState } from "react";

function Header() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  function cerrarMenu() {
    setMenuAbierto(false);
  }

  return (
    <>
      <div className="topbar">
        <div className="wrap">
          <span>"Amanofacilito"</span>
          <span className="sep">Bienestar y cuidado personal</span>
        </div>
      </div>

      <header className="nav">
        <div className="wrap">
          <a href="#inicio" className="logo" onClick={cerrarMenu}>
            Amanofacilito
          </a>

          <button
            type="button"
            className={`menu-btn ${menuAbierto ? "open" : ""}`}
            id="menuBtn"
            aria-label="Abrir o cerrar menú"
            aria-expanded={menuAbierto}
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <nav className="nav-menu">
            <ul id="menu" className={menuAbierto ? "open" : ""}>
              <li><a href="#inicio" onClick={cerrarMenu}>Inicio</a></li>
              <li><a href="#nosotros" onClick={cerrarMenu}>Nosotros</a></li>
              <li><a href="#catalogo" onClick={cerrarMenu}>Catálogo</a></li>
              <li><a href="#contacto" onClick={cerrarMenu}>Contacto</a></li>
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}

export default Header;
