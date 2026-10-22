// Thermique Sud Vendée — scripts du site
(function () {
  var MAIL = 'info@thermique-sud-vendee.fr';
  var root = document.documentElement;

  // Menu mobile
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); burger.focus();
      }
    });
  }

  // Mode clair / sombre
  var toggles = document.querySelectorAll('.theme-toggle');
  function syncToggle() {
    var dark = root.getAttribute('data-theme') === 'dark';
    toggles.forEach(function (b) {
      b.setAttribute('aria-pressed', dark ? 'true' : 'false');
      b.setAttribute('aria-label', dark ? 'Activer le mode clair' : 'Activer le mode sombre');
    });
  }
  toggles.forEach(function (b) {
    b.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('tsv-theme', next); } catch (e) {}
      syncToggle();
    });
  });
  syncToggle();

  // Apparition au défilement
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -60px 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else { els.forEach(function (el) { el.classList.add('in'); }); }

  // Horaires : surligner le jour courant
  var day = new Date().getDay();
  document.querySelectorAll('.hours tr[data-days]').forEach(function (tr) {
    if (tr.getAttribute('data-days').split(',').indexOf(String(day)) > -1) tr.classList.add('today');
  });

  // Visionneuse d'images
  var gal = document.querySelectorAll('.gallery button');
  if (gal.length) {
    var lb = document.createElement('div');
    lb.className = 'lightbox'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Visionneuse de photos');
    lb.innerHTML = '<img alt=""><button class="lb-btn lb-close" aria-label="Fermer">×</button><button class="lb-btn lb-prev" aria-label="Photo précédente">‹</button><button class="lb-btn lb-next" aria-label="Photo suivante">›</button><div class="lb-count"></div>';
    document.body.appendChild(lb);
    var img = lb.querySelector('img'), count = lb.querySelector('.lb-count'), idx = 0, last = null;
    var items = Array.prototype.map.call(gal, function (b) { var i = b.querySelector('img'); return { src: b.getAttribute('data-full') || i.getAttribute('src'), alt: i.getAttribute('alt') }; });
    function show(n) { idx = (n + items.length) % items.length; img.src = items[idx].src; img.alt = items[idx].alt; count.textContent = (idx + 1) + ' / ' + items.length; }
    function close() { lb.classList.remove('open'); document.body.style.overflow = ''; if (last) last.focus(); }
    gal.forEach(function (b, i) { b.addEventListener('click', function () { last = b; show(i); lb.classList.add('open'); document.body.style.overflow = 'hidden'; lb.querySelector('.lb-close').focus(); }); });
    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function () { show(idx - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(idx - 1); if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  // Références : filtre par catégorie + recherche
  var refs = document.querySelectorAll('.ref');
  if (refs.length) {
    var current = 'all', q = '';
    var counter = document.getElementById('ref-count');
    var norm = function (s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
    function apply() {
      var n = 0;
      refs.forEach(function (r) {
        var ok = (current === 'all' || r.getAttribute('data-cat') === current) && (!q || norm(r.textContent).indexOf(q) > -1);
        r.hidden = !ok; if (ok) n++;
      });
      if (counter) counter.textContent = n + (n > 1 ? ' références' : ' référence');
    }
    document.querySelectorAll('.filters button').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('.filters button').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true'); current = b.getAttribute('data-cat'); apply();
      });
    });
    var search = document.getElementById('ref-q');
    if (search) search.addEventListener('input', function () { q = norm(search.value.trim()); apply(); });
    apply();
  }

  // Formulaires : préparent un e-mail dans la messagerie du visiteur
  function val(form, name) {
    var el = form.elements[name]; if (!el) return '';
    if (el.length && el[0] && el[0].type === 'radio') { for (var i = 0; i < el.length; i++) if (el[i].checked) return el[i].value; return ''; }
    return (el.value || '').trim();
  }
  document.querySelectorAll('form[data-mail]').forEach(function (form) {
    var params = new URLSearchParams(location.search);
    params.forEach(function (v, k) { var el = form.elements[k]; if (el && el.tagName === 'SELECT') el.value = v; });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var fields = form.getAttribute('data-fields').split(',');
      var lines = fields.map(function (f) {
        var p = f.split(':'); var v = val(form, p[0]);
        return p[1] + ' : ' + (v || '—');
      });
      var msg = val(form, 'message');
      var body = lines.join('\n') + (msg ? '\n\n' + msg : '');
      var subject = form.getAttribute('data-mail') + (val(form, 'nom') ? ' — ' + val(form, 'nom') : '');
      window.location.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      var m = form.querySelector('.form-msg'); if (m) m.classList.add('show');
    });
  });

  var y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
})();
