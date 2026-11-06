/* =========================================================
   BALDER — Paneles y acciones del usuario
   1. Abrir y cerrar paneles (<dialog>) con animación
   2. Carrito lateral
   3. Cuenta: entrar, crear cuenta, mis reservas
   4. Hazte socio
   5. Confirmación de la reserva + archivo de calendario (.ics)
   6. Ficha de producto
   7. Visor de fotos a pantalla completa
   8. Textos legales
   9. Enlaces "próximamente"
   Prototipo sin servidor: la cuenta, el plan y las reservas se
   guardan solo en este navegador. Nunca se guarda la contraseña.
   ========================================================= */
(function () {
  'use strict';
  var B = window.Balder, A = window.BalderAnim;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var on = function (ev, fn) { document.addEventListener('balder:' + ev, function (e) { fn(e.detail || {}); }); };
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fechaLarga(f) { return new Date(f + 'T12:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }); }
  var CHK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>';

  /* ---------- 1. Paneles ----------
     <dialog> nativo: atrapa el foco y bloquea el fondo. Al cerrar se
     añade la clase "cerrando" para que la animación de salida termine antes. */
  function abrir(dlg) {
    if (dlg.open) return;
    dlg.classList.remove('cerrando');
    dlg.showModal();
  }
  function cerrar(dlg) {
    if (!dlg.open || dlg.classList.contains('cerrando')) return;
    dlg.classList.add('cerrando');
    setTimeout(function () { dlg.close(); dlg.classList.remove('cerrando'); }, 260);
  }
  $$('dialog').forEach(function (dlg) {
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); cerrar(dlg); }); // tecla Esc
    dlg.addEventListener('click', function (e) {
      if (e.target.closest('[data-cerrar]')) { cerrar(dlg); return; }
      var r = dlg.getBoundingClientRect(); // clic fuera = clic en el fondo
      if (e.target === dlg && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) cerrar(dlg);
    });
  });

  /* ---------- 2. Carrito lateral ---------- */
  var dlgCarrito = $('#dlg-carrito');
  function pintarCarrito() {
    var est = B.estado, cuerpo = $('#carrito-cuerpo'), html = '', total = 0;
    var plan = est.socio ? B.PLANES[est.socio.plan] : null, dto = plan ? plan.dto / 100 : 0;
    var estilo = est.estilo && est.estilo !== 'explicar' ? B.ESTILOS.filter(function (s) { return s.id === est.estilo; })[0] : null;
    if (estilo) {
      html += '<div class="linea-carrito"><img src="' + B.ruta('img/estilos/' + estilo.id + '-1.jpg') + '" alt=""><div><strong>' + esc(estilo.nombre) +
        '</strong><small>Estilo elegido para tu cita · se paga con el servicio</small></div><button class="enlace" type="button" data-quitar-estilo>Quitar</button></div>';
    }
    B.PRODUCTOS.forEach(function (p) {
      var n = est.cant[p.id]; if (!n) return;
      total += n * p.precio;
      html += '<div class="linea-carrito" data-id="' + p.id + '"><img src="' + B.ruta('img/productos/' + p.id + '.jpg') + '" alt=""><div><strong>' + esc(p.nombre) +
        '</strong><small>' + p.formato + ' · ' + B.euros(p.precio) + '</small><div class="cantidad"><button type="button" data-menos aria-label="Quitar uno">−</button><span aria-live="polite">' + n +
        '</span><button type="button" data-mas aria-label="Añadir uno">+</button></div></div><button class="enlace" type="button" data-quitar>Quitar</button></div>';
    });
    if (!html) {
      html = '<div class="carrito-vacio"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L20 8H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>' +
        '<p>Tu carrito está vacío.</p><a class="boton boton--linea" href="#estilos" data-cerrar>Ver estilos</a><a class="boton boton--linea" href="#productos" data-cerrar>Ver productos</a></div>';
    }
    if (dto && total) html += '<p class="nota">Descuento de socio (' + plan.dto + ' %) aplicado: −' + B.euros(total * dto) + '</p>';
    cuerpo.innerHTML = html;
    $('#carrito-total').textContent = B.euros(total * (1 - dto));
  }
  $('#carrito-cuerpo').addEventListener('click', function (e) {
    var linea = e.target.closest('[data-id]'), id = linea && linea.getAttribute('data-id');
    if (e.target.closest('[data-quitar-estilo]')) { B.elegirEstilo(null); return; }
    if (!id) return;
    if (e.target.closest('[data-mas]')) B.cambiarCantidad(id, 1);
    if (e.target.closest('[data-menos]')) B.cambiarCantidad(id, -1);
    if (e.target.closest('[data-quitar]')) {
      linea.classList.add('sale');
      setTimeout(function () { B.cambiarCantidad(id, -B.estado.cant[id]); }, 220);
    }
  });
  $$('[data-abrir-carrito]').forEach(function (b) { b.addEventListener('click', function () { pintarCarrito(); abrir(dlgCarrito); }); });
  on('resumen', function () { if (dlgCarrito.open) pintarCarrito(); });

  /* ---------- 3. Cuenta ---------- */
  var dlgCuenta = $('#dlg-cuenta'), cuentaCuerpo = $('#cuenta-cuerpo');
  function pintarBotonCuenta() {
    var u = B.estado.usuario;
    $('#cuenta-texto').textContent = u ? 'Hola, ' + u.nombre.split(' ')[0] : 'Cuenta';
    $$('[data-plan-tarjeta]').forEach(function (t) {
      var mio = B.estado.socio && B.estado.socio.plan === t.getAttribute('data-plan-tarjeta');
      t.classList.toggle('plan--mio', !!mio);
      $('[data-plan]', t).textContent = mio ? 'Tu plan actual' : (B.estado.socio ? 'Cambiar a este plan' : 'Hacerme socio');
    });
  }
  function formularioCuenta(modo) {
    var reg = modo === 'registro';
    cuentaCuerpo.innerHTML =
      '<h2 id="t-cuenta">' + (reg ? 'Crea tu cuenta' : 'Entra en tu cuenta') + '</h2>' +
      '<div class="interruptor" role="tablist"><button type="button" role="tab" aria-selected="' + !reg + '" data-modo="entrar">Entrar</button><button type="button" role="tab" aria-selected="' + reg + '" data-modo="registro">Crear cuenta</button></div>' +
      '<form class="form-modal" novalidate>' +
      (reg ? '<div class="campo"><label for="c-nombre">Nombre</label><input id="c-nombre" autocomplete="name" required></div>' +
             '<div class="campo"><label for="c-tel">Teléfono</label><input id="c-tel" type="tel" inputmode="tel" autocomplete="tel" placeholder="600 000 000"></div>' : '') +
      '<div class="campo"><label for="c-email">Correo electrónico</label><input id="c-email" type="email" autocomplete="email" required></div>' +
      '<div class="campo"><label for="c-pass">Contraseña</label><div class="con-boton"><input id="c-pass" type="password" autocomplete="' + (reg ? 'new-password' : 'current-password') + '" required minlength="8"><button type="button" class="enlace" data-ver-pass>Mostrar</button></div>' +
      (reg ? '<div class="fuerza" aria-hidden="true"><span></span></div><small id="c-fuerza">Mínimo 8 caracteres</small>' : '') + '</div>' +
      (reg ? '<label class="check"><input type="checkbox" id="c-acepto"><span>Acepto la <button class="enlace" type="button" data-legal="privacidad">política de privacidad</button></span></label>' : '') +
      '<p class="error" role="alert" hidden></p>' +
      '<button class="boton boton--oro boton--grande" type="submit">' + (reg ? 'Crear cuenta' : 'Entrar') + '</button>' +
      '<p class="nota">Prototipo sin servidor: tu cuenta se guarda solo en este navegador y la contraseña no se guarda nunca.</p></form>';
    $$('[data-modo]', cuentaCuerpo).forEach(function (b) { b.addEventListener('click', function () { formularioCuenta(b.getAttribute('data-modo')); }); });
    $('[data-ver-pass]', cuentaCuerpo).addEventListener('click', function () {
      var i = $('#c-pass'); i.type = i.type === 'password' ? 'text' : 'password'; this.textContent = i.type === 'password' ? 'Mostrar' : 'Ocultar';
    });
    if (reg) $('#c-pass').addEventListener('input', function () {
      var v = this.value, p = (v.length >= 8) + /[A-Z]/.test(v) + /\d/.test(v) + /[^A-Za-z0-9]/.test(v);
      var barra = $('.fuerza span', cuentaCuerpo);
      barra.style.width = (p * 25) + '%';
      barra.dataset.nivel = p;
      $('#c-fuerza').textContent = v.length < 8 ? 'Mínimo 8 caracteres' : ['', 'Débil', 'Aceptable', 'Buena', 'Muy buena'][p];
    });
    $('form', cuentaCuerpo).addEventListener('submit', function (e) {
      e.preventDefault();
      var err = $('.error', cuentaCuerpo), fallos = [];
      var email = $('#c-email').value.trim();
      if (reg && $('#c-nombre').value.trim().length < 2) fallos.push('escribe tu nombre');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fallos.push('escribe un correo válido');
      if ($('#c-pass').value.length < 8) fallos.push('la contraseña debe tener al menos 8 caracteres');
      if (reg && !$('#c-acepto').checked) fallos.push('acepta la política de privacidad');
      var guardado = null; try { guardado = JSON.parse(localStorage.getItem('balder.usuario')); } catch (x) { /* nada */ }
      if (!reg && !fallos.length && !(guardado && guardado.email === email)) fallos.push('no hay ninguna cuenta con ese correo en este navegador; créala primero');
      if (fallos.length) {
        err.textContent = fallos.join(', ').replace(/^./, function (c) { return c.toUpperCase(); }) + '.';
        err.hidden = false; err.classList.remove('sacudir'); void err.offsetWidth; err.classList.add('sacudir');
        return;
      }
      B.estado.usuario = reg ? { nombre: $('#c-nombre').value.trim(), email: email, telefono: $('#c-tel').value.trim() } : guardado;
      B.guardar('usuario', B.estado.usuario);
      $('#nombre').value = B.estado.usuario.nombre; $('#telefono').value = B.estado.usuario.telefono || '';
      pintarBotonCuenta(); B.actualizarResumen();
      var r = dlgCuenta.getBoundingClientRect();
      A.chispas(r.left + r.width / 2, r.top + 60, { n: 60 });
      A.aviso(reg ? 'Cuenta creada. ¡Bienvenido a Balder!' : 'Has entrado en tu cuenta');
      miCuenta();
    });
    setTimeout(function () { var p = $('input', cuentaCuerpo); if (p) p.focus(); }, 50);
  }
  function miCuenta() {
    var u = B.estado.usuario, s = B.estado.socio, plan = s ? B.PLANES[s.plan] : null, res = B.estado.reservas;
    cuentaCuerpo.innerHTML =
      '<h2 id="t-cuenta">Hola, ' + esc(u.nombre) + '</h2><p class="nota">' + esc(u.email) + '</p>' +
      '<div class="tarjeta-cuenta">' + (plan ? '<p class="etiqueta">Tu membresía</p><strong>' + plan.nombre + ' · ' + plan.cuota + ' €/mes</strong><small>Socio desde el ' + fechaLarga(s.desde) + '</small><button class="enlace" type="button" data-baja>Darme de baja</button>'
        : '<p class="etiqueta">Membresía</p><strong>Aún no eres socio</strong><a class="boton boton--linea" href="#socios" data-cerrar>Ver planes</a>') + '</div>' +
      '<h3>Mis reservas</h3>' + (res.length ? '<ul class="mis-reservas">' + res.map(function (r, i) {
        return '<li><div><strong>' + esc(r.servicio) + '</strong><small>' + fechaLarga(r.fecha) + ' · ' + r.hora + ' · ' + esc(r.codigo) + '</small></div><div class="acciones-reserva">' + (puedeDescargar ? '<button class="enlace" type="button" data-ics="' + i + '">Calendario</button>' : '<a class="enlace" target="_blank" rel="noopener" href="' + enlaceGoogle(r) + '">Calendario</a>') + '<button class="enlace" type="button" data-anular="' + i + '">Anular</button></div></li>';
      }).join('') + '</ul>' : '<p class="nota">Todavía no tienes reservas.</p>') +
      '<button class="boton boton--linea" type="button" data-salir>Cerrar sesión</button>';
    cuentaCuerpo.onclick = function (e) {
      var t = e.target;
      if (t.closest('[data-salir]')) { B.estado.usuario = null; try { localStorage.removeItem('balder.usuario'); } catch (x) { /* nada */ } pintarBotonCuenta(); A.aviso('Has cerrado sesión'); cerrar(dlgCuenta); }
      if (t.closest('[data-ics]')) descargarIcs(B.estado.reservas[+t.closest('[data-ics]').getAttribute('data-ics')]);
      if (t.closest('[data-anular]')) {
        var i = +t.closest('[data-anular]').getAttribute('data-anular'), li = t.closest('li');
        li.classList.add('sale');
        setTimeout(function () { B.estado.reservas.splice(i, 1); B.guardar('reservas', B.estado.reservas); A.aviso('Reserva anulada'); miCuenta(); }, 250);
      }
      if (t.closest('[data-baja]')) { B.estado.socio = null; B.guardar('socio', null); pintarBotonCuenta(); B.actualizarResumen(); A.aviso('Baja tramitada. Tu plan sigue activo 15 días.'); miCuenta(); }
    };
  }
  $('#boton-cuenta').addEventListener('click', function () {
    cuentaCuerpo.onclick = null;
    if (B.estado.usuario) miCuenta(); else formularioCuenta('entrar');
    abrir(dlgCuenta);
  });

  /* ---------- 4. Hazte socio ---------- */
  var dlgSocio = $('#dlg-socio'), socioCuerpo = $('#socio-cuerpo');
  $$('[data-plan]').forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-plan'), plan = B.PLANES[id], u = B.estado.usuario || {};
      if (B.estado.socio && B.estado.socio.plan === id) { A.aviso('Ya tienes el plan ' + plan.nombre); return; }
      var lista = $$('li span', b.closest('.plan')).map(function (s) { return '<li>' + CHK + '<span>' + s.textContent + '</span></li>'; }).join('');
      socioCuerpo.innerHTML =
        '<p class="etiqueta">Membresía Balder</p><h2 id="t-socio">' + plan.nombre + '</h2><p class="plan__precio"><strong>' + plan.cuota + ' €</strong> / mes, IVA incluido</p>' +
        '<ul class="lista-check">' + lista + '</ul>' +
        '<form class="form-modal" novalidate>' +
        '<div class="campo"><label for="s-nombre">Nombre</label><input id="s-nombre" autocomplete="name" value="' + esc(u.nombre || '') + '"></div>' +
        '<div class="campo"><label for="s-email">Correo electrónico</label><input id="s-email" type="email" autocomplete="email" value="' + esc(u.email || '') + '"></div>' +
        '<label class="check"><input type="checkbox" id="s-acepto"><span>Acepto las <button class="enlace" type="button" data-legal="condiciones">condiciones de la membresía</button> (permanencia mínima de 3 meses)</span></label>' +
        '<p class="error" role="alert" hidden></p>' +
        '<button class="boton boton--oro boton--grande" type="submit">Confirmar alta · ' + plan.cuota + ' €/mes</button>' +
        '<p class="nota">El cobro de la cuota se haría en una pasarela de pago segura (no incluida en este prototipo).</p></form>';
      $('form', socioCuerpo).addEventListener('submit', function (e) {
        e.preventDefault();
        var err = $('.error', socioCuerpo), fallos = [], nombre = $('#s-nombre').value.trim(), email = $('#s-email').value.trim();
        if (nombre.length < 2) fallos.push('escribe tu nombre');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fallos.push('escribe un correo válido');
        if (!$('#s-acepto').checked) fallos.push('acepta las condiciones');
        if (fallos.length) { err.textContent = fallos.join(', ').replace(/^./, function (c) { return c.toUpperCase(); }) + '.'; err.hidden = false; err.classList.remove('sacudir'); void err.offsetWidth; err.classList.add('sacudir'); return; }
        if (!B.estado.usuario) { B.estado.usuario = { nombre: nombre, email: email, telefono: '' }; B.guardar('usuario', B.estado.usuario); }
        var hoy = new Date();
        B.estado.socio = { plan: id, desde: new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000).toISOString().slice(0, 10) };
        B.guardar('socio', B.estado.socio);
        pintarBotonCuenta(); B.actualizarResumen();
        cerrar(dlgSocio);
        var tarjeta = $('[data-plan-tarjeta="' + id + '"]'), r = tarjeta.getBoundingClientRect();
        setTimeout(function () {
          tarjeta.classList.remove('celebra'); void tarjeta.offsetWidth; tarjeta.classList.add('celebra');
          A.chispas(r.left + r.width / 2, r.top + r.height / 3, { n: 140, fuerza: 1.3 });
          A.aviso('¡Ya eres ' + plan.nombre + '! Tus servicios incluidos se descuentan al reservar.');
        }, 280);
      });
      abrir(dlgSocio);
    });
  });

  /* ---------- 5. Confirmación y calendario ---------- */
  var dlgConf = $('#dlg-confirmacion');
  /* Enlace para añadir la cita a Google Calendar (funciona en cualquier sitio) */
  function enlaceGoogle(r) {
    var d = r.fecha.replace(/-/g, ''), h = r.hora.replace(':', '') + '00';
    var fin = new Date(r.fecha + 'T' + r.hora + ':00'); fin.setMinutes(fin.getMinutes() + (r.min || 30));
    var dos = function (n) { return (n < 10 ? '0' : '') + n; };
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE&ctz=Europe/Madrid&text=' + encodeURIComponent('Balder · ' + r.servicio) +
      '&dates=' + d + 'T' + h + '/' + d + 'T' + dos(fin.getHours()) + dos(fin.getMinutes()) + '00' +
      '&location=' + encodeURIComponent(r.lugar) + '&details=' + encodeURIComponent('Código de reserva ' + r.codigo);
  }
  /* Dentro del visor de claude.ai las descargas directas están bloqueadas */
  var puedeDescargar = !(window.claude && window.claude.use);
  function descargarIcs(r) {
    var d = r.fecha.replace(/-/g, ''), h = r.hora.replace(':', '') + '00';
    var fin = new Date(r.fecha + 'T' + r.hora + ':00'); fin.setMinutes(fin.getMinutes() + (r.min || 30));
    var dos = function (n) { return (n < 10 ? '0' : '') + n; };
    var hf = dos(fin.getHours()) + dos(fin.getMinutes()) + '00';
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Balder//Reservas//ES', 'BEGIN:VEVENT',
      'UID:' + r.codigo + '@gangabalder.es', 'DTSTART:' + d + 'T' + h, 'DTEND:' + d + 'T' + hf,
      'SUMMARY:Balder · ' + r.servicio, 'LOCATION:' + r.lugar, 'DESCRIPTION:Código de reserva ' + r.codigo,
      'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:Cita en Balder', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = 'reserva-balder-' + r.codigo + '.ics';
    document.body.appendChild(a); a.click(); a.remove();
    A.aviso('Archivo de calendario descargado');
  }
  on('reservado', function (d) {
    var r = d.reserva;
    $('#confirmacion-cuerpo').innerHTML =
      '<h2 id="t-confirmacion">¡Reserva confirmada!</h2><p class="codigo">' + esc(r.codigo) + '</p>' +
      '<dl class="detalle">' +
      '<div><dt>Cuándo</dt><dd>' + fechaLarga(r.fecha) + ' · ' + r.hora + '</dd></div>' +
      '<div><dt>Servicio</dt><dd>' + esc(r.servicio) + ' · ' + r.min + ' min</dd></div>' +
      '<div><dt>Dónde</dt><dd>' + esc(r.lugar) + '</dd></div>' +
      '<div><dt>Estilo</dt><dd>' + esc(r.estilo) + '</dd></div>' +
      '<div><dt>Pagado ahora</dt><dd>' + B.euros(r.ahora) + '</dd></div>' +
      (r.tienda ? '<div><dt>A pagar en la tienda</dt><dd>' + B.euros(r.tienda) + '</dd></div>' : '') + '</dl>' +
      '<p class="nota">Te avisaremos por SMS al número que has dado. Si no puedes venir, anula la cita con 24 horas de antelación.</p>' +
      '<div class="botones">' + (puedeDescargar ? '<button class="boton boton--oro" type="button" data-ics-conf>Añadir a mi calendario (.ics)</button>' : '') +
      '<a class="boton ' + (puedeDescargar ? 'boton--linea' : 'boton--oro') + '" href="' + enlaceGoogle(r) + '" target="_blank" rel="noopener">Google Calendar</a>' +
      (B.estado.usuario ? '<button class="boton boton--linea" type="button" data-ver-reservas>Ver mis reservas</button>' : '') +
      '<button class="boton boton--linea" type="button" data-cerrar>Cerrar</button></div>';
    if (puedeDescargar) $('[data-ics-conf]', dlgConf).onclick = function () { descargarIcs(r); };
    var ver = $('[data-ver-reservas]', dlgConf);
    if (ver) ver.onclick = function () { cerrar(dlgConf); setTimeout(function () { $('#boton-cuenta').click(); }, 280); };
    abrir(dlgConf);
    setTimeout(function () {
      var s = $('.sello-ok', dlgConf).getBoundingClientRect();
      A.chispas(s.left + s.width / 2, s.top + s.height / 2, { n: 120, fuerza: 1.2 });
    }, 650);
  });

  /* ---------- 6. Ficha de producto ---------- */
  var dlgProd = $('#dlg-producto');
  on('ficha', function (d) {
    var p = d.producto;
    function pintar() {
      var n = B.estado.cant[p.id] || 0;
      $('#producto-cuerpo').innerHTML =
        '<img class="ficha__foto" src="' + B.ruta('img/productos/' + p.id + '.jpg') + '" alt="' + esc(p.nombre) + ' Balder">' +
        '<div class="ficha__texto"><p class="etiqueta">Productos Balder · ' + p.formato + '</p><h2 id="t-producto">' + esc(p.nombre) + '</h2>' +
        '<p class="ficha__precio">' + B.euros(p.precio) + ' <small>IVA incluido</small></p>' +
        '<ul class="lista-check">' + p.beneficios.map(function (x) { return '<li>' + CHK + '<span>' + x + '</span></li>'; }).join('') + '</ul>' +
        '<p class="nota">Ingredientes premium: aceite de argán, romero, aloe vera y carbón activo.</p>' +
        '<button class="boton boton--oro boton--grande" type="button" data-anadir-ficha>' + (n ? 'Añadir otro · en el carrito: ' + n : 'Añadir al carrito') + '</button></div>';
      $('[data-anadir-ficha]', dlgProd).onclick = function () { B.cambiarCantidad(p.id, 1); pintar(); };
    }
    pintar();
    abrir(dlgProd);
  });

  /* ---------- 7. Visor de fotos ---------- */
  var dlgVisor = $('#dlg-visor'), vImg = $('#visor-img'), vPie = $('#visor-pie'), vFotos = [], vI = 0, vNombre = '';
  function verFoto(i, dir) {
    vI = (i + vFotos.length) % vFotos.length;
    vImg.classList.remove('entra-izq', 'entra-der'); void vImg.offsetWidth;
    if (dir) vImg.classList.add(dir > 0 ? 'entra-der' : 'entra-izq');
    vImg.src = vFotos[vI].src; vImg.alt = vFotos[vI].alt;
    vPie.textContent = vNombre + ' · ' + (vI + 1) + ' / ' + vFotos.length;
  }
  on('visor', function (d) {
    vFotos = $$('.carrusel__pista img', d.carrusel).map(function (im) { return { src: im.currentSrc || im.src, alt: im.alt }; });
    vNombre = d.carrusel.dataset.nombre || '';
    verFoto(d.indice || 0);
    abrir(dlgVisor);
  });
  $('.visor__flecha--ant').addEventListener('click', function () { verFoto(vI - 1, -1); });
  $('.visor__flecha--sig').addEventListener('click', function () { verFoto(vI + 1, 1); });
  dlgVisor.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') verFoto(vI + 1, 1);
    if (e.key === 'ArrowLeft') verFoto(vI - 1, -1);
  });
  var x0 = null;
  vImg.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
  vImg.addEventListener('pointerup', function (e) {
    if (x0 === null) return;
    var dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) verFoto(vI + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  });

  /* ---------- 8. Textos legales ----------
     Plantillas con los datos de la empresa entre corchetes. Las exige la
     LSSI (aviso legal) y el RGPD (privacidad). */
  var LEGAL = {
    aviso: ['Aviso legal', '<p>Titular: [RAZÓN SOCIAL], con CIF [CIF] y domicilio en [DIRECCIÓN]. Inscrita en el Registro Mercantil de [CIUDAD]. Contacto: hola@gangabalder.es.</p><p>Esta web informa de los servicios de la barbería Balder y permite reservar citas, comprar productos y contratar la membresía.</p>'],
    privacidad: ['Política de privacidad', '<p><strong>Responsable:</strong> [RAZÓN SOCIAL].</p><p><strong>Para qué usamos tus datos:</strong> gestionar tus reservas, avisarte de la cita y, si eres socio, tu membresía. Las fotos del escáner IA solo se usan para generar tus simulaciones y se borran a los 30 días.</p><p><strong>Base legal:</strong> la ejecución del servicio que pides y tu consentimiento.</p><p><strong>Tus derechos:</strong> puedes pedir acceso, rectificación, supresión, oposición y portabilidad escribiendo a hola@gangabalder.es. También puedes reclamar ante la Agencia Española de Protección de Datos.</p>'],
    cookies: ['Política de cookies', '<p>Esta web solo usa almacenamiento técnico del navegador para recordar tu sesión, tu plan y tus reservas. No usa cookies de publicidad ni de análisis, por eso no muestra un aviso para aceptarlas.</p>'],
    condiciones: ['Condiciones de la membresía', '<ul><li>Cuota mensual con IVA incluido, que se cobra por adelantado.</li><li>Permanencia mínima de 3 meses. Baja con 15 días de aviso.</li><li>Los servicios incluidos no se acumulan de un mes a otro.</li><li>Plan Socio: servicios incluidos de lunes a jueves antes de las 16:00.</li><li>Reserva con 24 horas de antelación. Si no te presentas, el servicio cuenta como usado.</li><li>Ganga Balder: incluido en Socio Balder; 25 € por visita en los demás planes. Zona de servicio: hasta 5 km del local.</li><li>Cupo limitado de socios para garantizar disponibilidad.</li></ul>']
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-legal]');
    if (!b) return;
    e.preventDefault();
    var t = LEGAL[b.getAttribute('data-legal')];
    $('#legal-cuerpo').innerHTML = '<h2 id="t-legal">' + t[0] + '</h2>' + t[1];
    abrir($('#dlg-legal'));
  });

  /* ---------- 9. Próximamente ---------- */
  $$('[data-pronto]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); A.aviso('La app Balder llegará pronto a App Store y Google Play'); });
  });

  pintarBotonCuenta();
})();
