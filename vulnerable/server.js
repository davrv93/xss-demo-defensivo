// ⚠️ APP DELIBERADAMENTE VULNERABLE A XSS — solo para el laboratorio, en 127.0.0.1.
// NO uses este patrón en producción. El objetivo es verlo fallar para aprender a parcharlo.
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));

// Cookie de demo SIN HttpOnly a propósito: así el JS inyectado puede leerla (robo simulado).
app.use((req, res, next) => {
  if (!req.headers.cookie || !/sesion=/.test(req.headers.cookie)) {
    res.setHeader("Set-Cookie", "sesion=demo-token-12345; Path=/; SameSite=Lax");
  }
  next();
});

// Almacén en memoria (se reinicia al reiniciar el server). Sin base de datos.
const comentarios = [
  { autor: "Ana", texto: "¡Buen taller!" },
];

app.post("/comentar", (req, res) => {
  const autor = (req.body.autor || "anónimo").slice(0, 60);
  const texto = (req.body.texto || "").slice(0, 2000);
  // ❌ VULNERABLE: se guarda el texto crudo, sin sanitizar.
  comentarios.push({ autor, texto });
  res.redirect("/");
});

app.get("/", (req, res) => {
  const q = req.query.q || "";
  // ❌ VULNERABLE (XSS reflejado): el parámetro ?q= se mete crudo en el HTML.
  // ❌ VULNERABLE (XSS almacenado): cada comentario se mete crudo en el HTML.
  const filas = comentarios
    .map((c) => `<li><b>${c.autor}:</b> ${c.texto}</li>`)
    .join("\n");

  res.send(`<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<title>Libro de visitas (VULNERABLE)</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/estilo.css"></head>
<body>
<div class="aviso">⚠️ Versión VULNERABLE · solo laboratorio en 127.0.0.1</div>
<h1>Libro de visitas</h1>
<p class="buscar">Buscaste: ${q}</p>
<form method="post" action="/comentar">
  <input name="autor" placeholder="Tu nombre" maxlength="60">
  <textarea name="texto" placeholder="Tu comentario" maxlength="2000"></textarea>
  <button type="submit">Publicar</button>
</form>
<ul id="muro">
${filas}
</ul>
<h3>Botín del atacante (robo de cookie SIMULADO, no sale a internet):</h3>
<div id="botin">—</div>
<script src="/sim-robo.js"></script>
</body></html>`);
});

app.use(express.static(__dirname + "/public"));
app.listen(PORT, "127.0.0.1", () =>
  console.log("VULNERABLE en http://127.0.0.1:" + PORT)
);
