/* ==========================================================================
   RED NAILS — merci.js (page de confirmation après paiement Whop)
   Envoie l'événement Meta "Purchase" UNE seule fois par commande, et
   seulement si la visiteuse a accepté les cookies (CNIL).
   La commande (teinte, lot, montant) a été enregistrée par app.js juste
   avant la redirection vers Whop (localStorage "rn_pending_order").
   ========================================================================== */
(function () {
  'use strict';
  const C = window.RN_CONFIG || {};
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const store = {
    get(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* ignoré */ } },
    del(k) { try { window.localStorage.removeItem(k); } catch (e) { /* ignoré */ } },
  };
  const money = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

  /* ---------- Commande en attente (valable 24 h) ---------- */
  let order = null;
  try { order = JSON.parse(store.get('rn_pending_order') || 'null'); } catch (e) { order = null; }
  if (order && Date.now() - order.ts > 24 * 3600 * 1000) order = null;

  if (order) {
    $('[data-recap]').hidden = false;
    $('[data-recap-line]').textContent = `${order.qty} kit${order.qty > 1 ? 's' : ''} · ${order.nails} faux ongles ${order.colorName} · ${money(order.value)}`;
  }

  /* ---------- Consentement (même format que app.js : 6 mois) ---------- */
  const KEY = 'rn_consent';
  const MAX_AGE = 182 * 24 * 3600 * 1000;
  function getConsent() {
    try {
      const raw = store.get(KEY);
      if (!raw) return null;
      const { v, t } = raw.charAt(0) === '{' ? JSON.parse(raw) : { v: raw, t: 0 };
      if (!t || Date.now() - t > MAX_AGE) { store.del(KEY); return null; }
      return v;
    } catch (e) { return null; }
  }
  const setConsent = (v) => store.set(KEY, JSON.stringify({ v, t: Date.now() }));

  /* ---------- Pixel Meta ---------- */
  let loaded = false;
  function loadPixel() {
    if (loaded || !C.META_PIXEL_ID) return;
    loaded = true;
    /* Code officiel du pixel Meta */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
      n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', C.META_PIXEL_ID);
    window.fbq('track', 'PageView');
    sendPurchase();
  }

  /** Achat : une seule fois par commande (pas de doublon si la page est rechargée). */
  function sendPurchase() {
    // Pas de commande enregistrée (page ouverte directement, test…) : aucun Achat envoyé,
    // pour ne pas fausser les statistiques Meta.
    if (!order) return;
    const sentKey = 'rn_purchase_sent';
    const id = order.id;
    if (store.get(sentKey) === id) return;
    const data = { value: order.value, currency: order.currency || 'EUR', content_ids: [order.variantId], content_name: `Kit ${Math.round(order.nails / order.qty)} faux ongles – ${order.colorName}`, content_type: 'product', num_items: order.qty };
    // eventID : permet à Meta de dédoublonner si Whop envoie aussi l'Achat via l'API de conversion
    window.fbq('track', 'Purchase', data, { eventID: id });
    store.set(sentKey, id);
    store.del('rn_pending_order');
  }

  /* ---------- Bannière ---------- */
  const banner = $('[data-consent]');
  if (C.CONSENT) $('[data-consent-text]').textContent = C.CONSENT.text;
  $$('[data-consent-choice]').forEach((b) => b.addEventListener('click', () => {
    setConsent(b.dataset.consentChoice);
    banner.hidden = true;
    if (b.dataset.consentChoice === 'granted') loadPixel();
  }));
  $('[data-consent-open]').addEventListener('click', () => { banner.hidden = false; });

  const consent = (C.CONSENT && C.CONSENT.enabled === false) ? 'granted' : getConsent();
  if (consent === 'granted') loadPixel();
  else if (consent !== 'denied') banner.hidden = false;
})();
