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

  // Références : filtre par catégorie + recherche + fiche détaillée
  var refs = document.querySelectorAll('.ref');
  var dataEl = document.getElementById('refs-data');
  var DATA = dataEl ? JSON.parse(dataEl.textContent) : [];
  if (refs.length) {
    var current = 'all', q = '', onlyDet = false;
    var counter = document.getElementById('ref-count');
    var norm = function (s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
    var hay = DATA.map(function (d) { return norm([d.name, d.town, d.adr, d.sub, d.moa, d.moad, d.archi, d.bet, (d.p || []).join(' '), (d.lots || []).join(' ')].join(' ')); });
    function apply() {
      var n = 0;
      refs.forEach(function (r) {
        var i = +r.getAttribute('data-i'), d = DATA[i] || {};
        var ok = (current === 'all' || r.getAttribute('data-cat') === current) && (!q || (hay[i] || norm(r.textContent)).indexOf(q) > -1) && (!onlyDet || !!d.mt);
        r.hidden = !ok; if (ok) n++;
      });
      if (counter) counter.textContent = n + (n > 1 ? ' références' : ' référence');
    }
    var det = document.getElementById('ref-det');
    if (det) det.addEventListener('change', function () { onlyDet = det.checked; apply(); });

    var dlg = document.getElementById('ref-dialog');
    if (dlg && DATA.length) {
      var cur = 0, opener = null;
      var $ = function (id) { return document.getElementById(id); };
      var e = function (s) { var d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; };
      function visible() { return Array.prototype.filter.call(refs, function (r) { return !r.hidden; }).map(function (r) { return +r.getAttribute('data-i'); }); }
      function render(i) {
        cur = i; var d = DATA[i];
        $('rd-sub').textContent = d.cat + ' · ' + d.sub;
        $('rd-title').textContent = d.name;
        $('rd-town').textContent = d.adr || d.town || '';
        var media = $('rd-media'), inner = dlg.querySelector('.rd-inner');
        if (d.img && d.img.length) {
          inner.classList.remove('no-media'); media.hidden = false;
          media.innerHTML = '<div class="rd-main"><img src="' + e(d.img[0]) + '" alt="' + e(d.name) + '"></div>' +
            (d.img.length > 1 ? '<div class="rd-thumbs">' + d.img.map(function (s, k) { return '<button type="button" aria-label="Photo ' + (k + 1) + '"' + (k === 0 ? ' aria-current="true"' : '') + ' data-src="' + e(s) + '"><img src="' + e(s) + '" alt=""></button>'; }).join('') + '</div>' : '');
          media.querySelectorAll('.rd-thumbs button').forEach(function (b) {
            b.addEventListener('click', function () {
              media.querySelector('.rd-main img').src = b.getAttribute('data-src');
              media.querySelectorAll('.rd-thumbs button').forEach(function (o) { o.removeAttribute('aria-current'); });
              b.setAttribute('aria-current', 'true');
            });
          });
        } else { inner.classList.add('no-media'); media.hidden = true; media.innerHTML = ''; }
        var h = '';
        if (d.p) h += d.p.map(function (x) { return '<p>' + e(x) + '</p>'; }).join('');
        if (d.mt || d.dl) h += '<div class="kv">' + (d.mt ? '<div><b>' + e(d.mt) + '</b><span>montant du marché</span></div>' : '') + (d.dl ? '<div><b>' + e(d.dl) + '</b><span>délai global</span></div>' : '') + '</div>';
        if (d.lots) h += '<ul class="rd-lots">' + d.lots.map(function (l) { return '<li>' + e(l) + '</li>'; }).join('') + '</ul>';
        var rows = [['Réception', d.rc], ["Maître d'ouvrage", d.moa], ["Maître d'ouvrage délégué", d.moad], ['Architecte', d.archi], ["Bureau d'études", d.bet]].filter(function (r) { return r[1]; });
        if (rows.length) h += '<dl class="rd-dl">' + rows.map(function (r) { return '<dt>' + e(r[0]) + '</dt><dd>' + e(r[1]) + '</dd>'; }).join('') + '</dl>';
        if (!d.mt && !d.p) h += '<p class="rd-empty">Intervention de Thermique Sud Vendée sur ce bâtiment. Le détail du marché n\'est pas publié' + (d.img && d.img.length ? ', mais vous pouvez parcourir les photos du chantier.' : '.') + '</p>';
        $('rd-content').innerHTML = h;
        var v = visible(), pos = v.indexOf(i);
        $('rd-prev').disabled = pos <= 0; $('rd-next').disabled = pos < 0 || pos >= v.length - 1;
        try { history.replaceState(null, '', '#ref-' + i); } catch (err) {}
      }
      function open(i, from) {
        opener = from || null; render(i);
        if (typeof dlg.showModal === 'function') { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute('open', '');
        dlg.querySelector('.rd-close').focus();
      }
      function close() { if (dlg.open && dlg.close) dlg.close(); else dlg.removeAttribute('open'); }
      dlg.addEventListener('close', function () { try { history.replaceState(null, '', location.pathname + location.search); } catch (err) {} if (opener) opener.focus(); });
      dlg.addEventListener('click', function (ev) { if (ev.target === dlg) close(); });
      dlg.querySelector('.rd-close').addEventListener('click', close);
      $('rd-prev').addEventListener('click', function () { var v = visible(), p = v.indexOf(cur); if (p > 0) render(v[p - 1]); });
      $('rd-next').addEventListener('click', function () { var v = visible(), p = v.indexOf(cur); if (p > -1 && p < v.length - 1) render(v[p + 1]); });
      document.querySelectorAll('.ref, .feat').forEach(function (b) { b.addEventListener('click', function () { open(+b.getAttribute('data-i'), b); }); });
      var m = location.hash.match(/^#ref-(\d+)$/); if (m && DATA[+m[1]]) open(+m[1], document.getElementById('ref-' + m[1]));
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
