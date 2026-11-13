import { CONFIG } from "../data/config/tienda.js";

function About() {
  return (
    <section className="sec alt" id="nosotros">
      <div className="wrap">
        <h2 className="sec-title">
          Quiénes somos
            </h2>
        <div className="nosotros reveal">
          <p>{CONFIG.descripcion}</p>
        </div>

        <ol className="enum">
          <li>Productos seleccionados para tu bienestar.</li>
          <li>Atención cercana y personalizada.</li>
          <li>Alternativas para acompañar tu cuidado diario.</li>
        </ol>
      </div>
    </section>
  );
}

export default About;
