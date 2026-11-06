/* =========================================================
   BALDER — Animaciones de las acciones
   1. Aparición al hacer scroll (IntersectionObserver)
   2. Cabecera compacta, sección activa del menú y "volver arriba"
   3. Indicador deslizante de las pestañas
   4. Avisos (toasts)
   5. "Vuela al carrito" + rebote del contador
   6. Chispas doradas (canvas), mismo lenguaje que la intro de ceniza
   7. Contador animado del total, sacudida de error, destello
   8. Inclinación 3D de las tarjetas de socio
   Escucha los eventos "balder:*" que lanza js/main.js.
   ========================================================= */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var on = function (ev, fn) { document.addEventListener('balder:' + ev, function (e) { fn(e.detail || {}); }); };

  /* ---------- 1. Aparición al hacer scroll ----------
     Cada bloque entra desde abajo con un pequeño retraso según su
     posición entre sus hermanos (--i), para que las rejillas "caigan" en cascada. */
  var GRUPOS = ['.seccion__cabeza', '.portada__texto > *', '.modelo', '.estilo', '.tarjeta-explicar', '.producto',
    '.plan', '.carta > li', '.lista-filas > *', '.caja', '.horario > div', '.visita__datos > *', '.productos__linea', '.app__movil'];
  var observador = 'IntersectionObserver' in window ? new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('visible'); observador.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }) : null;
  function prepararAparicion() {
    if (!observador) return;
    GRUPOS.forEach(function (sel) {
      $$(sel).forEach(function (el) {
        if (el.classList.contains('revelar')) return;
        var hermanos = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
        el.style.setProperty('--i', Math.min(hermanos, 8));
        el.classList.add('revelar');
        observador.observe(el);
      });
    });
  }

  /* ---------- 2. Cabecera, sección activa y volver arriba ---------- */
  var cabecera = $('.cabecera'), subir = $('#subir');
  var enlaces = $$('#menu a[href^="#"]');
  var secciones = enlaces.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  var pend = false;
  function alDesplazar() {
    pend = false;
    var y = window.scrollY;
    cabecera.classList.toggle('cabecera--compacta', y > 40);
    subir.classList.toggle('visible', y > 700);
    var activa = -1, linea = window.innerHeight * 0.35;
    secciones.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < linea) activa = i; });
    enlaces.forEach(function (a, i) {
      if (i === activa) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
  }
  window.addEventListener('scroll', function () { if (!pend) { pend = true; requestAnimationFrame(alDesplazar); } }, { passive: true });
  subir.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  /* ---------- 3. Indicador de las pestañas ---------- */
  var indicador = $('.pestanas__indicador');
  function moverIndicador() {
    var sel = $('.pestana[aria-selected="true"]');
    if (!sel || !indicador) return;
    indicador.style.width = sel.offsetWidth + 'px';
    indicador.style.transform = 'translateX(' + sel.offsetLeft + 'px)';
  }
  on('pestana', function (d) {
    moverIndicador();
    var panel = document.getElementById(d.pestana.getAttribute('aria-controls'));
    panel.classList.remove('panel--entra'); void panel.offsetWidth; panel.classList.add('panel--entra');
  });
  window.addEventListener('resize', moverIndicador);

  /* ---------- 4. Avisos ---------- */
  var zona = $('#avisos');
  function aviso(texto, tipo) {
    var t = document.createElement('div');
    t.className = 'aviso-flotante' + (tipo ? ' aviso-flotante--' + tipo : '');
    t.textContent = texto;
    zona.appendChild(t);
    setTimeout(function () { t.classList.add('sale'); }, 2600);
    setTimeout(function () { t.remove(); }, 3100);
  }
  on('aviso', function (d) { aviso(d.texto); });

  /* ---------- 5. Vuela al carrito ----------
     Una copia de la foto sale de la tarjeta, sube en arco y cae
     sobre el botón del carrito (o el botón de menú en móvil), que rebota. */
  function destinoCarrito() {
    var c = $('.cabecera .menu__carrito');
    return c && c.offsetParent ? c : $('.menu-boton');
  }
  function rebotar() {
    var d = destinoCarrito();
    d.classList.remove('rebota'); void d.offsetWidth; d.classList.add('rebota');
  }
  function volar(img) {
    var d = destinoCarrito();
    if (!img || !img.getBoundingClientRect || !d.animate) { rebotar(); return; }
    var a = img.getBoundingClientRect(), b = d.getBoundingClientRect();
    if (!a.width) { rebotar(); return; }
    var copia = img.cloneNode();
    copia.className = 'vuela';
    copia.removeAttribute('loading');
    copia.style.cssText = 'left:' + a.left + 'px;top:' + a.top + 'px;width:' + a.width + 'px;height:' + a.height + 'px';
    document.body.appendChild(copia);
    var dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    copia.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1, borderRadius: '0px' },
      { transform: 'translate(' + dx * 0.45 + 'px,' + (dy * 0.45 - 140) + 'px) scale(.45) rotate(-8deg)', opacity: 1, borderRadius: '40px', offset: 0.55 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.08) rotate(10deg)', opacity: 0.2, borderRadius: '50%' }
    ], { duration: 820, easing: 'cubic-bezier(.45,.05,.35,1)' }).onfinish = function () {
      copia.remove(); rebotar();
      chispas(b.left + b.width / 2, b.top + b.height / 2, { n: 26, fuerza: 1.4 });
    };
  }
  on('al-carrito', function (d) { volar(d.origen); if (d.texto) aviso(d.texto); });

  /* ---------- 6. Chispas doradas ----------
     Partículas que salen disparadas, suben como brasas, se enfrían
     de dorado a gris ceniza y desaparecen. */
  var lienzo = $('#chispas'), ctx = lienzo.getContext('2d'), parts = [], corriendo = false, dpr = Math.min(window.devicePixelRatio || 1, 2);
  function medir() { lienzo.width = innerWidth * dpr; lienzo.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  medir(); window.addEventListener('resize', medir);
  function chispas(x, y, op) {
    op = op || {};
    var n = op.n || 70, f = op.fuerza || 1;
    for (var i = 0; i < n; i++) {
      var ang = Math.random() * Math.PI * 2, v = (60 + Math.random() * 260) * f;
      parts.push({ x: x, y: y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 120 * f, vida: 0.9 + Math.random() * 1.1, edad: 0,
        tam: 1.5 + Math.random() * 3, fase: Math.random() * 6.28 });
    }
    if (!corriendo) { corriendo = true; ultimo = performance.now(); requestAnimationFrame(paso); }
  }
  var ultimo = 0;
  function mezcla(a, b, k) { return a + (b - a) * k; }
  function paso(t) {
    var dt = Math.min((t - ultimo) / 1000, 0.05); ultimo = t;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i]; p.edad += dt;
      var k = p.edad / p.vida;
      if (k >= 1) { parts.splice(i, 1); continue; }
      p.vx *= 0.94; p.vy = p.vy * 0.94 - 40 * dt * 10;
      p.x += (p.vx + Math.sin(p.edad * 6 + p.fase) * 18) * dt; p.y += p.vy * dt;
      var r, g, b;
      if (k < 0.15) { r = 255; g = mezcla(240, 207, k / 0.15); b = mezcla(190, 122, k / 0.15); }
      else { var q = Math.min((k - 0.15) / 0.6, 1); r = mezcla(240, 130, q); g = mezcla(207, 124, q); b = mezcla(122, 116, q); }
      ctx.fillStyle = 'rgba(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ',' + (k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4).toFixed(2) + ')';
      var s = p.tam * (1 - k * 0.5);
      ctx.fillRect(p.x, p.y, s, s);
    }
    if (parts.length) requestAnimationFrame(paso); else { corriendo = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }

  /* ---------- 7. Total animado, error y destello ---------- */
  on('total', function (d) {
    var el = d.el, desde = d.desde, hasta = d.hasta, t0 = performance.now(), dur = 600;
    el.classList.remove('cambia'); void el.offsetWidth; el.classList.add('cambia');
    (function anim(t) {
      var k = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - k, 3);
      el.textContent = window.Balder.euros(desde + (hasta - desde) * e);
      if (k < 1) requestAnimationFrame(anim);
    })(t0);
  });
  on('error', function (d) {
    var objetivo = d.el.closest('form') ? d.el : d.el;
    [objetivo].concat($$('[aria-invalid="true"]')).forEach(function (el) {
      var caja = el.type === 'checkbox' ? el.closest('label') : el;
      caja.classList.remove('sacudir'); void caja.offsetWidth; caja.classList.add('sacudir');
    });
  });
  on('destacar', function (d) {
    if (!d.el) return;
    d.el.classList.remove('destello'); void d.el.offsetWidth; d.el.classList.add('destello');
  });

  /* ---------- 8. Inclinación 3D de las tarjetas de socio ---------- */
  $$('.plan').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = 'perspective(900px) rotateY(' + (x * 7) + 'deg) rotateX(' + (-y * 7) + 'deg) translateY(-4px)';
      card.style.setProperty('--brillo-x', (x + 0.5) * 100 + '%');
      card.style.setProperty('--brillo-y', (y + 0.5) * 100 + '%');
    });
    card.addEventListener('pointerleave', function () { card.style.transform = ''; });
  });

  window.BalderAnim = { chispas: chispas, aviso: aviso, rebotar: rebotar, volar: volar };
  prepararAparicion();
  moverIndicador();
  alDesplazar();
})();
