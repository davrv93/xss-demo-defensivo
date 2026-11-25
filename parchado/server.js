// ✅ MISMO guestbook que vulnerable/, ahora protegido. Compara ambos server.js lado a lado.
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.urlencoded({ extended: false }));

// ✅ DEFENSA 4: cookie HttpOnly (el JS del navegador NO puede leerla) + SameSite.
app.use((req, res, next) => {
  if (!req.headers.cookie || !/sesion=/.test(req.headers.cookie)) {
    res.setHeader("Set-Cookie", "sesion=demo-token-12345; Path=/; HttpOnly; SameSite=Strict");
  }
  next();
});

// ✅ DEFENSA 3: CSP. Sin 'unsafe-inline' => el navegador NO ejecuta <script> inyectado
// ni atributos onerror/onclick. Solo corre JS servido desde nuestro propio origen.
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'"
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});

const comentarios = [{ autor: "Ana", texto: "¡Buen taller!" }];

// ✅ DEFENSA 1: codificación de salida. Escapa los 5 caracteres peligrosos ANTES de meter
// cualquier dato del usuario en el HTML. Es la defensa principal contra XSS.
function escaparHTML(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
// Nota: NO intentes filtrar XSS con un regex que "quite <script>". Siempre hay bypass
// (<scr<script>ipt>, onerror, svg, etc.). Escapa la salida, o sanitiza con una librería
// mantenida (p.ej. DOMPurify) si de verdad necesitas permitir HTML con formato.

app.post("/comentar", (req, res) => {
  const autor = (req.body.autor || "anónimo").slice(0, 60);
  const texto = (req.body.texto || "").slice(0, 2000);
  comentarios.push({ autor, texto }); // se guarda crudo; se escapa SIEMPRE al renderizar.
  res.redirect("/");
});

app.get("/", (req, res) => {
  const q = req.query.q || "";
  const filas = comentarios
    .map((c) => `<li><b>${escaparHTML(c.autor)}:</b> ${escaparHTML(c.texto)}</li>`)
    .join("\n");

  res.send(`<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<title>Libro de visitas (PARCHADO)</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/estilo.css"></head>
<body>
<div class="aviso ok">✅ Versión PARCHADA · XSS bloqueado</div>
<h1>Libro de visitas</h1>
<p class="buscar">Buscaste: ${escaparHTML(q)}</p>
<form method="post" action="/comentar">
  <input name="autor" placeholder="Tu nombre" maxlength="60">
  <textarea name="texto" placeholder="Tu comentario" maxlength="2000"></textarea>
  <button type="submit">Publicar</button>
</form>
<ul id="muro">
${filas}
</ul>
<h3>Botín del atacante:</h3>
<div id="botin">— (la cookie es HttpOnly: el JS no la ve)</div>
</body></html>`);
});

app.use(express.static(__dirname + "/public"));
app.listen(PORT, "127.0.0.1", () =>
  console.log("PARCHADO en http://127.0.0.1:" + PORT)
);
