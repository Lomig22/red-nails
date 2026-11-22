/* ==========================================================================
   RED NAILS — app.js
   JavaScript vanilla, sans dépendance. Tout le contenu vient de config.js
   (window.RN_CONFIG). Sommaire :
      1. Utilitaires & prix             8. Livraison (date + ville)
      2. État & images                  9. Panier (addToCart + tiroir démo)
      3. Textes & rendus               10. Barre d'achat collante
      4. Galerie (swipe, flèches, zoom) 11. Pop-up promo
      5. Teintes                       12. Avis clientes
      6. Lots & prix                   13. Apparitions au défilement
      7. (réservé)                     14. Démarrage
   Portage Shopify : voir README.md.
   ========================================================================== */
(function () {
  'use strict';

  const C = window.RN_CONFIG;
  if (!C) { console.error('[RED NAILS] config.js introuvable.'); return; }

  /* ======================================================================
     1. UTILITAIRES & PRIX
     ====================================================================== */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const round2 = (n) => Math.round(n * 100) / 100;
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const getPath = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

  const moneyFmt = new Intl.NumberFormat(C.LOCALE, { style: 'currency', currency: C.CURRENCY });
  const moneyIntFmt = new Intl.NumberFormat(C.LOCALE, { style: 'currency', currency: C.CURRENCY, maximumFractionDigits: 0 });
  /** 24.99 → "24,99 €" ; 40 → "40 €" */
  const money = (n) => (Number.isInteger(n) ? moneyIntFmt : moneyFmt).format(n);
  const moneyFull = (n) => moneyFmt.format(n);

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
  const isDesktop = window.matchMedia('(min-width: 1000px)');

  /** sessionStorage protégé (navigation privée, cookies bloqués…) */
  const session = {
    get(k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) { /* ignoré */ } },
  };

  /* ---------- Pixel Meta + consentement (CNIL) ---------- */
  const META_STANDARD = ['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase', 'Lead'];
  const CONSENT_KEY = 'rn_consent';
  const pixelQueue = []; // événements en attente de la réponse de la visiteuse
  // Choix conservé 6 mois (recommandation CNIL), puis redemandé.
  const CONSENT_MAX_AGE = 182 * 24 * 3600 * 1000;
  const consentStore = {
    get() {
      try {
        const raw = window.localStorage.getItem(CONSENT_KEY);
        if (!raw) return null;
        const { v, t } = raw.charAt(0) === '{' ? JSON.parse(raw) : { v: raw, t: 0 };
        if (!t || Date.now() - t > CONSENT_MAX_AGE) { window.localStorage.removeItem(CONSENT_KEY); return null; }
        return v;
      } catch (e) { return null; }
    },
    set(v) { try { window.localStorage.setItem(CONSENT_KEY, JSON.stringify({ v, t: Date.now() })); } catch (e) { /* ignoré */ } },
  };
  let pixelLoaded = false;

  /**
   * Charge le pixel Meta, seulement après consentement.
   * Utilise le code de base officiel placé dans le <head> d'index.html
   * (window.rnLoadMetaPixel : init + PageView). S'il a déjà été chargé dans le
   * <head> (visiteuse ayant accepté lors d'une visite précédente), on ne le recharge pas.
   */
  function loadMetaPixel() {
    if (pixelLoaded || !C.META_PIXEL_ID) return;
    pixelLoaded = true;
    if (typeof window.fbq !== 'function') {
      if (typeof window.rnLoadMetaPixel === 'function') {
        window.rnLoadMetaPixel();
      } else {
        // Secours (pages sans le code du <head>) : même code officiel
        /* eslint-disable */
        !function (f, b, e, v, n, t, s) {
          if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
          if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
          n.queue = []; t = b.createElement(e); t.async = !0;
          t.src = v; s = b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t, s);
        }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
        /* eslint-enable */
        window.fbq('init', C.META_PIXEL_ID);
        window.fbq('track', 'PageView');
      }
    }
    while (pixelQueue.length) sendToPixels(...pixelQueue.shift());
  }

  function sendToPixels(event, data) {
    try {
      if (typeof window.fbq === 'function') window.fbq(META_STANDARD.includes(event) ? 'track' : 'trackCustom', event, data);
      if (window.ttq && typeof window.ttq.track === 'function') window.ttq.track(event, data);
    } catch (e) { /* un pixel ne doit jamais casser la page */ }
  }

  /** Événements publicitaires : envoyés tout de suite, mis en attente, ou ignorés si refus. */
  function track(event, data) {
    const consent = C.CONSENT && C.CONSENT.enabled ? consentStore.get() : 'granted';
    if (consent === 'granted' && pixelLoaded) sendToPixels(event, data);
    else if (consent !== 'denied') pixelQueue.push([event, data]);
    document.dispatchEvent(new CustomEvent('rn:' + event, { detail: data }));
  }

  function initConsent() {
    const banner = $('[data-consent]');
    if (!C.META_PIXEL_ID) return;
    if (!C.CONSENT || !C.CONSENT.enabled) { loadMetaPixel(); return; }
    $('[data-consent-more]').href = C.CONSENT.moreHref;
    const answer = (choice) => {
      consentStore.set(choice);
      banner.hidden = true;
      if (choice === 'granted') {
        loadMetaPixel(); if (typeof window.fbq === 'function') window.fbq('consent', 'grant');
        // Pixel Whop (code officiel dans le <head>), même consentement que Meta
        if (typeof window.rnLoadWhopPixel === 'function') window.rnLoadWhopPixel();
      }
      else {
        pixelQueue.length = 0;
        if (typeof window.fbq === 'function') window.fbq('consent', 'revoke');
        // retrait du consentement : on efface le repère "visiteuse qui revient" du pixel Whop
        try { window.localStorage.removeItem('rn_seen'); } catch (e) { /* ignoré */ }
      }
    };
    $$('[data-consent-choice]').forEach((b) => b.addEventListener('click', () => answer(b.dataset.consentChoice)));
    $('[data-consent-open]').addEventListener('click', () => { banner.hidden = false; });
    const saved = consentStore.get();
    if (saved === 'granted') loadMetaPixel();
    else if (saved !== 'denied') banner.hidden = false;
  }

  const P = C.PRODUCT;
  const UNIT = P.price;
  const params = new URLSearchParams(window.location.search);

  /** Couleur sélectionnée (state est défini plus bas, appelé seulement après). */
  function activeColor() { return state.color; }
  /** Caractéristiques du kit d'une couleur : PRODUCT, surchargé par color.kit. */
  const specOf = (color) => Object.assign(
    { nailsPerKit: P.nailsPerKit, sizes: P.sizes, perSize: P.perSize, length: P.length, width: P.width },
    color && color.kit
  );
  const nailsFor = (kits, color = activeColor()) => kits * specOf(color).nailsPerKit;
  /** Prix par ongle arrondi au centime : 24,99 / 30 = 0,83 € */
  const perNail = (price, kits, color = activeColor()) => round2(price / nailsFor(kits, color));

  /** Lots : prix barré = quantité × prix unitaire réellement pratiqué. */
  const BUNDLES = C.BUNDLES.map((b) => {
    const regular = round2(UNIT * b.qty);
    let compareAt = null;
    if (b.qty > 1 && b.price < regular) compareAt = regular;
    // Kit seul : prix barré UNIQUEMENT si PRIX_REFERENCE est renseigné.
    if (b.qty === 1 && C.PRIX_REFERENCE && C.PRIX_REFERENCE > b.price) compareAt = C.PRIX_REFERENCE;
    // Arrondi à l'inférieur : la réduction affichée n'est jamais surévaluée.
    const discount = compareAt ? Math.floor((1 - b.price / compareAt) * 100 + 1e-6) : 0;
    return Object.assign({}, b, { compareAt, discount, freeShipping: b.qty >= C.SHIPPING.freeFromKits });
  });
  const BEST_BUNDLE = BUNDLES.reduce((best, b, i) => (b.price / b.qty < BUNDLES[best].price / BUNDLES[best].qty ? i : best), 0);

  /** Prix d'un nombre de kits quelconque : les plus gros lots d'abord. */
  function priceForKits(kits) {
    const sorted = BUNDLES.slice().sort((a, b) => b.qty - a.qty);
    let left = kits, total = 0;
    sorted.forEach((b) => { while (left >= b.qty) { total += b.price; left -= b.qty; } });
    return round2(total + left * UNIT);
  }

  const D = C.DELIVERY;
  const pad = (n) => String(n).padStart(2, '0');
  const COLORS = C.COLORS.filter((c) => !c.hidden);

  /** Variables communes à tous les textes : {cutoff}, {maxDiscount}… */
  const VARS = {
    price: money(UNIT),
    minPerNail: money(Math.min(...COLORS.map((c) => perNail(BUNDLES[BEST_BUNDLE].price, BUNDLES[BEST_BUNDLE].qty, c)))),
    maxDiscount: Math.max(0, ...BUNDLES.map((b) => b.discount)),
    shipping: money(C.SHIPPING.price),
    freeFrom: C.SHIPPING.freeFromKits,
    cutoff: D.cutoffMinute ? `${D.cutoffHour}h${pad(D.cutoffMinute)}` : `${D.cutoffHour}h`,
    minDays: D.minDays,
    maxDays: D.maxDays,
    returnDays: C.RETURN_DAYS,
    colorCount: COLORS.length,
    year: new Date().getFullYear(),
  };
  /** Variables qui dépendent de la teinte choisie. */
  function colorVars(color = activeColor()) {
    const k = specOf(color);
    return { nails: k.nailsPerKit, sizes: k.sizes, perSize: k.perSize, length: k.length, width: k.width, perNail: money(perNail(UNIT, 1, color)), color: color.name };
  }
  /** Remplace les {variables} d'un texte. */
  const t = (str, extra) => String(str == null ? '' : str).replace(/\{(\w+)\}/g, (m, k) => {
    const all = Object.assign({}, VARS, colorVars(), extra);
    return k in all ? all[k] : m;
  });

  /* ======================================================================
     2. ÉTAT & IMAGES
     ====================================================================== */
  // Teinte / lot imposés par l'adresse (?couleur=…&lot=…) : désactivé par défaut
  // (URL_PRESELECT: false) pour que chaque arrivée tombe sur la teinte des pubs.
  const urlColor = C.URL_PRESELECT ? COLORS.find((c) => c.id === params.get('couleur')) : null;
  const urlBundle = C.URL_PRESELECT ? BUNDLES.findIndex((b) => String(b.qty) === params.get('lot')) : -1;
  // Nettoie les anciennes adresses du type ?couleur=noir-laque (anciens liens, historique, favoris)
  if (!C.URL_PRESELECT && (params.has('couleur') || params.has('lot'))) {
    try {
      const u = new URL(window.location.href);
      u.searchParams.delete('couleur');
      u.searchParams.delete('lot');
      window.history.replaceState(null, '', u);
    } catch (e) { /* file:// */ }
  }

  const state = {
    color: urlColor || COLORS.find((c) => c.id === C.DEFAULT_COLOR) || COLORS[0],
    bundle: urlBundle >= 0 ? urlBundle : clamp(C.DEFAULT_BUNDLE || 0, 0, BUNDLES.length - 1),
    bundleTouched: urlBundle >= 0,
    slide: 0,
    city: null,
    cart: [], // { variantId, colorId, kits }
  };
  const currentBundle = () => BUNDLES[state.bundle];
  const hasPhotos = (color) => Array.isArray(color.images) && color.images.length > 0;

  /** Galerie d'une couleur : [{ src, alt, label }] (photos réelles ou visuels par défaut). */
  function galleryOf(color) {
    if (hasPhotos(color)) {
      return color.images.map((img, i) => {
        const v = C.GALLERY_VIEWS[i] || C.GALLERY_VIEWS[0];
        if (typeof img === 'string') return { src: img, alt: t(v.alt, { color: color.name }), label: v.label };
        return { src: img.src, alt: t(img.alt || v.alt, { color: color.name }), label: img.label || v.label };
      });
    }
    return C.GALLERY_VIEWS.map((v) => ({ src: `images/${color.id}/${v.file}.${C.IMAGE_EXT}`, alt: t(v.alt, { color: color.name }), label: v.label }));
  }
  const imageAt = (color, i) => { const g = galleryOf(color); return g[clamp(i, 0, g.length - 1)]; };
  const pick = (color, key, fallback) => imageAt(color, color[key] != null ? color[key] : fallback);

  /** Icônes au trait fin (inline, pas de requête). */
  const ICONS = {
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    repeat: '<path d="M17 3l3 3-3 3"/><path d="M4 11V9.5A3.5 3.5 0 0 1 7.5 6H20"/><path d="M7 21l-3-3 3-3"/><path d="M20 13v1.5a3.5 3.5 0 0 1-3.5 3.5H4"/>',
    drop: '<path d="M12 3.5c3 3.6 5.5 6.6 5.5 9.7a5.5 5.5 0 0 1-11 0c0-3.1 2.5-6.1 5.5-9.7Z"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/>',
    return: '<path d="M9 14 4.5 9.5 9 5"/><path d="M4.5 9.5H15a4.5 4.5 0 0 1 0 9h-3"/>',
    truck: '<path d="M3 6.5h11v9.5H3z"/><path d="M14 9.5h3.8l3.2 3.3v3.2h-7"/><circle cx="7" cy="17.8" r="1.8"/><circle cx="17" cy="17.8" r="1.8"/>',
    check: '<path d="M5 12.5 10 17l9-10"/>',
    cart: '<path d="M5.5 8h13l-1 12.5h-11L5.5 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
    box: '<path d="M3.5 8 12 3.5 20.5 8v8L12 20.5 3.5 16z"/><path d="M3.5 8 12 12.5 20.5 8M12 12.5v8"/>',
    home: '<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/>',
    pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>',
    star: '<path d="m12 3.2 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" fill="currentColor" stroke="none"/>',
    starEmpty: '<path d="m12 3.2 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/>',
    sparkle: '<path d="M12 3v5M12 16v5M3 12h5M16 12h5M6.3 6.3l2.5 2.5M15.2 15.2l2.5 2.5M6.3 17.7l2.5-2.5M15.2 8.8l2.5-2.5"/>',
  };
  const icon = (name, size = 18, stroke = 1.4) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  const starsHtml = (rating, size = 14) => `<span class="stars" aria-hidden="true">${[1, 2, 3, 4, 5].map((n) => icon(n <= Math.round(rating) ? 'star' : 'starEmpty', size, 1.2)).join('')}</span>`;
  const num2 = (n) => String(n).padStart(2, '0');

  const live = (msg) => { const el = $('[data-live]'); if (el) { el.textContent = ''; setTimeout(() => { el.textContent = msg; }, 50); } };

  /* ======================================================================
     3. TEXTES & RENDUS
     ====================================================================== */
  function renderTexts() {
    $$('[data-t]').forEach((el) => {
      const val = getPath(C, el.getAttribute('data-t'));
      if (typeof val === 'string') el.textContent = t(val);
    });
  }

  function renderAnnouncement() {
    const items = C.TEXTS.announce.map((txt) => `<span class="announce__item">${esc(t(txt))}</span>`).join('');
    $('[data-render="announce"]').innerHTML = items + `<span class="announce__clone" data-clone>${items}</span>`;
    $('[data-render="announce-sr"]').textContent = C.TEXTS.announce.map((x) => t(x)).join(' · ');
  }

  function renderStatic() {
    $('[data-render="promises"]').innerHTML = P.promises.map((p) => `<li>${icon(p.icon, 15)}<span>${esc(t(p.text))}</span></li>`).join('');
    $('[data-render="reassurance"]').innerHTML = C.TEXTS.reassurance
      .map((r) => `<li>${icon(r.icon, 22, 1.3)}<strong>${esc(t(r.title))}</strong><span>${esc(t(r.text))}</span></li>`).join('');
    $('[data-render="footer-links"]').innerHTML = C.TEXTS.footer.links.map((l) => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`).join('');
    $('[data-footer-copy]').textContent = t(C.TEXTS.footer.copyright);
    $('[data-done]').innerHTML = icon('sparkle', 20) + `<span>${esc(t(C.TEXTS.steps.done))}</span>`;

    // CTA répétés
    $$('[data-render="cta"]').forEach((band) => {
      const inverse = band.classList.contains('cta-band--inverse');
      band.innerHTML = `
        <button class="btn ${inverse ? 'btn--white' : 'btn--primary'} btn--glow" type="button" data-cta-offers>${esc(t(C.TEXTS.cta))}</button>
        <p class="cta-band__note">${esc(t(C.TEXTS.ctaNote))}</p>`;
    });
    renderColorTexts();
  }

  /** Textes qui changent avec la teinte (nb d'ongles, tailles, dimensions). */
  function renderColorTexts() {
    renderTexts();
    $('[data-title]').textContent = t(P.title);
    $('[data-title-accent]').textContent = t(P.titleAccent);

    $('[data-render="details"]').innerHTML = C.TEXTS.details.items.map((d, i) => `
      <li>
        <span class="details__num">N°${num2(i + 1)}</span>
        <h3 class="details__title">${esc(t(d.title))}</h3>
        <p class="details__text">${esc(t(d.text))}</p>
      </li>`).join('');

    $('[data-render="steps"]').innerHTML = C.TEXTS.steps.items.map((s, i) => `
      <li class="step">
        <span class="step__num" aria-hidden="true">${num2(i + 1)}</span>
        <span class="step__time">${esc(t(s.time))}</span>
        <h3 class="step__title"><span class="sr-only">Étape ${i + 1} : </span>${esc(t(s.title))}</h3>
        <p class="step__text">${esc(t(s.text))}</p>
        ${s.tip ? `<p class="step__tip"><b>Astuce</b>${esc(t(s.tip))}</p>` : ''}
      </li>`).join('');

    $('[data-render="kit"]').innerHTML = C.TEXTS.kit.items.map((k) => `
      <li>
        <span class="kit__qty">${esc(/^\d$/.test(t(k.qty)) ? num2(t(k.qty)) : t(k.qty))}</span>
        <h3 class="kit__name">${esc(t(k.title))}</h3>
        <p class="kit__text">${esc(t(k.text))}</p>
      </li>`).join('');
    $('[data-render="specs"]').innerHTML = C.TEXTS.kit.specs.map((s) => `<div><dt>${esc(t(s.label))}</dt><dd>${esc(t(s.value))}</dd></div>`).join('');

    const open = $$('[data-render="faq"] details').map((d) => d.open);
    $('[data-render="faq"]').innerHTML = C.TEXTS.faq.items.map((f) => `
      <details>
        <summary>${esc(t(f.q))}</summary>
        <div class="faq__answer"><p>${esc(t(f.a))}</p></div>
      </details>`).join('');
    $$('[data-render="faq"] details').forEach((d, i) => { if (open[i]) d.open = true; });
  }

  /* ======================================================================
     4. GALERIE — swipe natif (comme Instagram), flèches, points, miniatures, zoom
     ====================================================================== */
  const gallery = {
    vp: null,
    zoomed: false,
    count: 0,

    render() {
      const views = galleryOf(state.color);
      const track = $('[data-render="slides"]');
      const slide = (i) => `
        <div class="gallery__slide" role="group" aria-roledescription="diapositive" aria-label="${i + 1} sur ${views.length}">
          <img src="${esc(views[i].src)}" alt="${esc(views[i].alt)}" width="800" height="800"
               ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" draggable="false">
        </div>`;
      // On garde la 1re image écrite en dur dans index.html si c'est la bonne (LCP).
      const first = track.querySelector('.gallery__slide img');
      if (first && first.getAttribute('src') === views[0].src && track.children.length === 1) {
        const s = first.parentElement;
        s.setAttribute('role', 'group');
        s.setAttribute('aria-roledescription', 'diapositive');
        s.setAttribute('aria-label', `1 sur ${views.length}`);
        first.alt = views[0].alt;
        first.draggable = false;
        track.insertAdjacentHTML('beforeend', views.slice(1).map((v, k) => slide(k + 1)).join(''));
      } else {
        track.innerHTML = views.map((v, i) => slide(i)).join('');
      }
      this.count = views.length;
      $('[data-render="thumbs"]').innerHTML = views.map((v, i) => `
        <button class="thumb" type="button" data-thumb="${i}" aria-label="Voir la photo : ${esc(v.label)}" aria-current="${i === 0}">
          <img src="${esc(v.src)}" alt="" width="74" height="74" loading="lazy" decoding="async">
        </button>`).join('');
      $('[data-render="dots"]').innerHTML = views.map((v, i) => `<i${i === 0 ? ' class="is-active"' : ''}></i>`).join('');
      const single = views.length < 2;
      $$('[data-gallery-prev], [data-gallery-next], [data-render="dots"]').forEach((el) => { el.hidden = single; });
    },

    swap() {
      const track = $('[data-render="slides"]');
      const apply = () => {
        this.unzoom();
        track.textContent = '';
        this.render();
        this.vp.scrollLeft = 0;
        this.setActive(0);
        track.classList.remove('is-swapping');
      };
      if (reducedMotion.matches) return apply();
      track.classList.add('is-swapping');
      setTimeout(apply, 180);
    },

    goTo(i, smooth = true) {
      const n = this.count;
      i = (i + n) % n;
      this.unzoom();
      this.vp.scrollTo({ left: i * this.vp.clientWidth, behavior: smooth && !reducedMotion.matches ? 'smooth' : 'auto' });
      this.setActive(i);
    },

    setActive(i) {
      state.slide = i;
      this.vp.parentElement.classList.toggle('is-first', i === 0);
      $$('.thumb').forEach((b, k) => b.setAttribute('aria-current', String(k === i)));
      $$('[data-render="dots"] i').forEach((d, k) => d.classList.toggle('is-active', k === i));
      $('[data-gallery-count]').textContent = `${i + 1} / ${this.count}`;
      const row = $('[data-render="thumbs"]');
      const th = $$('.thumb')[i];
      if (row && th && row.scrollWidth > row.clientWidth) {
        row.scrollTo({ left: th.offsetLeft - row.offsetLeft - (row.clientWidth - th.offsetWidth) / 2, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
      }
    },

    currentImg() { return $$('.gallery__slide img', this.vp)[state.slide]; },
    setOrigin(clientX, clientY) {
      const img = this.currentImg(); if (!img) return;
      const r = this.vp.getBoundingClientRect();
      img.style.transformOrigin = `${clamp(((clientX - r.left) / r.width) * 100, 0, 100)}% ${clamp(((clientY - r.top) / r.height) * 100, 0, 100)}%`;
    },
    zoom(clientX, clientY) {
      const img = this.currentImg(); if (!img) return;
      this.setOrigin(clientX, clientY);
      img.classList.add('is-zoomed');
      this.vp.classList.add('is-zoomed');
      this.vp.parentElement.classList.add('is-zoomed');
      this.zoomed = true;
    },
    unzoom() {
      if (!this.vp) return;
      $$('img.is-zoomed', this.vp).forEach((img) => img.classList.remove('is-zoomed'));
      this.vp.classList.remove('is-zoomed');
      this.vp.parentElement.classList.remove('is-zoomed');
      this.zoomed = false;
    },

    init() {
      const vp = (this.vp = $('#gallery-viewport'));
      this.render();
      this.setActive(0);

      let ticking = false;
      vp.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const i = Math.round(vp.scrollLeft / vp.clientWidth);
          if (i !== state.slide) this.setActive(clamp(i, 0, this.count - 1));
          ticking = false;
        });
      }, { passive: true });

      $('[data-gallery-prev]').addEventListener('click', () => this.goTo(state.slide - 1));
      $('[data-gallery-next]').addEventListener('click', () => this.goTo(state.slide + 1));
      $('[data-render="thumbs"]').addEventListener('click', (e) => {
        const b = e.target.closest('[data-thumb]');
        if (b) this.goTo(Number(b.dataset.thumb));
      });
      vp.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); this.goTo(state.slide + 1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); this.goTo(state.slide - 1); }
        if (e.key === 'Escape') this.unzoom();
      });

      // Desktop : zoom x2,5 au survol, qui suit la souris
      vp.addEventListener('mouseenter', (e) => { if (canHover.matches) this.zoom(e.clientX, e.clientY); });
      vp.addEventListener('mousemove', (e) => {
        if (!canHover.matches) return;
        if (!this.zoomed) this.zoom(e.clientX, e.clientY); else this.setOrigin(e.clientX, e.clientY);
      });
      vp.addEventListener('mouseleave', () => { if (canHover.matches) this.unzoom(); });
      // Mobile : un tap active / désactive le zoom ; on glisse le doigt pour explorer
      vp.addEventListener('click', (e) => {
        if (canHover.matches) return;
        if (this.zoomed) this.unzoom(); else this.zoom(e.clientX, e.clientY);
      });
      vp.addEventListener('touchmove', (e) => {
        if (!this.zoomed || e.touches.length !== 1) return;
        e.preventDefault();
        this.setOrigin(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: false });

      window.addEventListener('resize', () => { vp.scrollLeft = state.slide * vp.clientWidth; });
    },
  };

  /* ======================================================================
     5. TEINTES
     ====================================================================== */
  const swatchStyle = (c) => `--c:${c.hex};` + (c.tip ? `--tip:${c.tip};` : '');

  function renderColors() {
    $('[data-render="swatches"]').innerHTML = COLORS.map((c) => `
      <label class="swatch" title="${esc(c.name)}">
        <input type="radio" name="color" value="${esc(c.id)}" autocomplete="off" ${c === state.color ? 'checked' : ''}>
        <span style="${swatchStyle(c)}" ${c.tip ? 'data-tip' : ''}><span class="sr-only">${esc(c.name)}</span></span>
      </label>`).join('');

    // Cartes : le produit seul sur fond neutre (ou un aplat de la teinte en attendant les photos)
    $('[data-render="color-cards"]').innerHTML = COLORS.map((c) => {
      const media = hasPhotos(c)
        ? `<img src="${esc(pick(c, 'cardImage', 0).src)}" alt="" width="400" height="400" loading="lazy" decoding="async">`
        : `<span class="shade__flat"><i style="${swatchStyle(c)}" ${c.tip ? 'data-tip' : ''}></i></span><span class="shade__soon">${esc(C.TEXTS.colors.soon)}</span>`;
      return `
      <li>
        <button class="shade" type="button" data-color-card="${esc(c.id)}" aria-pressed="${c === state.color}">
          <span class="shade__media">${media}</span>
          <span class="shade__body">
            <span class="shade__name"><i style="${swatchStyle(c)}"></i>${esc(c.name)}</span>
            <span class="shade__desc">${esc(c.desc || '')}</span>
            <span class="shade__pill" data-pill></span>
            <span class="shade__meta" data-pill-meta></span>
          </span>
        </button>
      </li>`;
    }).join('');

    $('[data-render="swatches"]').addEventListener('change', (e) => { if (e.target.name === 'color') setColor(e.target.value); });
    // Carte teinte = achat direct : ajout au panier puis passage au paiement (pas de retour en haut).
    $('[data-render="color-cards"]').addEventListener('click', (e) => {
      const card = e.target.closest('[data-color-card]');
      if (!card) return;
      const color = COLORS.find((c) => c.id === card.dataset.colorCard);
      if (!color) return;
      $('[data-pill]', card).textContent = C.TEXTS.colors.redirecting;
      card.setAttribute('aria-busy', 'true');
      buyNow(color, shadeBundle().qty);
    });
    updateShadeButtons();
  }

  /**
   * Lot proposé par les cartes teintes : toujours 1 kit (24,99 €), indépendamment
   * du lot sélectionné dans la fiche produit (réglable : C.SHADE_CARD_QTY).
   */
  const shadeBundle = () => BUNDLES.find((b) => b.qty === (C.SHADE_CARD_QTY || 1)) || BUNDLES[0];

  /** Libellés des boutons des cartes teintes : "Commander · 24,99 €" + "1 kit · livraison offerte". */
  function updateShadeButtons() {
    const b = shadeBundle();
    $$('[data-color-card]').forEach((card) => {
      $('[data-pill]', card).textContent = t(C.TEXTS.colors.buy, { price: money(b.price) });
      $('[data-pill-meta]', card).textContent = t(C.TEXTS.colors.buyMeta, { bundle: b.label, shipping: b.freeShipping ? C.TEXTS.product.freeShipping.toLowerCase() : t(C.TEXTS.colors.shippingPaid) });
    });
  }

  function setColor(id, opts = {}) {
    const color = COLORS.find((c) => c.id === id);
    if (!color) return;
    const changed = color !== state.color;
    state.color = color;

    $('[data-color-name]').textContent = color.name;
    $$('input[name="color"]').forEach((input) => { input.checked = input.value === id; });
    $$('[data-color-card]').forEach((card) => {
      const on = card.dataset.colorCard === id;
      card.setAttribute('aria-pressed', String(on));
    });
    const thumb = pick(color, 'thumbImage', 0);
    $('[data-sticky-thumb]').src = thumb.src;
    $('[data-sticky-thumb]').alt = color.name;
    const kit = pick(color, 'kitImage', 4);
    $('[data-kit-img]').src = kit.src;
    $('[data-kit-img]').alt = kit.alt;
    const det = pick(color, 'detailImage', 0);
    $('[data-detail-img]').src = det.src;
    $('[data-detail-img]').alt = det.alt;

    if (changed) {
      renderColorTexts();
      renderBundles();
    }
    updatePrice(false);

    if (changed && !opts.silent) {
      gallery.swap();
      live(`Teinte sélectionnée : ${color.name}`);
      // Volontairement, l'adresse de la page n'est PAS modifiée : un rechargement ou un
      // lien partagé ramène toujours sur la teinte par défaut (Bordeaux, celle des pubs).
    }
  }

  /* ======================================================================
     6. LOTS & PRIX
     ====================================================================== */
  function renderBundles() {
    const tx = C.TEXTS.product;
    $('[data-render="bundles"]').innerHTML = BUNDLES.map((b, i) => `
      <label class="bundle${i === state.bundle ? ' is-checked' : ''}">
        <input type="radio" name="bundle" value="${i}" autocomplete="off" ${i === state.bundle ? 'checked' : ''}>
        <span class="bundle__radio" aria-hidden="true"></span>
        <span class="bundle__main">
          <span class="bundle__title">${esc(b.label)}${b.discount ? ` <span class="bundle__off">-${b.discount} %</span>` : ''}</span>
          <span class="bundle__sub">${esc(t(tx.nailsCount, { count: nailsFor(b.qty) }))} · <strong>${money(perNail(b.price, b.qty))}/ongle</strong></span>
          ${b.freeShipping ? `<span class="bundle__ship">${icon('truck', 14)}${esc(tx.freeShipping)}</span>` : ''}
        </span>
        <span class="bundle__price">
          ${b.compareAt ? `<s><span class="sr-only">au lieu de </span>${money(b.compareAt)}</s>` : ''}
          <strong>${money(b.price)}</strong>
        </span>
        ${b.highlight ? `<span class="bundle__flag">${esc(b.highlight)}</span>` : ''}
      </label>`).join('');
  }

  function initBundles() {
    renderBundles();
    $('[data-render="bundles"]').addEventListener('change', (e) => {
      if (e.target.name !== 'bundle') return;
      state.bundleTouched = true;
      setBundle(Number(e.target.value));
    });
  }

  function setBundle(i) {
    state.bundle = i;
    $$('input[name="bundle"]').forEach((input) => {
      input.checked = Number(input.value) === i;
      input.closest('.bundle').classList.toggle('is-checked', input.checked); // secours sans :has()
    });
    updatePrice(true);
  }

  function updatePrice(animate) {
    const b = currentBundle();
    const tx = C.TEXTS.product;
    const now = $('[data-price-now]');
    now.textContent = money(b.price);
    const was = $('[data-price-was]');
    const badge = $('[data-price-badge]');
    was.hidden = badge.hidden = !b.compareAt;
    if (b.compareAt) {
      was.innerHTML = `<span class="sr-only">au lieu de </span>${money(b.compareAt)}`;
      badge.textContent = `-${b.discount} %`;
    }
    const pn = esc(t(tx.perNail, { value: money(perNail(b.price, b.qty)) }));
    $('[data-price-meta]').innerHTML = b.compareAt
      ? `<strong>${esc(t(tx.save, { amount: moneyFull(round2(b.compareAt - b.price)) }))}</strong> · ${pn}`
      : pn;
    if (animate && !reducedMotion.matches) { now.classList.remove('is-added'); void now.offsetWidth; now.classList.add('is-added'); }

    $('[data-cta-price]').textContent = money(b.price);
    if ($('[data-pill]')) updateShadeButtons();
    const ship = $('[data-ship-line]');
    ship.classList.toggle('is-free', b.freeShipping);
    ship.innerHTML = icon(b.freeShipping ? 'check' : 'truck', 16) + `<span>${esc(t(b.freeShipping ? tx.shippingFree : tx.shippingPaid))}</span>`;
    updateSticky();
  }

  /** CTA répétés : remonte au sélecteur de lots. */
  function goToOffers() {
    if (C.CTA_PRESELECT_BEST && !state.bundleTouched) setBundle(BEST_BUNDLE);
    $('#offres').scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'center' });
    const list = $('[data-render="bundles"]');
    list.classList.remove('is-flash'); void list.offsetWidth; list.classList.add('is-flash');
    const checked = $('input[name="bundle"]:checked');
    if (checked) setTimeout(() => checked.focus({ preventScroll: true }), reducedMotion.matches ? 0 : 450);
  }

  /* ======================================================================
     8. LIVRAISON — date calculée + ville de la visiteuse
     ====================================================================== */
  function nowInZone() {
    const now = new Date();
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: D.timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
      }).formatToParts(now).reduce((o, p) => { o[p.type] = p.value; return o; }, {});
      return new Date(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute, +parts.second);
    } catch (e) { return now; }
  }
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const isOpenDay = (d, days) => days.includes(d.getDay()) && !D.holidays.includes(ymd(d));
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  function nextOpenDay(d, days) { let x = addDays(startOfDay(d), 1); while (!isOpenDay(x, days)) x = addDays(x, 1); return x; }
  function addOpenDays(d, n, days) { let x = startOfDay(d); let left = n; while (left > 0) { x = addDays(x, 1); if (isOpenDay(x, days)) left--; } return x; }

  function computeDelivery(now) {
    const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate(), D.cutoffHour, D.cutoffMinute || 0);
    const shipsToday = isOpenDay(now, D.shipDays) && now < cutoff;
    const shipDate = shipsToday ? startOfDay(now) : nextOpenDay(now, D.shipDays);
    return {
      shipsToday,
      msLeft: shipsToday ? cutoff - now : 0,
      shipDate,
      from: addOpenDays(shipDate, D.minDays, D.deliveryDays),
      to: addOpenDays(shipDate, D.maxDays, D.deliveryDays),
    };
  }

  const dateFmt = new Intl.DateTimeFormat(C.LOCALE, { weekday: 'short', day: 'numeric', month: 'short' });
  const weekdayFmt = new Intl.DateTimeFormat(C.LOCALE, { weekday: 'long' });
  const shortFmt = new Intl.DateTimeFormat(C.LOCALE, { day: 'numeric', month: 'short' });
  function formatLeft(ms) {
    const totalMin = Math.max(1, Math.ceil(ms / 60000));
    const h = Math.floor(totalMin / 60), m = totalMin % 60;
    return h ? `${h} h ${pad(m)} min` : `${m} min`;
  }

  function renderDelivery() {
    const now = nowInZone();
    const d = computeDelivery(now);
    const tx = C.TEXTS.delivery;
    const tomorrow = startOfDay(addDays(now, 1));
    const shipLabel = d.shipsToday ? tx.today : (d.shipDate.getTime() === tomorrow.getTime() ? tx.tomorrow : weekdayFmt.format(d.shipDate));

    const title = $('[data-delivery-title]');
    title.innerHTML = icon('pin', 18) + (state.city
      ? esc(tx.title).replace('{city}', `<em>${esc(state.city)}</em>`)
      : esc(tx.titleNoCity));

    const head = d.shipsToday
      ? esc(tx.countdown).replace('{time}', `<strong class="eta__time">${formatLeft(d.msLeft)}</strong>`).replace('{shipLabel}', `<strong>${esc(shipLabel)}</strong>`)
      : esc(tx.noCountdown).replace('{shipLabel}', `<strong>${esc(shipLabel)}</strong>`);
    const range = esc(tx.range).replace('{from}', `<strong>${esc(dateFmt.format(d.from))}</strong>`).replace('{to}', `<strong>${esc(dateFmt.format(d.to))}</strong>`);
    const dot = (html) => (/\.(<\/strong>)?$/.test(html) ? html : html + '.');
    $('[data-eta-text]').innerHTML = `${dot(head)} ${dot(range)}`;

    const steps = [
      { icon: 'cart', date: tx.today, cls: 'is-done' },
      { icon: 'box', date: d.shipsToday ? tx.today : dateFmt.format(d.shipDate), cls: 'is-next' },
      { icon: 'home', date: `${shortFmt.format(d.from)} – ${shortFmt.format(d.to)}`, cls: '' },
    ];
    $('[data-eta-steps]').innerHTML = steps.map((s, i) => `
      <li class="eta__step ${s.cls}">
        <span class="eta__icon">${icon(s.icon, 14)}</span>
        <span class="eta__label">${esc(tx.steps[i])}</span>
        <span class="eta__date">${esc(s.date)}</span>
      </li>`).join('');
  }

  /** Ville de la visiteuse à partir de son IP (sans demande d'autorisation). */
  async function locateCity() {
    if (!D.geolocate || !D.geoUrl || !window.fetch) return null;
    const cached = session.get('rn_city');
    if (cached !== null) return cached || null;
    try {
      const ctrl = 'AbortController' in window ? new AbortController() : null;
      const timer = setTimeout(() => ctrl && ctrl.abort(), 3000);
      const res = await fetch(D.geoUrl, { signal: ctrl ? ctrl.signal : undefined, credentials: 'omit' });
      clearTimeout(timer);
      const data = await res.json();
      const city = data && data.country_code === 'FR' && typeof data.city === 'string' ? data.city.trim() : '';
      session.set('rn_city', city);
      return city || null;
    } catch (e) {
      return null;
    }
  }

  function initDelivery() {
    renderDelivery();
    const msToNextMinute = 60000 - (Date.now() % 60000) + 50;
    setTimeout(() => { renderDelivery(); setInterval(renderDelivery, 60000); }, msToNextMinute);
    locateCity().then((city) => { if (city) { state.city = city; renderDelivery(); } });
  }

  /* ======================================================================
     9. PANIER — addToCart(variantId, qty) + tiroir de démonstration
     ====================================================================== */
  const cartEl = () => $('#cart');
  const totalKits = () => state.cart.reduce((s, l) => s + l.kits, 0);

  /**
   * Ajoute au panier. Point d'entrée unique, appelé par tous les boutons.
   * Portage Shopify : remplacer le contenu par fetch('/cart/add.js', …) (README).
   */
  function addToCart(variantId, qty, opts = {}) {
    qty = Math.max(1, parseInt(qty, 10) || 1);
    const color = C.COLORS.find((c) => c.variantId === variantId) || state.color;
    const line = state.cart.find((l) => l.variantId === variantId);
    if (line) line.kits += qty; else state.cart.push({ variantId, colorId: color.id, kits: qty });

    track('AddToCart', { content_ids: [variantId], content_name: `${t(P.title, colorVars(color))} – ${color.name}`, content_type: 'product', quantity: qty, value: priceForKits(qty), currency: C.CURRENCY });
    renderCart();
    const btn = $('[data-open-cart]');
    btn.classList.remove('is-bump'); void btn.offsetWidth; btn.classList.add('is-bump');
    live(`${C.TEXTS.cart.added} : ${qty} kit(s) ${color.name}`);
    if (opts.openCart !== false) openDialog(cartEl());
    return Promise.resolve(state.cart);
  }
  window.addToCart = addToCart;

  /** Lien de paiement Whop de la teinte + du lot (config : color.checkout[nbKits]). */
  const directCheckoutUrl = (color, qty) => (C.CHECKOUT_MODE === 'direct' && color.checkout && color.checkout[qty]) || null;

  /**
   * Achat direct : envoie au paiement de la teinte + du lot choisis.
   * - Mode 'direct' (Whop) : événements Meta AddToCart + InitiateCheckout, puis redirection.
   * - Mode 'cart' : ajoute au panier puis /checkout (ou ouvre le panier en démo).
   */
  function buyNow(color, qty, btn) {
    const url = directCheckoutUrl(color, qty);
    if (url) {
      const value = priceForKits(qty);
      const name = `${t(P.title, colorVars(color))} – ${color.name}`;
      track('AddToCart', { content_ids: [color.variantId], content_name: name, content_type: 'product', quantity: qty, value, currency: C.CURRENCY });
      // InitiateCheckout AVANT la redirection : "Bordeaux – 2 kits", valeur du lot en EUR
      track('InitiateCheckout', { content_ids: [color.variantId], content_name: `${color.name} – ${qty} kit${qty > 1 ? 's' : ''}`, content_type: 'product', value, currency: 'EUR', num_items: qty });
      // Commande en cours, relue par merci.html pour l'événement Achat (valeur réelle)
      try {
        window.localStorage.setItem('rn_pending_order', JSON.stringify({
          id: `${color.id}-${qty}-${Date.now()}`, colorId: color.id, colorName: color.name,
          variantId: color.variantId, qty, nails: nailsFor(qty, color), value, currency: C.CURRENCY, ts: Date.now(),
        }));
      } catch (e) { /* stockage indisponible : l'Achat sera envoyé sans montant */ }
      if (btn) {
        btn.setAttribute('aria-busy', 'true');
        const label = $('.btn__label', btn) || btn;
        label.textContent = C.TEXTS.product.redirecting;
      }
      live(C.TEXTS.product.redirecting);
      // petit délai pour laisser partir les événements du pixel avant de quitter la page
      // 300 ms pour laisser partir les événements du pixel avant de quitter la page
      setTimeout(() => { window.location.href = url; }, pixelLoaded ? 300 : 0);
      return;
    }
    addToCart(color.variantId, qty, { openCart: false }).then(() => {
      track('InitiateCheckout', { value: state.cart.reduce((s, l) => s + priceForKits(l.kits), 0), currency: C.CURRENCY, num_items: totalKits() });
      if (C.DEMO_MODE) { openDialog(cartEl()); updateShadeButtons(); return; }
      window.location.href = checkoutUrl();
    });
  }

  function checkoutUrl() {
    if (C.CART_PERMALINK_BASE && state.cart.length) {
      return `${C.CART_PERMALINK_BASE.replace(/\/$/, '')}/${state.cart.map((l) => `${encodeURIComponent(l.variantId)}:${l.kits}`).join(',')}`;
    }
    return C.CHECKOUT_URL;
  }

  function renderCart() {
    const tx = C.TEXTS.cart;
    const kits = totalKits();
    $('[data-cart-count]').textContent = kits;
    $('[data-open-cart]').setAttribute('aria-label', `Ouvrir le panier, ${kits} article${kits > 1 ? 's' : ''}`);

    const body = $('[data-cart-body]');
    const foot = $('[data-cart-foot]');
    if (!state.cart.length) {
      body.innerHTML = `<div class="cart-empty">${icon('cart', 36, 1.1)}<p>${esc(tx.empty)}</p>
        <button class="btn btn--primary" type="button" data-cart-shop>${esc(tx.emptyCta)}</button></div>`;
      foot.innerHTML = '';
      return;
    }
    const subtotal = round2(state.cart.reduce((s, l) => s + priceForKits(l.kits), 0));
    const free = kits >= C.SHIPPING.freeFromKits;
    const shipping = free ? 0 : C.SHIPPING.price;

    body.innerHTML = state.cart.map((l, idx) => {
      const c = C.COLORS.find((x) => x.id === l.colorId);
      const price = priceForKits(l.kits);
      const regular = round2(UNIT * l.kits);
      return `
        <div class="line">
          <img src="${esc(pick(c, 'thumbImage', 0).src)}" alt="" width="76" height="76">
          <div>
            <p class="line__title">${esc(t(P.title, colorVars(c)))} – ${esc(c.name)}</p>
            <p class="line__meta">${esc(t(tx.kitsLabel, { count: l.kits, nails: nailsFor(l.kits, c) }))}</p>
            <div class="qty" role="group" aria-label="Quantité ${esc(c.name)}">
              <button type="button" data-qty="${idx}" data-delta="-1" aria-label="Retirer un kit">−</button>
              <span>${l.kits}</span>
              <button type="button" data-qty="${idx}" data-delta="1" aria-label="Ajouter un kit">+</button>
            </div>
          </div>
          <div class="line__price">
            ${price < regular ? `<s><span class="sr-only">au lieu de </span>${money(regular)}</s>` : ''}${money(price)}
            <button class="link-btn line__remove" type="button" data-remove="${idx}">${esc(tx.remove)}</button>
          </div>
        </div>`;
    }).join('') + (kits === 1 && BUNDLES.some((b) => b.qty === 2)
      ? `<div class="upsell"><span>${esc(tx.upsell)}</span><button class="btn btn--primary" type="button" data-qty="0" data-delta="1">${esc(tx.upsellBtn)}</button></div>`
      : '');

    foot.innerHTML = `
      <div class="sum-row"><span>${esc(tx.subtotal)}</span><span>${moneyFull(subtotal)}</span></div>
      <div class="sum-row"><span>${esc(tx.shipping)}</span><span class="${free ? 'is-free' : ''}">${free ? esc(tx.free) : moneyFull(shipping)}</span></div>
      <div class="sum-row sum-row--total"><span>${esc(tx.total)}</span><span>${moneyFull(round2(subtotal + shipping))}</span></div>
      <a class="btn btn--primary btn--block btn--glow" href="${esc(checkoutUrl())}" data-checkout>${esc(tx.checkout)}</a>
      ${C.DEMO_MODE ? `<p class="demo-note">${esc(tx.demo)}</p>` : ''}`;
  }

  function initCart() {
    renderCart();
    $('[data-open-cart]').addEventListener('click', () => openDialog(cartEl()));
    $$('[data-add-current]').forEach((btn) => btn.addEventListener('click', () => {
      btn.classList.remove('is-added'); void btn.offsetWidth; btn.classList.add('is-added');
      if (directCheckoutUrl(state.color, currentBundle().qty)) buyNow(state.color, currentBundle().qty, btn);
      else addToCart(state.color.variantId, currentBundle().qty);
    }));
    // Paiement direct : pas de panier, l'icône panier n'a plus d'utilité
    if (C.CHECKOUT_MODE === 'direct') $('[data-open-cart]').hidden = true;
    $('[data-cart-body]').addEventListener('click', (e) => {
      const q = e.target.closest('[data-qty]');
      const r = e.target.closest('[data-remove]');
      if (q) {
        const line = state.cart[Number(q.dataset.qty)];
        if (line) { line.kits += Number(q.dataset.delta); if (line.kits <= 0) state.cart.splice(Number(q.dataset.qty), 1); }
        renderCart();
      } else if (r) {
        state.cart.splice(Number(r.dataset.remove), 1);
        renderCart();
      } else if (e.target.closest('[data-cart-shop]')) {
        closeDialog(cartEl()).then(goToOffers);
      }
    });
    $('[data-cart-foot]').addEventListener('click', (e) => {
      if (e.target.closest('[data-checkout]')) {
        track('InitiateCheckout', { value: state.cart.reduce((s, l) => s + priceForKits(l.kits), 0), currency: C.CURRENCY, num_items: totalKits() });
      }
    });
  }

  /* Fenêtres modales (<dialog>) */
  function openDialog(dlg) {
    if (!dlg || dlg.open) return;
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
  }
  function closeDialog(dlg) {
    return new Promise((resolve) => {
      if (!dlg || !dlg.open) return resolve();
      const done = () => { dlg.classList.remove('is-closing'); if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open'); resolve(); };
      if (reducedMotion.matches) return done();
      dlg.classList.add('is-closing');
      setTimeout(done, 200);
    });
  }
  function initDialogs() {
    $$('dialog').forEach((dlg) => {
      dlg.addEventListener('cancel', (e) => { e.preventDefault(); closeDialog(dlg); });
      dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-close]')) closeDialog(dlg); });
    });
  }

  /* ======================================================================
     10. BARRE D'ACHAT COLLANTE (mobile) — visible dès l'arrivée,
         masquée seulement quand le bouton principal est à l'écran.
     ====================================================================== */
  function updateSticky() {
    const b = currentBundle();
    $('[data-sticky-name]').textContent = `${state.color.name} · ${b.label}`;
    $('[data-sticky-price]').innerHTML = `${money(b.price)}${b.compareAt ? `<s><span class="sr-only">au lieu de </span>${money(b.compareAt)}</s>` : ''}`;
  }

  function initSticky() {
    const bar = $('[data-sticky]');
    if (!('IntersectionObserver' in window)) return;
    let ctaVisible = false;
    const apply = () => {
      const show = !ctaVisible && !isDesktop.matches;
      bar.classList.toggle('is-visible', show);
      bar.setAttribute('aria-hidden', String(!show));
      bar.inert = !show;
      document.body.classList.toggle('has-sticky', show);
    };
    new IntersectionObserver(([entry]) => { ctaVisible = entry.isIntersecting; apply(); }).observe($('#main-cta'));
    isDesktop.addEventListener && isDesktop.addEventListener('change', apply);
  }

  /* ======================================================================
     11. POP-UP PROMO — 12 s ou intention de sortie, 1 fois par session
     ====================================================================== */
  /**
   * Pop-up code promo : 1re apparition après delaySeconds (ou intention de sortie
   * sur ordinateur), puis de nouveau toutes les repeatEveryMinutes, au maximum
   * maxPerSession fois par visite. Ne revient plus une fois le code copié.
   * Compteurs gardés en sessionStorage (survivent à un rechargement de page).
   */
  function initPopup() {
    const cfg = C.POPUP;
    const dlg = $('#promo');
    const K_COUNT = 'rn_popup_count', K_LAST = 'rn_popup_last', K_DONE = 'rn_popup_done';
    const count = () => parseInt(session.get(K_COUNT) || '0', 10) || 0;
    const repeatMs = (cfg.repeatEveryMinutes || 0) * 60000;
    const max = cfg.maxPerSession || 1;
    let timer;

    $('[data-copy-code]').addEventListener('click', async (e) => {
      const label = $('span', e.currentTarget);
      try { await navigator.clipboard.writeText(cfg.code); } catch (err) {
        const ta = document.createElement('textarea');
        ta.value = cfg.code; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        dlg.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (e2) { /* ignoré */ }
        ta.remove();
      }
      label.textContent = cfg.copiedLabel;
      live(cfg.copiedLabel);
      setTimeout(() => { label.textContent = cfg.copyLabel; }, 2500);
      session.set(K_DONE, '1'); // code récupéré : on ne réaffiche plus le pop-up
      clearTimeout(timer);
    });
    $('[data-popup-cta]').addEventListener('click', () => closeDialog(dlg).then(goToOffers));

    const canShow = () => cfg.enabled && !session.get(K_DONE) && count() < max;
    if (!canShow()) return;

    const onMouseOut = (e) => { if (!e.relatedTarget && e.clientY <= 0) show(); };
    if (cfg.exitIntent && canHover.matches) document.addEventListener('mouseout', onMouseOut);

    function schedule() {
      clearTimeout(timer);
      if (!canShow()) { document.removeEventListener('mouseout', onMouseOut); return; }
      const last = parseInt(session.get(K_LAST) || '0', 10);
      const wait = count() === 0 ? cfg.delaySeconds * 1000 : Math.max(5000, last + repeatMs - Date.now());
      if (count() > 0 && !repeatMs) return;
      timer = setTimeout(show, wait);
    }
    function show() {
      if (!canShow() || dlg.open) return;
      // jamais par-dessus le panier ou une autre fenêtre : on réessaie un peu plus tard
      if ($('dialog[open]')) { clearTimeout(timer); timer = setTimeout(show, 8000); return; }
      // l'intention de sortie ne doit pas court-circuiter l'intervalle entre deux affichages
      const last = parseInt(session.get(K_LAST) || '0', 10);
      if (count() > 0 && Date.now() - last < repeatMs) return;
      clearTimeout(timer);
      session.set(K_COUNT, String(count() + 1));
      session.set(K_LAST, String(Date.now()));
      openDialog(dlg);
      track('ViewPromo', { code: cfg.code, occurrence: count() });
    }
    // à la fermeture, on programme le prochain affichage (intervalle compté à partir de la fermeture)
    dlg.addEventListener('close', () => { session.set(K_LAST, String(Date.now())); schedule(); });
    schedule();
  }

  /* ======================================================================
     12. AVIS CLIENTES — uniquement de vrais avis (config ou module externe).
         ?apercu-avis=1 affiche des exemples FICTIFS, signalés comme tels,
         pour valider la mise en page (jamais affichés sans ce paramètre).
     ====================================================================== */
  const PREVIEW_REVIEWS = [
    { name: 'Prénom N.', city: 'Ville', rating: 5, color: 'bordeaux', title: 'Titre de l’avis', text: 'Le texte d’un avis vérifié s’affichera ici, tel que la cliente l’a écrit.' },
    { name: 'Prénom N.', city: 'Ville', rating: 5, color: 'nude-rose', title: 'Titre de l’avis', text: 'Exemple de texte plus long pour vérifier la mise en page : deux ou trois phrases, une impression sur la pose, la tenue ou la teinte choisie.' },
    { name: 'Prénom N.', city: 'Ville', rating: 4, color: 'bleu-nuit', title: 'Titre de l’avis', text: 'Exemple de texte court.' },
  ];

  function initReviews() {
    const real = (C.REVIEWS && Array.isArray(C.REVIEWS.items)) ? C.REVIEWS.items.filter((r) => r && r.rating) : [];
    const preview = !real.length && params.has('apercu-avis');
    const items = real.length ? real : (preview ? PREVIEW_REVIEWS : []);
    if (!items.length) return;

    const avg = items.reduce((s, r) => s + Number(r.rating), 0) / items.length;
    const avgTxt = avg.toLocaleString(C.LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    const countTxt = t(C.REVIEWS.countLabel, { count: items.length });

    // Sous le titre produit
    const rating = $('[data-rating]');
    rating.hidden = false;
    rating.innerHTML = `${starsHtml(avg)}<span class="rating__avg">${avgTxt}</span><span class="rating__count">(${esc(countTxt)})</span>`;
    rating.setAttribute('aria-label', `Note moyenne ${avgTxt} sur 5, ${countTxt}. Voir les avis`);

    const section = $('#avis');
    section.hidden = false;
    if (preview) { const n = $('[data-reviews-notice]'); n.hidden = false; n.textContent = C.REVIEWS.previewNotice; }

    const dist = [5, 4, 3, 2, 1].map((star) => ({ star, n: items.filter((r) => Math.round(r.rating) === star).length }));
    $('[data-reviews-summary]').innerHTML = `
      <span class="reviews__avg">${avgTxt}</span>
      ${starsHtml(avg, 16)}
      <span class="reviews__total">${esc(countTxt)}</span>
      <div class="reviews__bars">${dist.map((d) => `<div class="reviews__bar"><b>${d.star}★</b><span style="--w:${(d.n / items.length) * 100}%"></span><em>${d.n}</em></div>`).join('')}</div>`;

    const dfmt = new Intl.DateTimeFormat(C.LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });
    $('[data-reviews-list]').innerHTML = items.map((r) => {
      const c = C.COLORS.find((x) => x.id === r.color);
      const date = r.date ? dfmt.format(new Date(r.date)) : '';
      return `
        <li class="review">
          ${r.photo ? `<div class="review__photo"><img src="${esc(r.photo)}" alt="Photo de ${esc(r.name)}" loading="lazy" decoding="async"></div>` : ''}
          <span aria-label="${r.rating} sur 5">${starsHtml(r.rating)}</span>
          ${r.title ? `<h3 class="review__title">${esc(r.title)}</h3>` : ''}
          <p class="review__text">${esc(r.text)}</p>
          <p class="review__meta"><b>${esc(r.name)}</b>${r.city ? `<span>${esc(r.city)}</span>` : ''}${c ? `<span>Teinte ${esc(c.name)}</span>` : ''}${date ? `<span>${esc(date)}</span>` : ''}
            ${r.verified && !preview ? `<span class="review__verified">${icon('check', 13, 2)}${esc(C.REVIEWS.verified)}</span>` : ''}</p>
        </li>`;
    }).join('');
  }

  /* ======================================================================
     13. APPARITIONS AU DÉFILEMENT
     ====================================================================== */
  function initReveal() {
    if (reducedMotion.matches || !('IntersectionObserver' in window)) return;
    const els = $$('.reveal').filter((el) => el.getBoundingClientRect().top > window.innerHeight);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.remove('is-pending');
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => { el.classList.add('is-pending'); io.observe(el); });
  }

  /** Les boutons "illuminés" ne s'animent que lorsqu'ils sont à l'écran (fluidité, batterie). */
  function initGlow() {
    const live = (b) => b.classList.add('is-live');
    if (!('IntersectionObserver' in window)) { $$('.btn--glow').forEach(live); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.target.classList.toggle('is-live', e.isIntersecting));
    });
    $$('.btn--glow, .shade-grid').forEach((b) => io.observe(b));
    // boutons créés plus tard (tiroir panier) : toujours animés
    new MutationObserver(() => $$('.drawer .btn--glow').forEach(live)).observe($('[data-cart-foot]'), { childList: true });
  }

  /* ======================================================================
     14. DÉMARRAGE
     ====================================================================== */
  function init() {
    renderAnnouncement();
    renderStatic();
    gallery.init();
    renderColors();
    initBundles();
    setColor(state.color.id, { silent: true });
    initDelivery();
    initDialogs();
    initCart();
    initSticky();
    initPopup();
    initReviews();
    initReveal();
    initConsent();
    initGlow();
    // "J'en profite" : paiement direct de la teinte + du lot sélectionnés (sinon : remonte aux lots)
    $$('[data-cta-offers]').forEach((b) => b.addEventListener('click', () => {
      if (directCheckoutUrl(state.color, currentBundle().qty)) buyNow(state.color, currentBundle().qty, b);
      else goToOffers();
    }));
    // Retour depuis la page de paiement (bouton "précédent") : on remet les boutons en état
    window.addEventListener('pageshow', (e) => {
      if (!e.persisted) return;
      $$('[aria-busy]').forEach((b) => b.removeAttribute('aria-busy'));
      renderTexts();
      $$('[data-cta-offers]').forEach((b) => { b.textContent = t(C.TEXTS.cta); });
      updateShadeButtons();
    });
    // ViewContent au chargement de la fiche produit : valeur = prix du lot sélectionné
    track('ViewContent', { content_ids: [state.color.variantId], content_name: 'Kit 30 faux ongles gel souple', content_type: 'product', value: currentBundle().price, currency: 'EUR' });
  }

  window.RN = { state, BUNDLES, computeDelivery, priceForKits, setColor, setBundle };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
