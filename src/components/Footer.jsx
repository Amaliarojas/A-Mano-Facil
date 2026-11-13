
function Footer() {
  return (
    <footer>
      <div className="wrap">
        © {new Date().getFullYear()}{" "}
        <a href="/admin.html">Administración</a>
      </div>
    </footer>
  );
}

export default Footer;
