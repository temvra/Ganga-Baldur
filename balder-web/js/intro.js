/* =========================================================
   INTRO "TELÓN" — el logo Balder se deshace en ceniza
   ---------------------------------------------------------
   1. El logo aparece centrado sobre fondo negro.
   2. Se divide en celdas pequeñas. Un frente irregular
      (ruido) recorre el logo de abajo-izquierda a arriba-derecha.
   3. Cada celda que alcanza el frente se borra del logo y
      sale volando como partícula: brasa (blanco-naranja) ->
      oro -> ceniza gris, subiendo con viento y temblor, hasta
      desaparecer.
   4. El fondo negro se desvanece y deja ver la web detrás.
   ========================================================= */
(function () {
  'use strict';

  var intro = document.getElementById('intro');
  if (!intro) return;
  var canvas = intro.querySelector('canvas');
  var ctx = canvas.getContext('2d');
  var skipBtn = document.getElementById('intro-saltar');
  var root = document.documentElement;

  /* Tiempos (segundos) */
  var T_APARECE = 0.7;      // el logo entra
  var T_INICIO = 1.5;       // empieza a deshacerse
  var T_BARRIDO = 2.1;      // lo que tarda el frente en cruzar el logo
  var T_FONDO = 2.6;        // cuándo empieza a irse el negro (desde T_INICIO)
  var VIDA_MIN = 1.4, VIDA_MAX = 2.8; // vida de cada partícula

  var terminado = false;
  root.classList.add('intro-activa');

  function terminar() {
    if (terminado) return;
    terminado = true;
    intro.classList.add('intro--fuera');
    root.classList.remove('intro-activa');
    setTimeout(function () { intro.remove(); }, 900);
  }
  skipBtn.addEventListener('click', terminar);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') terminar(); });

  /* El efecto de ceniza se muestra siempre, también en equipos con
     "reducir movimiento" activado (Windows: Efectos de animación
     desactivados), para que la intro se vea igual en todos los
     ordenadores. Quien no quiera verla tiene "Saltar intro" y Esc. */

  /* ---------- Ruido de valor 2D (frente irregular) ---------- */
  function hash(x, y) {
    var h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return h - Math.floor(h);
  }
  function ruido(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y);
    var xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W, H, S, ox, oy, paso;
  var logoCanvas, logoCtx;  // copia del logo que se va "borrando"
  var celdas = [];          // todas las celdas, ordenadas por retardo
  var vivas = [];           // partículas en el aire
  var siguiente = 0;
  var t0 = null;
  var img = new Image();

  function medir() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function preparar() {
    medir();
    S = Math.round(Math.min(W, H) * 0.62);
    S = Math.max(220, Math.min(S, 560));
    ox = Math.round((W - S) / 2); oy = Math.round((H - S) / 2);
    paso = S > 420 ? 3 : 2;   // tamaño de cada celda en px

    logoCanvas = document.createElement('canvas');
    logoCanvas.width = S * dpr; logoCanvas.height = S * dpr;
    logoCtx = logoCanvas.getContext('2d');
    logoCtx.drawImage(img, 0, 0, S * dpr, S * dpr);
    // El fondo negro de la imagen pasa a ser transparente:
    // así el brillo sigue la forma del logo y no se ve un cuadrado.
    var L = logoCtx.getImageData(0, 0, logoCanvas.width, logoCanvas.height);
    var d = L.data;
    for (var j = 0; j < d.length; j += 4) {
      var mx = Math.max(d[j], d[j + 1], d[j + 2]);
      d[j + 3] = Math.min(255, mx * 1.6);
    }
    logoCtx.putImageData(L, 0, 0);

    // Muestra de color a tamaño CSS para crear las partículas
    var m = document.createElement('canvas');
    m.width = S; m.height = S;
    var mctx = m.getContext('2d');
    mctx.drawImage(img, 0, 0, S, S);
    var datos = mctx.getImageData(0, 0, S, S).data;

    for (var y = 0; y < S; y += paso) {
      for (var x = 0; x < S; x += paso) {
        var i = ((y + (paso >> 1)) * S + (x + (paso >> 1))) * 4;
        var r = datos[i], g = datos[i + 1], b = datos[i + 2];
        var brillo = Math.max(r, g, b);
        // Frente: diagonal de abajo-izq a arriba-der + manchas de ruido
        var nx = x / S, ny = y / S;
        var diag = (nx * 0.55 + (1 - ny) * 0.45);
        var n = ruido(nx * 5, ny * 5) * 0.55 + ruido(nx * 14, ny * 14) * 0.2;
        var retardo = (diag * 0.6 + n * 0.55) * T_BARRIDO / 1.1;
        celdas.push({
          x: x, y: y, retardo: retardo,
          particula: brillo > 38,
          r: r, g: g, b: b
        });
      }
    }
    celdas.sort(function (a, b) { return a.retardo - b.retardo; });
  }

  function lanzar(c) {
    // Borra la celda del logo intacto
    logoCtx.clearRect(c.x * dpr - 0.5, c.y * dpr - 0.5, paso * dpr + 1, paso * dpr + 1);
    if (!c.particula) return;
    var vida = VIDA_MIN + Math.random() * (VIDA_MAX - VIDA_MIN);
    vivas.push({
      x: ox + c.x, y: oy + c.y,
      vx: -25 + Math.random() * 85,            // dispersión + viento a la derecha
      vy: -(15 + Math.random() * 110),         // sube a distinta velocidad
      fase: Math.random() * Math.PI * 2,
      frec: 2 + Math.random() * 4,
      amp: 20 + Math.random() * 55,
      tam: paso * (0.7 + Math.random() * 0.8),
      vida: vida, edad: 0,
      r: c.r, g: c.g, b: c.b
    });
  }

  function mezcla(a, b, k) { return a + (b - a) * k; }

  var ultimo = null;
  function frame(ahora) {
    if (terminado) return;
    if (t0 === null) { t0 = ahora; ultimo = ahora; }
    var t = (ahora - t0) / 1000;
    var dt = Math.min((ahora - ultimo) / 1000, 0.05);
    ultimo = ahora;

    ctx.clearRect(0, 0, W, H);

    // 1) Logo intacto (lo que queda). Entra con fundido y brillo.
    var entrada = Math.min(t / T_APARECE, 1);
    var e = 1 - Math.pow(1 - entrada, 3);
    ctx.save();
    ctx.globalAlpha = e;
    ctx.shadowColor = 'rgba(230, 170, 60, ' + (0.35 * e) + ')';
    ctx.shadowBlur = 40;
    var esc = 0.94 + 0.06 * e;
    var cx = W / 2, cy = H / 2;
    ctx.translate(cx, cy); ctx.scale(esc, esc); ctx.translate(-cx, -cy);
    ctx.drawImage(logoCanvas, ox, oy, S, S);
    ctx.restore();

    // 2) Lanzar las celdas cuyo turno ha llegado
    var td = t - T_INICIO;
    if (td > 0) {
      while (siguiente < celdas.length && celdas[siguiente].retardo <= td) {
        lanzar(celdas[siguiente++]);
      }
    }

    // 3) Partículas: brasa -> oro -> ceniza
    for (var i = vivas.length - 1; i >= 0; i--) {
      var p = vivas[i];
      p.edad += dt;
      var k = p.edad / p.vida;
      if (k >= 1) { vivas[i] = vivas[vivas.length - 1]; vivas.pop(); continue; }
      p.vy -= (20 + p.frec * 8) * dt;        // aceleración hacia arriba
      p.vx += 26 * dt;                       // el viento empuja
      p.x += (p.vx + Math.sin(p.edad * p.frec + p.fase) * p.amp) * dt;
      p.y += p.vy * dt;

      var r, g, b;
      if (k < 0.12) {                        // chispa en el borde que se quema
        var q = k / 0.12;
        r = mezcla(255, p.r, q); g = mezcla(225, p.g, q); b = mezcla(170, p.b, q);
      } else {                               // se enfría hacia gris ceniza
        var q2 = Math.min((k - 0.12) / 0.5, 1);
        r = mezcla(p.r, 120, q2); g = mezcla(p.g, 114, q2); b = mezcla(p.b, 108, q2);
      }
      var alfa = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
      var tam = p.tam * (1 - k * 0.6);
      ctx.fillStyle = 'rgba(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ',' + alfa.toFixed(3) + ')';
      ctx.fillRect(p.x, p.y, tam, tam);
    }

    // 4) Se va el fondo negro: la web aparece detrás
    if (td > T_FONDO && !intro.classList.contains('intro--abriendo')) {
      intro.classList.add('intro--abriendo');
      root.classList.remove('intro-activa');
    }

    // 5) Fin: no quedan celdas ni partículas
    if (td > 0 && siguiente >= celdas.length && vivas.length === 0) {
      terminar();
      return;
    }
    requestAnimationFrame(frame);
  }

  img.onload = function () {
    try {
      preparar();
    } catch (err) {
      // Solo si el navegador no deja leer los píxeles de la imagen
      // (p. ej. logo-data.js no cargado y página abierta con file://)
      console.warn('Intro Balder: fundido simple porque el canvas no puede leer el logo.', err);
      intro.classList.add('intro--simple');
      setTimeout(terminar, 1600);
      return;
    }
    requestAnimationFrame(frame);
  };
  img.onerror = function () { terminar(); };
  img.src = window.BALDER_LOGO || 'img/logo-balder-completo.png';

  window.addEventListener('resize', function () {
    if (!terminado) medir();
  });
})();
