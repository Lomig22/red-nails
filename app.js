/* ==========================================================================
   RED NAILS — app.js
   JavaScript vanilla, sans dépendance. Tout le contenu vient de config.js
   (window.RN_CONFIG). Sommaire :
     1. Utilitaires & calculs de prix     7. Promesse de livraison (dates)
     2. État                              8. Panier (addToCart + tiroir démo)
     3. Textes & rendus statiques         9. Barre d'achat collante
     4. Galerie (swipe, miniatures, zoom) 10. Pop-up promo
     5. Couleurs                          11. Comparaison animée, apparitions
     6. Lots & prix                       12. Démarrage
   Portage Shopify : chaque bloc correspond à une partie de la section Liquid
   (voir README.md).
   ========================================================================== */
(function () {
  'use strict';

  const C = window.RN_CONFIG;
  if (!C) { console.error('[RED NAILS] config.js introuvable.'); return; }

  /* ======================================================================
     1. UTILITAIRES & CALCULS DE PRIX
     ====================================================================== */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const round2 = (n) => Math.round(n * 100) / 100;
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const getPath = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

  const moneyFmt = new Intl.NumberFormat(C.LOCALE, { style: 'currency', currency: C.CURRENCY });
  const moneyIntFmt = new Intl.NumberFormat(C.LOCALE, { style: 'currency', currency: C.CURRENCY, maximumFractionDigits: 0 });
  /** Formate un prix : 24.99 → "24,99 €" ; 40 → "40 €" */
  const money = (n) => (Number.isInteger(n) ? moneyIntFmt : moneyFmt).format(n);
  const moneyFull = (n) => moneyFmt.format(n);

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');

  /** sessionStorage protégé (navigation privée, cookies bloqués…) */
  const session = {
    get(k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) { /* ignoré */ } },
  };

  /** Envoie un événement aux pixels Meta / TikTok s'ils sont installés. */
  function track(event, data) {
    try {
      if (typeof window.fbq === 'function') window.fbq('track', event, data);
      if (window.ttq && typeof window.ttq.track === 'function') window.ttq.track(event, data);
    } catch (e) { /* un pixel ne doit jamais casser la page */ }
    document.dispatchEvent(new CustomEvent('rn:' + event, { detail: data }));
  }

  const P = C.PRODUCT;
  const UNIT = P.price;
  const nailsFor = (kits) => kits * P.nailsPerKit;
  /** Prix par ongle arrondi au centime : 24,99 / 30 = 0,83 € */
  const perNail = (price, kits) => round2(price / nailsFor(kits));

  /** Lots enrichis : prix barré = quantité × prix unitaire pratiqué. */
  const BUNDLES = C.BUNDLES.map((b) => {
    const regular = round2(UNIT * b.qty);
    let compareAt = null;
    if (b.qty > 1 && b.price < regular) compareAt = regular;
    // Kit seul : prix barré UNIQUEMENT si PRIX_REFERENCE est renseigné.
    if (b.qty === 1 && C.PRIX_REFERENCE && C.PRIX_REFERENCE > b.price) compareAt = C.PRIX_REFERENCE;
    // Arrondi à l'inférieur : la réduction affichée n'est jamais surévaluée.
    const discount = compareAt ? Math.floor((1 - b.price / compareAt) * 100 + 1e-6) : 0;
    return Object.assign({}, b, {
      compareAt,
      discount,
      perNail: perNail(b.price, b.qty),
      freeShipping: b.qty >= C.SHIPPING.freeFromKits,
    });
  });
  const BEST_BUNDLE = BUNDLES.reduce((best, b, i) => (b.perNail < BUNDLES[best].perNail ? i : best), 0);

  /** Prix d'un nombre de kits quelconque : on applique les lots les plus gros d'abord. */
  function priceForKits(kits) {
    const sorted = BUNDLES.slice().sort((a, b) => b.qty - a.qty);
    let left = kits, total = 0;
    sorted.forEach((b) => { while (left >= b.qty) { total += b.price; left -= b.qty; } });
    return round2(total + left * UNIT);
  }

  const D = C.DELIVERY;
  const pad = (n) => String(n).padStart(2, '0');

  /** Variables disponibles dans tous les textes de config.js : {perNail}, {cutoff}… */
  const VARS = {
    price: money(UNIT),
    perNail: money(perNail(UNIT, 1)),
    minPerNail: money(BUNDLES[BEST_BUNDLE].perNail),
    nails: P.nailsPerKit,
    sizes: P.sizes,
    perSize: P.perSize,
    salonPrice: money(C.COMPARISON.salonPrice),
    posePrice: money(round2(UNIT / P.posesPerKit)),
    shipping: money(C.SHIPPING.price),
    freeFrom: C.SHIPPING.freeFromKits,
    cutoff: D.cutoffMinute ? `${D.cutoffHour}h${pad(D.cutoffMinute)}` : `${D.cutoffHour}h`,
    minDays: D.minDays,
    maxDays: D.maxDays,
    returnDays: C.RETURN_DAYS,
    year: new Date().getFullYear(),
  };
  /** Remplace les {variables} d'un texte. */
  const t = (str, extra) => String(str == null ? '' : str).replace(/\{(\w+)\}/g, (m, k) => {
    const all = Object.assign({}, VARS, extra);
    return k in all ? all[k] : m;
  });

  /* ======================================================================
     2. ÉTAT
     ====================================================================== */
  const COLORS = C.COLORS;
  const params = new URLSearchParams(window.location.search);
  const urlColor = COLORS.find((c) => c.id === params.get('couleur'));
  const urlBundle = BUNDLES.findIndex((b) => String(b.qty) === params.get('lot'));

  const state = {
    color: urlColor || COLORS.find((c) => c.id === C.DEFAULT_COLOR) || COLORS[0],
    bundle: urlBundle >= 0 ? urlBundle : clamp(C.DEFAULT_BUNDLE || 0, 0, BUNDLES.length - 1),
    bundleTouched: urlBundle >= 0,
    slide: 0,
    cart: [], // { variantId, colorId, kits }
  };
  const currentBundle = () => BUNDLES[state.bundle];

  /**
   * Galerie d'une couleur : liste de { src, alt, label }.
   * - si la couleur a ses propres photos (color.images dans config.js), on les utilise ;
   * - sinon visuels par défaut /images/[id]/[file].[IMAGE_EXT] (GALLERY_VIEWS).
   */
  function galleryOf(color) {
    if (Array.isArray(color.images) && color.images.length) {
      return color.images.map((img, i) => {
        const v = C.GALLERY_VIEWS[i] || C.GALLERY_VIEWS[0];
        if (typeof img === 'string') return { src: img, alt: t(v.alt, { color: color.name }), label: v.label };
        return { src: img.src, alt: t(img.alt || v.alt, { color: color.name }), label: img.label || v.label };
      });
    }
    return C.GALLERY_VIEWS.map((v) => ({
      src: `images/${color.id}/${v.file}.${C.IMAGE_EXT}`,
      alt: t(v.alt, { color: color.name }),
      label: v.label,
    }));
  }
  const imageAt = (color, i) => { const g = galleryOf(color); return g[clamp(i, 0, g.length - 1)]; };
  const imageSrc = (color, i) => imageAt(color, i).src;
  const imageAlt = (color, i) => imageAt(color, i).alt;
  /** Vignette (cartes couleur, barre collante, panier) et visuel de la section "kit". */
  const thumbIndex = (color) => (color.thumbImage != null ? color.thumbImage : 2);
  const kitIndex = (color) => (color.kitImage != null ? color.kitImage : 4);

  /** Petites icônes SVG (inline, pas de requête). */
  const ICONS = {
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    repeat: '<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12"/><path d="M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    return: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
    truck: '<path d="M3 6h11v10H3z"/><path d="M14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    check: '<path d="M5 12.5 10 17l9-10"/>',
    cart: '<path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7V6a3 3 0 0 1 6 0v1"/>',
    box: '<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
    scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.1 8.1 20 20M8.1 15.9 20 4"/>',
  };
  const icon = (name, size = 18, stroke = 2) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  const live = (msg) => { const el = $('[data-live]'); if (el) { el.textContent = ''; setTimeout(() => { el.textContent = msg; }, 50); } };

  /* ======================================================================
     3. TEXTES & RENDUS STATIQUES
     ====================================================================== */
  function renderTexts() {
    // data-t="TEXTS.compare.title" → texte tiré de config.js
    $$('[data-t]').forEach((el) => {
      const val = getPath(C, el.getAttribute('data-t'));
      if (typeof val === 'string') el.textContent = t(val);
    });
  }

  function renderAnnouncement() {
    const items = C.TEXTS.announce.map((txt) => `<span class="announce__item">${esc(t(txt))}</span>`).join('');
    // Contenu doublé pour un défilement continu sans saut.
    $('[data-render="announce"]').innerHTML = items + `<span class="announce__clone" data-clone>${items}</span>`;
    $('[data-render="announce-sr"]').textContent = C.TEXTS.announce.map((x) => t(x)).join(' · ');
  }

  function renderStatic() {
    $('[data-render="promises"]').innerHTML = P.promises
      .map((p) => `<li>${icon(p.icon, 16)}<span>${esc(t(p.text))}</span></li>`).join('');

    $('[data-render="reassurance"]').innerHTML = C.TEXTS.reassurance
      .map((r) => `<li>${icon(r.icon, 24, 1.8)}<strong>${esc(t(r.title))}</strong><span>${esc(t(r.text))}</span></li>`).join('');

    // Ligne "institut" : on met le prix par ongle en valeur
    const salon = $('[data-salon-line]');
    salon.innerHTML = icon('scissors', 18) + '<span>' +
      esc(t(C.TEXTS.product.salonLine)).replace(esc(VARS.perNail), `<strong>${esc(VARS.perNail)}</strong>`) + '</span>';
    const compareLine = $('.compare__line');
    compareLine.innerHTML = esc(t(C.TEXTS.compare.line)).replace(esc(VARS.perNail), `<strong>${esc(VARS.perNail)}</strong>`);

    $('[data-render="steps"]').innerHTML = C.TEXTS.steps.items.map((s, i) => `
      <li class="step">
        <span class="step__num" aria-hidden="true">${i + 1}</span>
        <h3 class="step__title"><span class="sr-only">Étape ${i + 1} : </span>${esc(t(s.title))}</h3>
        <p class="step__text">${esc(t(s.text))}</p>
      </li>`).join('');

    $('[data-render="kit"]').innerHTML = C.TEXTS.kit.items
      .map((item) => `<li>${icon('check', 26, 3)}<span>${esc(t(item))}</span></li>`).join('');

    $('[data-render="faq"]').innerHTML = C.TEXTS.faq.items.map((f) => `
      <details>
        <summary>${esc(t(f.q))}</summary>
        <div class="faq__answer"><p>${esc(t(f.a))}</p></div>
      </details>`).join('');

    $('[data-render="footer-links"]').innerHTML = C.TEXTS.footer.links
      .map((l) => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`).join('');
    $('[data-footer-copy]').textContent = t(C.TEXTS.footer.copyright);

    // CTA répétés : "J'en profite – dès 0,58 € l'ongle"
    $$('[data-render="cta"]').forEach((band) => {
      const inverse = band.classList.contains('cta-band--inverse');
      band.innerHTML = `
        <button class="btn ${inverse ? 'btn--white' : 'btn--primary'}" type="button" data-cta-offers>${esc(t(C.TEXTS.cta))}</button>
        <p class="cta-band__note">${esc(t(C.TEXTS.ctaNote))}</p>`;
    });

    if (C.REVIEWS && C.REVIEWS.visible) $('#avis').hidden = false;

    // Indication de zoom adaptée à l'appareil
    const hint = () => { $('[data-gallery-hint-text]').textContent = canHover.matches ? C.TEXTS.product.galleryHintHover : C.TEXTS.product.galleryHintTouch; };
    hint();
    canHover.addEventListener && canHover.addEventListener('change', hint);
  }

  /* ======================================================================
     4. GALERIE — miniatures, swipe (scroll-snap natif), zoom x2,5
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
          <img src="${esc(imageSrc(state.color, i))}" alt="${esc(imageAlt(state.color, i))}" width="800" height="800"
               ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" draggable="false">
        </div>`;
      // Si la 1re image écrite en dur dans index.html est la bonne, on la garde
      // (pas de re-téléchargement ni de nouveau "LCP") et on ajoute les suivantes.
      const first = track.querySelector('.gallery__slide img');
      if (first && first.getAttribute('src') === views[0].src) {
        const s = first.parentElement;
        s.setAttribute('role', 'group');
        s.setAttribute('aria-roledescription', 'diapositive');
        s.setAttribute('aria-label', `1 sur ${views.length}`);
        first.alt = imageAlt(state.color, 0);
        first.draggable = false;
        track.insertAdjacentHTML('beforeend', views.slice(1).map((v, k) => slide(k + 1)).join(''));
      } else {
        track.innerHTML = views.map((v, i) => slide(i)).join('');
      }
      this.count = views.length;
      $('[data-render="thumbs"]').innerHTML = views.map((v, i) => `
        <button class="thumb" type="button" data-thumb="${i}" aria-label="Voir la photo : ${esc(v.label)}" aria-current="${i === 0}">
          <img src="${esc(v.src)}" alt="" width="76" height="76" loading="lazy" decoding="async">
        </button>`).join('');
    },

    /** Change les images pour une nouvelle couleur (même vue conservée). */
    swap(color) {
      const track = $('[data-render="slides"]');
      const apply = () => {
        // Chaque couleur peut avoir sa propre galerie (nombre et ordre des photos) :
        // on reconstruit les diapositives et on revient à la 1re photo.
        this.unzoom();
        track.textContent = '';
        this.render();
        this.vp.scrollLeft = 0;
        this.setActive(0);
        track.classList.remove('is-swapping');
      };
      if (reducedMotion.matches) return apply();
      track.classList.add('is-swapping');
      setTimeout(apply, 160);
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
      if (this.vp) this.vp.parentElement.classList.toggle('is-first', i === 0);
      $$('.thumb').forEach((b, k) => b.setAttribute('aria-current', String(k === i)));
      $('[data-gallery-count]').textContent = `${i + 1} / ${this.count}`;
    },

    currentImg() { return $$('.gallery__slide img', this.vp)[state.slide]; },

    /** Le point zoomé suit le curseur / le doigt (transform-origin dynamique). */
    setOrigin(clientX, clientY) {
      const img = this.currentImg(); if (!img) return;
      const r = this.vp.getBoundingClientRect();
      const x = clamp(((clientX - r.left) / r.width) * 100, 0, 100);
      const y = clamp(((clientY - r.top) / r.height) * 100, 0, 100);
      img.style.transformOrigin = `${x}% ${y}%`;
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
      this.render();
      const vp = (this.vp = $('#gallery-viewport'));

      // Synchronise la miniature active avec le swipe
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

      $('[data-render="thumbs"]').addEventListener('click', (e) => {
        const b = e.target.closest('[data-thumb]');
        if (b) this.goTo(Number(b.dataset.thumb));
      });
      // Survol d'une miniature sur desktop = aperçu immédiat
      $('[data-render="thumbs"]').addEventListener('mouseover', (e) => {
        const b = e.target.closest('[data-thumb]');
        if (b && canHover.matches && Number(b.dataset.thumb) !== state.slide) this.goTo(Number(b.dataset.thumb), false);
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

      // Recalage après rotation / redimensionnement
      window.addEventListener('resize', () => { vp.scrollLeft = state.slide * vp.clientWidth; });
    },
  };

  /* ======================================================================
     5. COULEURS
     ====================================================================== */
  function swatchStyle(c) {
    return `--c:${c.hex};` + (c.tip ? `--tip:${c.tip};` : '');
  }

  function renderColors() {
    $('[data-render="swatches"]').innerHTML = COLORS.map((c) => `
      <label class="swatch" title="${esc(c.name)}">
        <input type="radio" name="color" value="${esc(c.id)}" ${c === state.color ? 'checked' : ''}>
        <span style="${swatchStyle(c)}" ${c.tip ? 'data-tip' : ''}><span class="sr-only">${esc(c.name)}</span></span>
      </label>`).join('');

    $('[data-render="color-cards"]').innerHTML = COLORS.map((c) => `
      <li>
        <button class="color-card" type="button" data-color-card="${esc(c.id)}" aria-pressed="${c === state.color}">
          <span class="color-card__media"><img src="${esc(imageSrc(c, thumbIndex(c)))}" alt="" width="400" height="400" loading="lazy" decoding="async"></span>
          <span class="color-card__body">
            <span class="color-card__name"><i style="${swatchStyle(c)}"></i>${esc(c.name)}</span>
            <span class="color-card__desc">${esc(c.desc || '')}</span>
            <span class="color-card__pill" data-pill>${esc(c === state.color ? C.TEXTS.colors.selected : C.TEXTS.colors.choose)}</span>
          </span>
        </button>
      </li>`).join('');

    $('[data-render="swatches"]').addEventListener('change', (e) => {
      if (e.target.name === 'color') setColor(e.target.value);
    });
    $('[data-render="color-cards"]').addEventListener('click', (e) => {
      const card = e.target.closest('[data-color-card]');
      if (!card) return;
      setColor(card.dataset.colorCard);
      // remonte vers la fiche produit
      $('#produit').scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
    });
  }

  /** Sélectionne une couleur partout dans la page. */
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
      $('[data-pill]', card).textContent = on ? C.TEXTS.colors.selected : C.TEXTS.colors.choose;
    });
    $$('[data-color-dot]').forEach((dot) => { dot.style.setProperty('--c', color.hex); });
    $('[data-add-label]').textContent = t(C.TEXTS.product.addToCart, { color: color.name });
    $('[data-sticky-thumb]').src = imageSrc(color, thumbIndex(color));
    $('[data-sticky-thumb]').alt = color.name;
    const kitImg = $('[data-kit-img]');
    kitImg.src = imageSrc(color, kitIndex(color));
    kitImg.alt = imageAlt(color, kitIndex(color));

    if (changed && !opts.silent) {
      gallery.swap(color);
      live(`Couleur sélectionnée : ${color.name}`);
      // URL partageable (utile pour les pubs) : ?couleur=bordeaux
      try {
        const u = new URL(window.location.href);
        u.searchParams.set('couleur', id);
        window.history.replaceState(null, '', u);
      } catch (e) { /* file:// ou navigateur ancien */ }
    }
    updateSticky();
  }

  /* ======================================================================
     6. LOTS & PRIX
     ====================================================================== */
  function renderBundles() {
    const tx = C.TEXTS.product;
    $('[data-render="bundles"]').innerHTML = BUNDLES.map((b, i) => `
      <label class="bundle">
        <input type="radio" name="bundle" value="${i}" ${i === state.bundle ? 'checked' : ''}>
        <span class="bundle__radio" aria-hidden="true"></span>
        <span class="bundle__main">
          <span class="bundle__title">${esc(b.label)} ${b.discount ? `<span class="badge">-${b.discount} %</span>` : ''}</span>
          <span class="bundle__sub">${esc(t(tx.nailsCount, { count: nailsFor(b.qty) }))} · <strong>${esc(t(tx.perNailShort, { value: money(b.perNail) }))}</strong></span>
          ${b.freeShipping ? `<span class="bundle__ship">${icon('truck', 15)}${esc(tx.freeShipping)}</span>` : ''}
        </span>
        <span class="bundle__price">
          ${b.compareAt ? `<s><span class="sr-only">au lieu de </span>${money(b.compareAt)}</s>` : ''}
          <strong>${money(b.price)}</strong>
        </span>
        ${b.highlight ? `<span class="bundle__flag">${esc(b.highlight)}</span>` : ''}
      </label>`).join('');

    $('[data-render="bundles"]').addEventListener('change', (e) => {
      if (e.target.name !== 'bundle') return;
      state.bundleTouched = true;
      setBundle(Number(e.target.value));
    });
  }

  function setBundle(i) {
    state.bundle = i;
    $$('input[name="bundle"]').forEach((input) => { input.checked = Number(input.value) === i; });
    updatePrice(true);
  }

  function updatePrice(animate) {
    const b = currentBundle();
    $('[data-price-now]').textContent = money(b.price);
    const was = $('[data-price-was]');
    const badge = $('[data-price-badge]');
    if (b.compareAt) {
      was.hidden = false;
      was.innerHTML = `<span class="sr-only">au lieu de </span>${money(b.compareAt)}`;
      badge.hidden = false;
      badge.textContent = `-${b.discount} %`;
    } else {
      was.hidden = true;
      badge.hidden = true;
    }
    const pn = $('[data-per-nail]');
    pn.textContent = money(b.perNail);
    if (animate && !reducedMotion.matches) { pn.classList.remove('is-pop'); void pn.offsetWidth; pn.classList.add('is-pop'); }

    const ship = $('[data-ship-line]');
    ship.classList.toggle('is-free', b.freeShipping);
    ship.innerHTML = icon(b.freeShipping ? 'check' : 'truck', 18) +
      `<span>${esc(t(b.freeShipping ? C.TEXTS.product.shippingFree : C.TEXTS.product.shippingPaid))}</span>`;
    updateSticky();
  }

  /** CTA répétés : remonte au sélecteur de lots (et présélectionne le meilleur prix/ongle). */
  function goToOffers() {
    if (C.CTA_PRESELECT_BEST && !state.bundleTouched) setBundle(BEST_BUNDLE);
    const target = $('#offres');
    target.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'center' });
    const list = $('[data-render="bundles"]');
    list.classList.remove('is-flash'); void list.offsetWidth; list.classList.add('is-flash');
    // focus sur le lot sélectionné pour le clavier / lecteurs d'écran
    const checked = $('input[name="bundle"]:checked');
    if (checked) setTimeout(() => checked.focus({ preventScroll: true }), reducedMotion.matches ? 0 : 450);
  }

  /* ======================================================================
     7. PROMESSE DE LIVRAISON AVEC DATE
     ====================================================================== */
  /** Heure actuelle "murale" à Paris, quel que soit le fuseau du visiteur. */
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

  /** Calcule expédition et fenêtre de livraison. Exposé pour les tests. */
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
    const shipLabel = d.shipsToday ? tx.today
      : (d.shipDate.getTime() === tomorrow.getTime() ? tx.tomorrow : weekdayFmt.format(d.shipDate));

    const head = d.shipsToday
      ? esc(tx.countdown).replace('{time}', `<strong class="eta__time">${formatLeft(d.msLeft)}</strong>`).replace('{shipLabel}', `<strong>${esc(shipLabel)}</strong>`)
      : esc(tx.noCountdown).replace('{shipLabel}', `<strong>${esc(shipLabel)}</strong>`);
    const range = esc(tx.range)
      .replace('{from}', `<strong>${esc(dateFmt.format(d.from))}</strong>`)
      .replace('{to}', `<strong>${esc(dateFmt.format(d.to))}</strong>`);
    $('[data-eta-text]').innerHTML = `${head} · ${range}`;

    const steps = [
      { icon: 'cart', date: tx.today, cls: 'is-done' },
      { icon: 'box', date: d.shipsToday ? tx.today : dateFmt.format(d.shipDate), cls: 'is-next' },
      { icon: 'home', date: `${shortFmt.format(d.from)} – ${shortFmt.format(d.to)}`, cls: '' },
    ];
    $('[data-eta-steps]').innerHTML = steps.map((s, i) => `
      <li class="eta__step ${s.cls}">
        <span class="eta__icon">${icon(s.icon, 16)}</span>
        <span class="eta__label">${esc(tx.steps[i])}</span>
        <span class="eta__date">${esc(s.date)}</span>
      </li>`).join('');
  }

  function initDelivery() {
    renderDelivery();
    // Mise à jour à chaque changement de minute
    const msToNextMinute = 60000 - (Date.now() % 60000) + 50;
    setTimeout(() => { renderDelivery(); setInterval(renderDelivery, 60000); }, msToNextMinute);
  }

  /* ======================================================================
     8. PANIER — addToCart(variantId, qty) + tiroir de démonstration
     ====================================================================== */
  const cartEl = () => $('#cart');
  const totalKits = () => state.cart.reduce((s, l) => s + l.kits, 0);

  /**
   * Ajoute au panier. Point d'entrée unique, appelé par tous les boutons.
   * @param {string} variantId  ID de variante (Shopify) de la couleur
   * @param {number} qty        nombre de kits (1, 2, 3…)
   * Portage Shopify : remplacer le contenu par un fetch('/cart/add.js', …)
   * (exemple complet dans README.md).
   */
  function addToCart(variantId, qty) {
    qty = Math.max(1, parseInt(qty, 10) || 1);
    const color = COLORS.find((c) => c.variantId === variantId) || state.color;
    const line = state.cart.find((l) => l.variantId === variantId);
    if (line) line.kits += qty; else state.cart.push({ variantId, colorId: color.id, kits: qty });

    track('AddToCart', { content_ids: [variantId], content_name: `${P.title} – ${color.name}`, content_type: 'product', quantity: qty, value: priceForKits(qty), currency: C.CURRENCY });
    renderCart();
    bumpCount();
    live(`${C.TEXTS.cart.added} : ${qty} kit(s) ${color.name}`);
    openDialog(cartEl());
    return Promise.resolve(state.cart);
  }
  window.addToCart = addToCart; // accessible globalement (et pour Shopify)

  function bumpCount() {
    const btn = $('[data-open-cart]');
    btn.classList.remove('is-bump'); void btn.offsetWidth; btn.classList.add('is-bump');
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
      body.innerHTML = `<div class="cart-empty">${icon('cart', 40, 1.5)}<p>${esc(tx.empty)}</p>
        <button class="btn btn--primary" type="button" data-cart-shop>${esc(tx.emptyCta)}</button></div>`;
      foot.innerHTML = '';
      return;
    }

    const subtotal = round2(state.cart.reduce((s, l) => s + priceForKits(l.kits), 0));
    const free = kits >= C.SHIPPING.freeFromKits;
    const shipping = free ? 0 : C.SHIPPING.price;

    body.innerHTML = state.cart.map((l, idx) => {
      const c = COLORS.find((x) => x.id === l.colorId);
      const price = priceForKits(l.kits);
      const regular = round2(UNIT * l.kits);
      return `
        <div class="line">
          <img src="${esc(imageSrc(c, thumbIndex(c)))}" alt="" width="72" height="72">
          <div>
            <p class="line__title">${esc(P.title)} – ${esc(c.name)}</p>
            <p class="line__meta">${esc(t(tx.kitsLabel, { count: l.kits, nails: nailsFor(l.kits) }))}</p>
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
      <a class="btn btn--primary btn--block" href="${esc(checkoutUrl())}" data-checkout>${esc(tx.checkout)}</a>
      ${C.DEMO_MODE ? `<p class="demo-note">${esc(tx.demo)}</p>` : ''}`;
  }

  function initCart() {
    renderCart();
    $('[data-open-cart]').addEventListener('click', () => openDialog(cartEl()));
    $$('[data-add-current]').forEach((btn) => btn.addEventListener('click', () => {
      btn.classList.remove('is-added'); void btn.offsetWidth; btn.classList.add('is-added');
      addToCart(state.color.variantId, currentBundle().qty);
    }));
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

  /* ---------- Fenêtres modales (<dialog>) communes ---------- */
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
      // Échap : fermeture animée
      dlg.addEventListener('cancel', (e) => { e.preventDefault(); closeDialog(dlg); });
      // Clic à l'extérieur (sur le fond) ou sur un bouton [data-close]
      dlg.addEventListener('click', (e) => {
        if (e.target === dlg || e.target.closest('[data-close]')) closeDialog(dlg);
      });
    });
  }

  /* ======================================================================
     9. BARRE D'ACHAT COLLANTE (mobile)
     ====================================================================== */
  function updateSticky() {
    const b = currentBundle();
    const name = $('[data-sticky-name]');
    if (!name) return;
    name.textContent = `${state.color.name} · ${b.label}`;
    $('[data-sticky-price]').innerHTML = `${money(b.price)} <small>${esc(t(C.TEXTS.product.perNailShort, { value: money(b.perNail) }))}</small>`;
  }

  function initSticky() {
    const bar = $('[data-sticky]');
    const mainCta = $('#main-cta');
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([entry]) => {
      // visible dès que le bouton principal est passé au-dessus de l'écran
      const show = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      bar.classList.toggle('is-visible', show);
      bar.setAttribute('aria-hidden', String(!show));
      bar.inert = !show;
      document.body.classList.toggle('has-sticky', show);
    });
    io.observe(mainCta);
  }

  /* ======================================================================
     10. POP-UP PROMO — 12 s ou intention de sortie, 1 fois par session
     ====================================================================== */
  function initPopup() {
    const cfg = C.POPUP;
    const dlg = $('#promo');
    const KEY = 'rn_popup_seen';
    let shown = false;

    // Bouton "Copier le code"
    $('[data-copy-code]').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      const label = $('span', btn);
      try {
        await navigator.clipboard.writeText(cfg.code);
      } catch (err) {
        // repli : sélection manuelle
        const ta = document.createElement('textarea');
        ta.value = cfg.code; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        dlg.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (e2) { /* ignoré */ }
        ta.remove();
      }
      label.textContent = cfg.copiedLabel;
      live(cfg.copiedLabel);
      setTimeout(() => { label.textContent = cfg.copyLabel; }, 2500);
    });

    $('[data-popup-cta]').addEventListener('click', () => closeDialog(dlg).then(goToOffers));

    if (!cfg.enabled || session.get(KEY)) return;

    let timer;
    const onMouseOut = (e) => { if (!e.relatedTarget && e.clientY <= 0) show(); };
    function cleanup() { clearTimeout(timer); document.removeEventListener('mouseout', onMouseOut); }
    function show() {
      if (shown) return;
      // ne jamais recouvrir le panier : on réessaie plus tard
      if ($('dialog[open]')) { clearTimeout(timer); timer = setTimeout(show, 5000); return; }
      shown = true;
      cleanup();
      session.set(KEY, '1');
      openDialog(dlg);
      track('ViewPromo', { code: cfg.code });
    }
    timer = setTimeout(show, cfg.delaySeconds * 1000);
    if (cfg.exitIntent && canHover.matches) document.addEventListener('mouseout', onMouseOut);
  }

  /* ======================================================================
     11. COMPARAISON ANIMÉE & APPARITIONS AU DÉFILEMENT
     ====================================================================== */
  function initCompare() {
    const counter = $('[data-counter]');
    const from = C.COMPARISON.salonPrice;
    const to = perNail(UNIT, 1);
    const pose = round2(UNIT / P.posesPerKit);
    $('[data-bar-val="salon"]').textContent = money(from) + '+';
    $('[data-bar-val="ours"]').textContent = money(pose);
    const setBars = () => {
      $('[data-bar="salon"]').style.setProperty('--w', '100%');
      $('[data-bar="ours"]').style.setProperty('--w', `${Math.max(4, (pose / from) * 100)}%`);
    };

    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      counter.textContent = moneyFull(to); setBars(); return;
    }
    counter.textContent = moneyFull(from);
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      setBars();
      const start = performance.now(), dur = 1800;
      const ease = (x) => 1 - Math.pow(1 - x, 4);
      const step = (now) => {
        const p = Math.min(1, (now - start) / dur);
        counter.textContent = moneyFull(round2(from + (to - from) * ease(p)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.45 });
    io.observe($('.compare'));
  }

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
    }, { rootMargin: '0px 0px -10% 0px' });
    els.forEach((el) => { el.classList.add('is-pending'); io.observe(el); });
  }

  /* ======================================================================
     12. DÉMARRAGE
     ====================================================================== */
  function init() {
    renderTexts();
    renderAnnouncement();
    renderStatic();
    gallery.init();
    renderColors();
    renderBundles();
    setColor(state.color.id, { silent: true });
    updatePrice(false);
    initDelivery();
    initDialogs();
    initCart();
    initSticky();
    initPopup();
    initCompare();
    initReveal();

    $$('[data-cta-offers]').forEach((b) => b.addEventListener('click', goToOffers));

    track('ViewContent', { content_ids: [state.color.variantId], content_name: P.title, content_type: 'product', value: UNIT, currency: C.CURRENCY });
  }

  // Exposé pour les tests / le débogage dans la console
  window.RN = { state, BUNDLES, computeDelivery, priceForKits, setColor, setBundle };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
