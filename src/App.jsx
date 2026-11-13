import Header from "./components/Header";
import Hero from "./components/Hero";
import About from "./components/About";
import Catalog from "./components/Catalog";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

function App() {
  return (
    <>
      <Header />

      <main>
        <Hero />
        <About />
        <Catalog />
        <Contact />
      </main>

      <Footer />

    </>
  );
}

export default App;
