/* ==========================================================================
   RED NAILS — consent.js (pages légales : mentions, CGV, confidentialité, contact)
   Même bannière et même mémorisation que l'accueil (app.js) et la page merci
   (merci.js) : clé localStorage "rn_consent" = { v: "granted"|"denied", t }.
   Choix conservé 6 mois (recommandation CNIL). Après "Accepter", le pixel Whop
   (code dans le <head>) est chargé ; le pixel Meta se chargera à la prochaine
   page qui l'embarque (accueil, merci).
   ========================================================================== */
(function () {
  'use strict';
  var C = window.RN_CONFIG || {};
  var KEY = 'rn_consent';
  var MAX_AGE = 182 * 24 * 3600 * 1000;
  var banner = document.querySelector('[data-consent]');
  if (!banner) return;

  function get() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return null;
      var c = raw.charAt(0) === '{' ? JSON.parse(raw) : { v: raw, t: 0 };
      if (!c.t || Date.now() - c.t > MAX_AGE) { window.localStorage.removeItem(KEY); return null; }
      return c.v;
    } catch (e) { return null; }
  }
  function set(v) { try { window.localStorage.setItem(KEY, JSON.stringify({ v: v, t: Date.now() })); } catch (e) { /* ignoré */ } }

  var text = banner.querySelector('[data-consent-text]');
  if (text && C.CONSENT && C.CONSENT.text) text.textContent = C.CONSENT.text;

  Array.prototype.forEach.call(banner.querySelectorAll('[data-consent-choice]'), function (b) {
    b.addEventListener('click', function () {
      var choice = b.getAttribute('data-consent-choice');
      set(choice);
      banner.hidden = true;
      if (choice === 'granted' && typeof window.rnLoadWhopPixel === 'function') window.rnLoadWhopPixel();
      if (choice === 'denied') { try { window.localStorage.removeItem('rn_seen'); } catch (e) { /* ignoré */ } }
    });
  });

  if (C.CONSENT && C.CONSENT.enabled === false) return;
  if (!get()) banner.hidden = false;
})();
