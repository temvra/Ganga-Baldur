/* =========================================================
   BALDER — Datos y lógica de la página
   1. Datos (estilos, servicios, productos, planes)
   2. Estado y memoria del navegador
   3. Menú móvil
   4. Pestañas de estilos
   5. Filtros, rejilla y carrusel de estilos
   6. Productos y carrito
   7. Reserva: precios, avisos y validación
   8. API para js/acciones.js y js/animaciones.js
   ========================================================= */
(function () {
  'use strict';

  /* ---------- 1. Datos ----------
     fotos: nº de imágenes en img/estilos/<id>-1.jpg … <id>-N.jpg
     (la 1 es el modelo principal). Sin fotos -> hueco [FOTO MODELO]. */
  var ESTILOS = [
    { id: 'mohicano', nombre: 'Mohicano', cat: 'Punk', largo: 'corto', fotos: 7 },
    { id: 'cresta', nombre: 'Cresta larga', cat: 'Punk', largo: 'largo', fotos: 7 },
    { id: 'buzz', nombre: 'Buzz cut', cat: 'Militar', largo: 'corto', fotos: 7 },
    { id: 'hightight', nombre: 'High and tight', cat: 'Militar', largo: 'corto', fotos: 7 },
    { id: 'overcon', nombre: 'Over connected', cat: 'Over connected', largo: 'largo', fotos: 6 },
    { id: 'texturizado', nombre: 'Texturizado', cat: 'Casual', largo: 'corto', fotos: 10 },
    { id: 'melena', nombre: 'Melena casual', cat: 'Casual', largo: 'largo', fotos: 10 },
    { id: 'streetfade', nombre: 'Street fade', cat: 'Street', largo: 'corto', fotos: 10 },
    { id: 'twists', nombre: 'Twists', cat: 'Street', largo: 'largo', fotos: 10 },
    { id: 'drill', nombre: 'Drill fade + diseño', cat: 'Drill', largo: 'corto', fotos: 10 },
    { id: 'dominicano', nombre: 'Fade dominicano', cat: 'Dominicano', largo: 'corto', fotos: 10 },
    { id: 'colombiano', nombre: 'Mullet colombiano', cat: 'Colombiano', largo: 'largo', fotos: 10 },
    { id: 'peaky', nombre: 'Peaky Blinders', cat: 'Peaky Blinders', largo: 'corto', fotos: 10 },
    { id: 'afrofade', nombre: 'Afro fade + línea', cat: 'Afro', largo: 'corto', fotos: 4 },
    { id: 'twoblock', nombre: 'Two block', cat: 'K-pop', largo: 'corto', fotos: 4 },
    { id: 'cortina', nombre: 'Cortina K-pop', cat: 'K-pop', largo: 'largo', fotos: 4 },
    { id: 'argentino', nombre: 'Argentino con mechas', cat: 'Casual', largo: 'corto', fotos: 11 }
  ];
  /* Servicios: precio al público con IVA (plan de precios), minutos */
  var SERVICIOS = [
    { nombre: 'Corte normal', min: 30, precio: 28 },
    { nombre: 'Corte + cejas o barba', min: 40, precio: 36 },
    { nombre: 'Corte + cejas y barba', min: 50, precio: 44 },
    { nombre: 'Tinte', min: 60, precio: 65 },
    { nombre: 'Trenzas dominicanas', min: 100, precio: 95 },
    { nombre: 'Trenzas africanas / rastas', min: 210, precio: 199 }
  ];
  var ESCANER = { online: 6, tienda: 12 };
  var SUPLEMENTO_GANGA = 25;
  /* Productos: foto en img/productos/<id>.jpg; precio en euros con IVA */
  var PRODUCTOS = [
    { id: 'champu', nombre: 'Champú purificante', formato: '500 ml', precio: 74.50, beneficios: ['Limpieza profunda', 'Equilibrio del cuero cabelludo', 'Fortalece el cabello'] },
    { id: 'acondicionador', nombre: 'Acondicionador regenerador', formato: '500 ml', precio: 69.50, beneficios: ['Hidratación intensa', 'Repara la fibra', 'Suavidad y control'] },
    { id: 'tinte', nombre: 'Tinte capilar Élite', formato: '100 ml', precio: 84.50, beneficios: ['Color uniforme y natural', 'Larga duración', 'Cuidado de la fibra'] },
    { id: 'cera', nombre: 'Cera moldeadora Signature', formato: '80 g', precio: 64.50, beneficios: ['Fijación alta', 'Textura y volumen', 'Acabado mate profesional'] },
    { id: 'gomina', nombre: 'Gomina Control Pro', formato: '150 ml', precio: 59.50, beneficios: ['Fijación duradera', 'Control y definición', 'Sin residuos'] },
    { id: 'aceite', nombre: 'Aceite de barba nutritivo', formato: '30 ml', precio: 74.50, beneficios: ['Hidratación profunda', 'Suaviza y disciplina', 'Brillo natural y salud'] }
  ];
  /* Planes de membresía (cuota con IVA). incluye: servicios sin coste;
     valle: solo lunes a jueves antes de las 16:00; ganga: domicilio incluido */
  var PLANES = {
    socio: { nombre: 'Socio', cuota: 39, incluye: ['Corte normal'], valle: true, ganga: false, dto: 10 },
    plus: { nombre: 'Socio Plus', cuota: 59, incluye: ['Corte normal', 'Corte + cejas o barba'], valle: false, ganga: false, dto: 15 },
    balder: { nombre: 'Socio Balder', cuota: 129, incluye: ['Corte normal', 'Corte + cejas o barba', 'Corte + cejas y barba'], valle: false, ganga: true, dto: 20 }
  };

  /* Ruta de una imagen. En la versión de un solo archivo (vista previa)
     las fotos van incrustadas en window.FOTOS_RUTA. */
  function ruta(p) { return (window.FOTOS_RUTA && window.FOTOS_RUTA[p]) || p; }
  function euros(n) { return n.toFixed(2).replace('.', ',') + ' €'; }
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function avisar(evento, detalle) { document.dispatchEvent(new CustomEvent('balder:' + evento, { detail: detalle || {} })); }

  /* ---------- 2. Estado y memoria del navegador ----------
     usuario, plan de socio y reservas se recuerdan en este navegador
     (localStorage). Si el navegador no lo permite, la web funciona igual. */
  function leer(clave, def) { try { var v = localStorage.getItem('balder.' + clave); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
  function guardar(clave, v) { try { localStorage.setItem('balder.' + clave, JSON.stringify(v)); } catch (e) { /* sin memoria */ } }

  var estado = {
    largo: 'todos', cat: 'todas', estilo: null, cant: {}, fotoIdx: {}, animarRejilla: false,
    usuario: leer('usuario', null), socio: leer('socio', null), reservas: leer('reservas', [])
  };

  /* ---------- 3. Menú móvil ---------- */
  var menuBoton = $('.menu-boton');
  var menu = $('#menu');
  function cerrarMenu() {
    menu.classList.remove('abierto');
    menuBoton.setAttribute('aria-expanded', 'false');
    menuBoton.setAttribute('aria-label', 'Abrir menú');
  }
  menuBoton.addEventListener('click', function () {
    var abierto = menu.classList.toggle('abierto');
    menuBoton.setAttribute('aria-expanded', abierto);
    menuBoton.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
  });
  $$('#menu a, #menu button').forEach(function (a) { a.addEventListener('click', cerrarMenu); });

  /* ---------- 4. Pestañas ---------- */
  var pestanas = $$('.pestana');
  pestanas.forEach(function (p) {
    p.addEventListener('click', function () {
      pestanas.forEach(function (o) {
        var activa = o === p;
        o.setAttribute('aria-selected', activa);
        $('#' + o.getAttribute('aria-controls')).hidden = !activa;
      });
      avisar('pestana', { pestana: p });
    });
  });

  /* ---------- 5. Filtros y rejilla de estilos ---------- */
  var rejilla = $('#rejilla-estilos');
  var sinEstilos = $('#sin-estilos');

  function pintarEstilos() {
    $$('.estilo', rejilla).forEach(function (n) { n.remove(); });
    var lista = ESTILOS.filter(function (s) {
      return (estado.largo === 'todos' || s.largo === estado.largo) &&
             (estado.cat === 'todas' || s.cat === estado.cat);
    });
    lista.forEach(function (s, i) {
      var elegido = estado.estilo === s.id;
      var art = document.createElement('article');
      art.className = 'estilo' + (elegido ? ' elegido' : '') + (estado.animarRejilla ? ' entra' : '');
      art.style.setProperty('--i', i);
      art.innerHTML =
        (s.fotos ? '' : '<div class="foto"><span>[FOTO MODELO]</span></div>') +
        '<div class="estilo__cabeza"><h3></h3><span class="estilo__tag"></span></div>' +
        '<button type="button" class="boton boton--linea"></button>';
      $('h3', art).textContent = s.nombre;
      $('.estilo__tag', art).textContent = s.cat + ' · ' + (s.largo === 'corto' ? 'Corto' : 'Largo');
      var b = $('button', art);
      b.textContent = elegido ? 'Elegido para tu cita ✓' : 'Elegir y añadir al carrito';
      b.setAttribute('aria-pressed', elegido);
      b.addEventListener('click', function () {
        elegirEstilo(elegido ? null : s.id, art);
      });
      if (s.fotos) art.insertBefore(crearCarrusel(s), art.firstChild);
      rejilla.appendChild(art);
      if (s.fotos) irAFoto(art, estado.fotoIdx[s.id] || 0, false);
    });
    estado.animarRejilla = false;
    sinEstilos.hidden = lista.length > 0;
  }

  function elegirEstilo(id, origen) {
    estado.estilo = id;
    if (id && id !== 'explicar') {
      marcarRadio('pago', 'online'); // elegir estilo requiere pago online
      avisar('al-carrito', { origen: origen && $('.carrusel__pista img', origen), texto: 'Estilo añadido a tu cita' });
    }
    pintarEstilos(); actualizarResumen();
  }

  /* ---------- 5b. Carrusel de fotos de cada estilo ----------
     Pista horizontal con scroll-snap (se desliza con el dedo),
     flechas anterior/siguiente, puntos y contador "1 / N".
     Las flechas del teclado funcionan con el carrusel enfocado.
     Al pulsar una foto se abre el visor a pantalla completa. */
  var FLECHA = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>';

  function crearCarrusel(s) {
    var c = document.createElement('div');
    c.className = 'carrusel';
    c.setAttribute('role', 'group');
    c.setAttribute('aria-roledescription', 'carrusel');
    c.setAttribute('aria-label', 'Fotos de ' + s.nombre);
    c.dataset.nombre = s.nombre;
    var pista = document.createElement('div');
    pista.className = 'carrusel__pista';
    pista.tabIndex = 0;
    var puntos = document.createElement('div');
    puntos.className = 'carrusel__puntos';
    puntos.setAttribute('aria-hidden', 'true');
    for (var i = 1; i <= s.fotos; i++) {
      var img = document.createElement('img');
      img.src = ruta('img/estilos/' + s.id + '-' + i + '.jpg');
      img.alt = s.nombre + ', foto ' + i + ' de ' + s.fotos + (i === 1 ? ' (modelo)' : '');
      img.loading = i === 1 ? 'eager' : 'lazy';
      img.decoding = 'async';
      img.draggable = false;
      pista.appendChild(img);
      puntos.appendChild(document.createElement('span'));
    }
    c.appendChild(pista);
    c.insertAdjacentHTML('beforeend',
      '<button type="button" class="carrusel__flecha carrusel__flecha--ant" aria-label="Foto anterior">' + FLECHA + '</button>' +
      '<button type="button" class="carrusel__flecha carrusel__flecha--sig" aria-label="Foto siguiente">' + FLECHA + '</button>' +
      '<button type="button" class="carrusel__ampliar" aria-label="Ampliar fotos de ' + s.nombre + '"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>' +
      '<span class="carrusel__contador" aria-live="polite"></span>');
    c.appendChild(puntos);

    $('.carrusel__flecha--ant', c).addEventListener('click', function () { irAFoto(c, actual(c) - 1, true); });
    $('.carrusel__flecha--sig', c).addEventListener('click', function () { irAFoto(c, actual(c) + 1, true); });
    $('.carrusel__ampliar', c).addEventListener('click', function () { avisar('visor', { carrusel: c, indice: actual(c) }); });
    pista.addEventListener('click', function () { avisar('visor', { carrusel: c, indice: actual(c) }); });
    c.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); irAFoto(c, actual(c) + 1, true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); irAFoto(c, actual(c) - 1, true); }
      if (e.key === 'Enter' && e.target === pista) { avisar('visor', { carrusel: c, indice: actual(c) }); }
    });
    var pend = false;
    pista.addEventListener('scroll', function () {
      if (pend) return; pend = true;
      requestAnimationFrame(function () {
        pend = false;
        estado.fotoIdx[s.id] = actual(c);
        marcar(c);
      });
    });
    return c;
  }
  function actual(c) {
    var p = $('.carrusel__pista', c);
    return Math.round(p.scrollLeft / (p.clientWidth || 1));
  }
  function irAFoto(raiz, i, suave) {
    var c = raiz.classList.contains('carrusel') ? raiz : $('.carrusel', raiz);
    var p = $('.carrusel__pista', c);
    var n = p.children.length;
    i = Math.max(0, Math.min(n - 1, i));
    p.scrollTo({ left: i * p.clientWidth, behavior: suave ? 'smooth' : 'auto' });
    marcar(c, i);
  }
  function marcar(c, i) {
    var n = $('.carrusel__pista', c).children.length;
    if (i === undefined) i = actual(c);
    $('.carrusel__contador', c).textContent = (i + 1) + ' / ' + n;
    $$('.carrusel__puntos span', c).forEach(function (d, k) { d.className = k === i ? 'activo' : ''; });
    $('.carrusel__flecha--ant', c).disabled = i === 0;
    $('.carrusel__flecha--sig', c).disabled = i === n - 1;
  }

  function grupoChips(atributo, clave) {
    var chips = $$('[data-' + atributo + ']');
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        estado[clave] = c.getAttribute('data-' + atributo);
        chips.forEach(function (o) { o.setAttribute('aria-pressed', o === c); });
        estado.animarRejilla = true;
        pintarEstilos();
      });
    });
  }
  grupoChips('largo', 'largo');
  grupoChips('cat', 'cat');

  /* Fotos de la portada: activan el filtro de su estilo y bajan a la rejilla */
  function pulsarChip(attr, valor) {
    var chip = $('[data-' + attr + '="' + valor + '"]');
    if (chip) chip.click();
  }
  $$('.modelo[data-ir-cat], .modelo[data-ir-largo]').forEach(function (a) {
    a.addEventListener('click', function () {
      pulsarChip('largo', a.getAttribute('data-ir-largo') || 'todos');
      pulsarChip('cat', a.getAttribute('data-ir-cat') || 'todas');
    });
  });

  $('[data-explicar]').addEventListener('click', function () {
    elegirEstilo('explicar');
    document.getElementById('reserva').scrollIntoView();
  });

  /* ---------- 6. Productos y carrito ----------
     estado.cant guarda cuántas unidades hay de cada producto. */
  var rejillaProd = $('#rejilla-productos');
  function unidades() { return Object.keys(estado.cant).reduce(function (t, k) { return t + estado.cant[k]; }, 0); }
  function productoPorId(id) { return PRODUCTOS.filter(function (p) { return p.id === id; })[0]; }

  function cambiarCantidad(id, delta, origen) {
    var n = (estado.cant[id] || 0) + delta;
    if (n <= 0) delete estado.cant[id]; else estado.cant[id] = n;
    if (delta > 0) avisar('al-carrito', { origen: origen, texto: productoPorId(id).nombre + ' añadido al carrito' });
    pintarProductos(); actualizarResumen();
  }

  function pintarProductos() {
    rejillaProd.innerHTML = '';
    PRODUCTOS.forEach(function (p) {
      var n = estado.cant[p.id] || 0;
      var art = document.createElement('article');
      art.className = 'producto' + (n ? ' elegido' : '');
      art.innerHTML =
        '<button type="button" class="producto__ver"><img class="producto__foto" loading="lazy" decoding="async"></button>' +
        '<div class="producto__fila"><strong></strong><span class="precio"></span></div>' +
        '<span class="producto__formato"></span>' +
        '<button type="button" class="boton boton--linea producto__anadir"></button>';
      var img = $('img', art);
      img.src = ruta('img/productos/' + p.id + '.jpg');
      img.alt = p.nombre + ' Balder, ' + p.formato;
      $('.producto__ver', art).setAttribute('aria-label', 'Ver ficha de ' + p.nombre);
      $('.producto__ver', art).addEventListener('click', function () { avisar('ficha', { producto: p }); });
      $('strong', art).textContent = p.nombre;
      $('.precio', art).textContent = euros(p.precio);
      $('.producto__formato', art).textContent = p.formato;
      var b = $('.producto__anadir', art);
      b.textContent = n ? 'En el carrito (' + n + ') · añadir otro' : 'Añadir al carrito';
      b.setAttribute('aria-pressed', n > 0);
      b.addEventListener('click', function () { cambiarCantidad(p.id, 1, img); });
      rejillaProd.appendChild(art);
    });
  }

  /* ---------- 7. Reserva ---------- */
  var form = $('#form-reserva');
  function valor(nombre) { var r = $('input[name="' + nombre + '"]:checked', form); return r ? r.value : ''; }
  function marcarRadio(nombre, v) { var r = $('input[name="' + nombre + '"][value="' + v + '"]', form); if (r) r.checked = true; }
  function servicio(nombre) { return SERVICIOS.filter(function (s) { return s.nombre === nombre; })[0]; }

  /* Fecha y hora elegidas caen en horario valle (lunes a jueves antes de las 16:00) */
  function esValle() {
    var f = $('#fecha').value, h = $('#hora').value;
    if (!f || !h) return true; // aún sin elegir: se avisa al confirmar
    var dia = new Date(f + 'T12:00').getDay(); // 0 domingo … 6 sábado
    return dia >= 1 && dia <= 4 && parseInt(h, 10) < 16;
  }

  /* Calcula el precio de la cita con las reglas de la membresía */
  function calcular() {
    var online = valor('pago') === 'online';
    var casa = valor('lugar') === 'casa';
    var s = servicio(valor('servicio'));
    var plan = estado.socio ? PLANES[estado.socio.plan] : null;
    var incluido = !!(plan && plan.incluye.indexOf(s.nombre) !== -1 && (!plan.valle || esValle()));
    var precioServicio = incluido ? 0 : s.precio;
    var escaner = $('#con-escaner').checked ? (online ? (plan ? 0 : ESCANER.online) : ESCANER.tienda) : null;
    var ganga = casa ? (plan && plan.ganga ? 0 : SUPLEMENTO_GANGA) : null;
    var dto = plan ? plan.dto / 100 : 0;
    var productos = PRODUCTOS.reduce(function (t, p) { return t + (estado.cant[p.id] || 0) * p.precio; }, 0) * (1 - dto);
    var ahora, tienda;
    if (online) { ahora = precioServicio + (escaner || 0) + (ganga || 0) + productos; tienda = 0; }
    else { ahora = escaner || 0; tienda = precioServicio + (ganga || 0) + productos; }
    return { online: online, casa: casa, servicio: s, plan: plan, incluido: incluido, precioServicio: precioServicio,
             escaner: escaner, ganga: ganga, productos: productos, dto: dto, ahora: ahora, tienda: tienda };
  }

  function actualizarResumen() {
    var c = calcular();
    $('#aviso-online').hidden = !c.online;
    $('#aviso-domicilio').hidden = !c.casa || !!estado.socio;
    $('#campo-direccion').hidden = !c.casa;
    $('#campo-fotos').hidden = !(c.online && $('#con-escaner').checked);
    $('#precio-escaner').textContent = c.online ? (c.plan ? 'incluido en tu plan' : ESCANER.online + ' €') : ESCANER.tienda + ' €, se paga ahora';

    var estiloTxt = 'Lo explicas en tienda';
    if (!c.online) estiloTxt = 'No disponible con pago en tienda';
    else if (estado.estilo && estado.estilo !== 'explicar') {
      estiloTxt = ESTILOS.filter(function (s) { return s.id === estado.estilo; })[0].nombre;
    }
    $('#r-lugar').textContent = c.casa ? 'Ganga Balder (domicilio)' : 'En el local';
    $('#r-servicio').textContent = c.servicio.nombre + ' · ' + c.servicio.min + ' min';
    $('#r-estilo').textContent = estiloTxt;
    $('#r-pago').textContent = c.online ? 'Online (sin reembolso)' : 'En tienda';
    var f = $('#fecha').value, h = $('#hora').value;
    $('#r-cita').textContent = f || h ? (f ? new Date(f + 'T12:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) : '[día]') + ' · ' + (h || '[hora]') : 'Elige día y hora';
    var nombres = PRODUCTOS.filter(function (p) { return estado.cant[p.id]; }).map(function (p) { return p.nombre + (estado.cant[p.id] > 1 ? ' ×' + estado.cant[p.id] : ''); });
    $('#r-productos').textContent = nombres.length ? nombres.join(', ') : 'Ninguno';

    $('#r-p-servicio').textContent = c.incluido ? 'Incluido en tu plan' : euros(c.precioServicio);
    $('#fila-escaner').hidden = c.escaner === null;
    if (c.escaner !== null) $('#r-p-escaner').textContent = c.escaner ? euros(c.escaner) : 'Incluido';
    $('#fila-ganga').hidden = c.ganga === null;
    if (c.ganga !== null) $('#r-p-ganga').textContent = c.ganga ? euros(c.ganga) : 'Incluido';
    $('#r-total').textContent = c.productos ? euros(c.productos) + (c.dto ? ' (−' + Math.round(c.dto * 100) + ' %)' : '') : '—';
    var elAhora = $('#r-ahora'), antes = parseFloat(elAhora.dataset.v || c.ahora);
    elAhora.dataset.v = c.ahora;
    elAhora.textContent = euros(c.ahora);
    if (antes !== c.ahora) avisar('total', { el: elAhora, desde: antes, hasta: c.ahora });
    $('#fila-tienda').hidden = !c.tienda;
    $('#r-tienda').textContent = euros(c.tienda);
    $('#boton-confirmar').textContent = c.online ? 'Pagar ' + euros(c.ahora) + ' y reservar' : (c.ahora ? 'Pagar ' + euros(c.ahora) + ' y reservar' : 'Reservar cita');

    var notaSocio = $('#nota-socio');
    if (c.plan) {
      notaSocio.hidden = false;
      notaSocio.textContent = c.incluido ? 'Tu plan ' + c.plan.nombre + ' cubre este servicio.'
        : (c.plan.valle && c.plan.incluye.indexOf(c.servicio.nombre) !== -1 ? 'Tu plan Socio solo cubre el corte de lunes a jueves antes de las 16:00. A esta hora se cobra a precio normal.' : 'Este servicio no está incluido en tu plan ' + c.plan.nombre + '.');
    } else notaSocio.hidden = true;

    var n = (estado.estilo && estado.estilo !== 'explicar' && c.online ? 1 : 0) + unidades();
    $('#carrito-num').textContent = n;
    $('#ok-reserva').hidden = true;
    avisar('resumen', { calculo: c, unidades: n });
  }
  form.addEventListener('change', actualizarResumen);
  form.addEventListener('input', function (e) { if (e.target.getAttribute('aria-invalid') === 'true') e.target.setAttribute('aria-invalid', 'false'); });

  // No se puede reservar en el pasado (fecha local, no UTC)
  var hoy = new Date();
  $('#fecha').min = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  // Fotos para el escáner: vista previa y máximo 5 imágenes
  $('#fotos').addEventListener('change', function () {
    var previa = $('#fotos-previa');
    previa.innerHTML = '';
    var archivos = Array.prototype.slice.call(this.files).filter(function (f) { return /^image\//.test(f.type); });
    if (archivos.length > 5) avisar('aviso', { texto: 'Solo se usarán las 5 primeras fotos' });
    archivos.slice(0, 5).forEach(function (f, i) {
      var img = document.createElement('img');
      img.src = URL.createObjectURL(f);
      img.alt = 'Foto ' + (i + 1) + ' para el escáner';
      img.style.setProperty('--i', i);
      previa.appendChild(img);
    });
  });

  // Botones "Reservar" de la carta de servicios y "Reservar con escáner"
  $$('[data-reservar]').forEach(function (b) {
    b.addEventListener('click', function () {
      marcarRadio('servicio', b.getAttribute('data-reservar'));
      actualizarResumen();
      document.getElementById('reserva').scrollIntoView();
      avisar('destacar', { el: $('input[name="servicio"]:checked', form).nextElementSibling });
    });
  });
  $('[data-con-escaner]').addEventListener('click', function () {
    $('#con-escaner').checked = true;
    actualizarResumen();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var errores = [], campos = [];
    function mal(campo, texto) { errores.push(texto); campos.push(campo); campo.setAttribute('aria-invalid', 'true'); }
    $$('[aria-invalid]', form).forEach(function (x) { x.setAttribute('aria-invalid', 'false'); });
    var c = calcular();
    if (!$('#fecha').value) mal($('#fecha'), 'elige un día');
    else if (new Date($('#fecha').value + 'T12:00').getDay() === 0) mal($('#fecha'), 'los domingos está cerrado');
    if (!$('#hora').value) mal($('#hora'), 'elige una hora');
    if (c.casa && !estado.socio) errores.push('Ganga Balder a domicilio requiere ser socio');
    if (c.casa && $('#direccion').value.trim().length < 8) mal($('#direccion'), 'escribe la dirección completa');
    if ($('#nombre').value.trim().length < 2) mal($('#nombre'), 'escribe tu nombre');
    if (!/^(\+34\s?)?[6789]\d{2}\s?\d{3}\s?\d{3}$/.test($('#telefono').value.trim())) mal($('#telefono'), 'escribe un teléfono válido (9 cifras)');
    if (!$('#acepto').checked) mal($('#acepto'), 'acepta la política de privacidad');
    var err = $('#error-reserva');
    if (errores.length) {
      err.textContent = 'Para reservar: ' + errores.join(', ') + '.';
      err.hidden = false;
      avisar('error', { el: err });
      if (campos[0]) campos[0].focus();
      return;
    }
    err.hidden = true;
    var reserva = {
      codigo: 'BAL-' + Math.random().toString(36).slice(2, 6).toUpperCase(),
      fecha: $('#fecha').value, hora: $('#hora').value, servicio: c.servicio.nombre, min: c.servicio.min,
      lugar: c.casa ? 'Ganga Balder · ' + $('#direccion').value.trim() : 'En el local',
      estilo: $('#r-estilo').textContent, pago: c.online ? 'online' : 'tienda',
      ahora: c.ahora, tienda: c.tienda, nombre: $('#nombre').value.trim()
    };
    estado.reservas.unshift(reserva);
    guardar('reservas', estado.reservas);
    $('#ok-reserva').hidden = false;
    avisar('reservado', { reserva: reserva });
  });

  /* Carruseles de las trenzas (sección Servicios): sustituyen el hueco si hay fotos */
  $$('[data-carrusel]').forEach(function (hueco) {
    var n = parseInt(hueco.getAttribute('data-fotos'), 10);
    if (!n) return;
    var c = crearCarrusel({ id: hueco.getAttribute('data-carrusel'), nombre: hueco.getAttribute('data-nombre'), fotos: n });
    hueco.parentNode.replaceChild(c, hueco);
    irAFoto(c, 0, false);
  });

  /* ---------- 8. API para los otros scripts ---------- */
  window.Balder = {
    estado: estado, ESTILOS: ESTILOS, PRODUCTOS: PRODUCTOS, PLANES: PLANES, SERVICIOS: SERVICIOS,
    euros: euros, ruta: ruta, guardar: guardar, avisar: avisar, cambiarCantidad: cambiarCantidad, elegirEstilo: elegirEstilo,
    productoPorId: productoPorId, actualizarResumen: actualizarResumen, pintarProductos: pintarProductos
  };

  if (estado.usuario) { $('#nombre').value = estado.usuario.nombre || ''; $('#telefono').value = estado.usuario.telefono || ''; }
  pintarEstilos();
  pintarProductos();
  actualizarResumen();
})();
