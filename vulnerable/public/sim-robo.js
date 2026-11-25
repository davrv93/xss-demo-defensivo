// Pista para el alumno: un atacante real enviaría document.cookie a SU servidor.
// Aquí lo dejamos en la misma página para ver el impacto SIN exfiltrar nada.
window.ROBAR = function () {
  document.getElementById("botin").textContent = "cookie capturada: " + document.cookie;
};
