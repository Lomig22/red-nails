/* ==========================================================================
   RED NAILS — /api/whop-webhook  (fonction serverless Vercel, Node 18+)
   --------------------------------------------------------------------------
   Reçoit le webhook Whop « payment.succeeded », vérifie sa signature, puis
   envoie un événement Purchase à l'API Conversions de Meta (pixel serveur).

   Variables d'environnement (Vercel > projet > Settings > Environment Variables) :
     WHOP_WEBHOOK_SECRET    obligatoire  secret de signature du webhook Whop (ws_…)
     META_CAPI_TOKEN        obligatoire  token d'accès de l'API Conversions Meta
     META_PIXEL_ID          facultatif   défaut : 2750897045307789
     META_TEST_EVENT_CODE   facultatif   code « Tester les événements » (ex. TEST12345)
                                         → à retirer une fois les tests terminés
     META_GRAPH_VERSION     facultatif   défaut : v23.0
     SITE_URL               facultatif   défaut : https://red-nails.fr
   Aucun secret n'est écrit dans ce fichier.

   Format Whop (Standard Webhooks, docs.whop.com/developer/guides/webhooks) :
     en-têtes webhook-id, webhook-timestamp, webhook-signature ("v1,<base64>")
     signature = HMAC-SHA256( "{id}.{timestamp}.{corps brut}" ), encodée en base64
     corps : { type: "payment.succeeded", data: { id: "pay_…", total: { amount: "24.99",
             currency: "eur" }, customer_email, variant_id: "plan_…", paid_at, … } }

   Déduplication : event_id = identifiant du paiement Whop (pay_…). La page merci
   envoie le même event_id côté navigateur quand Whop ajoute ?payment=pay_… au
   retour ; Meta ne compte alors l'achat qu'une fois. Les renvois du même webhook
   (Whop réessaie en cas d'échec) portent aussi le même event_id.

   ------------------------------------------------------------------------
   TESTER AVANT DE BRANCHER WHOP (requête factice signée)
   ------------------------------------------------------------------------
   1. Dans Vercel, renseigner WHOP_WEBHOOK_SECRET (n'importe quelle valeur pour
      le test, ex. ws_test_123), META_CAPI_TOKEN et META_TEST_EVENT_CODE
      (Gestionnaire d'événements > Tester les événements > code de test), redéployer.
   2. Vérifier que l'endpoint répond :
        curl https://red-nails.fr/api/whop-webhook
      → {"ok":true,…,"configured":{"whopSecret":true,"metaToken":true}}
   3. Envoyer un faux paiement signé (dans un terminal, avec le MÊME secret) :
        SECRET='ws_test_123'
        BODY='{"type":"payment.succeeded","data":{"id":"pay_TEST001","total":{"amount":"24.99","currency":"eur"},"customer_email":"test@example.com","variant_id":"plan_w7AeKgI8selsO","paid_at":"2026-11-23T10:00:00Z"}}'
        ID="msg_test_$(date +%s)"; TS=$(date +%s)
        SIG=$(printf '%s' "$ID.$TS.$BODY" | openssl dgst -sha256 -hmac "$SECRET" -binary | base64)
        curl -i -X POST https://red-nails.fr/api/whop-webhook \
          -H "content-type: application/json" -H "webhook-id: $ID" \
          -H "webhook-timestamp: $TS" -H "webhook-signature: v1,$SIG" --data "$BODY"
      → HTTP 200 {"ok":true,"forwarded":true,…} et un « Achat » de test dans
        Meta > Tester les événements. Une signature fausse renvoie 401.
   4. Mettre ensuite le VRAI secret Whop dans WHOP_WEBHOOK_SECRET, retirer
      META_TEST_EVENT_CODE, redéployer, puis créer le webhook dans Whop.
   ========================================================================== */
import crypto from 'node:crypto';

const DEFAULT_PIXEL = '2750897045307789';
const TOLERANCE_SECONDS = 5 * 60; // recommandation Whop : rejeter au-delà de 5 min

const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

/**
 * Clés HMAC possibles à partir du secret Whop. La doc Whop demande de passer le
 * secret « tel quel » à son SDK qui « dérive la clé » ; selon le format (ws_…,
 * whsec_… base64 des Standard Webhooks), on essaie les dérivations usuelles.
 * Toutes proviennent du secret : aucune ne permet de signer sans le connaître.
 */
function candidateKeys(secret) {
  const keys = [Buffer.from(secret, 'utf8')];
  const stripped = secret.replace(/^(whsec_|ws_)/, '');
  if (stripped !== secret) keys.push(Buffer.from(stripped, 'utf8'));
  if (/^[A-Za-z0-9+/=]+$/.test(stripped)) {
    const decoded = Buffer.from(stripped, 'base64');
    if (decoded.length >= 16) keys.push(decoded);
  }
  return keys;
}

/** Vérifie la signature Standard Webhooks (comparaison en temps constant). */
export function verifySignature({ id, timestamp, signatureHeader, rawBody, secret, now = Date.now() }) {
  if (!id || !timestamp || !signatureHeader) return { ok: false, reason: 'en-têtes webhook-* manquants' };
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(now / 1000 - ts) > TOLERANCE_SECONDS) return { ok: false, reason: 'horodatage hors tolérance' };
  const signed = `${id}.${timestamp}.${rawBody}`;
  const provided = signatureHeader.split(' ')
    .map((part) => part.trim())
    .filter((part) => part.startsWith('v1,'))
    .map((part) => Buffer.from(part.slice(3), 'base64'));
  if (!provided.length) return { ok: false, reason: 'signature v1 absente' };
  for (const key of candidateKeys(secret)) {
    const expected = crypto.createHmac('sha256', key).update(signed).digest();
    if (provided.some((sig) => sig.length === expected.length && crypto.timingSafeEqual(sig, expected))) return { ok: true };
  }
  return { ok: false, reason: 'signature invalide' };
}

/** Montant Whop : objet { amount: "24.99" } (unités, pas centimes) ou valeur simple. */
function readMoney(field) {
  if (field == null) return { amount: null, currency: null };
  if (typeof field === 'object') return { amount: Number(field.amount), currency: field.currency || null };
  return { amount: Number(field), currency: null };
}

/** Construit l'événement Purchase de l'API Conversions à partir du paiement Whop. */
export function buildPurchaseEvent(payment, { siteUrl }) {
  const total = readMoney(payment.total ?? payment.final_amount ?? payment.amount_charged ?? payment.subtotal);
  const currency = String(total.currency || payment.currency || 'eur').toUpperCase();
  const paidAt = Date.parse(payment.paid_at || payment.created_at || '') || Date.now();
  const email = payment.customer_email || (payment.user && payment.user.email) || null;
  const userData = {};
  if (email) userData.em = [sha256(String(email).trim().toLowerCase())];
  if (payment.user && payment.user.id) userData.external_id = [sha256(String(payment.user.id))];
  if (payment.member_id && !userData.external_id) userData.external_id = [sha256(String(payment.member_id))];
  const custom = { currency, order_id: payment.id, content_type: 'product' };
  if (Number.isFinite(total.amount)) custom.value = total.amount;
  if (payment.variant_id) custom.content_ids = [payment.variant_id];
  return {
    event_name: 'Purchase',
    event_time: Math.floor(paidAt / 1000),
    event_id: payment.id, // même identifiant que l'Achat navigateur (?payment=pay_…) → dédoublonnage
    action_source: 'website',
    event_source_url: `${siteUrl.replace(/\/$/, '')}/merci.html`,
    user_data: userData,
    custom_data: custom,
  };
}

/** Envoi à l'API Conversions (délai max 3,5 s pour répondre à Whop en moins de 5 s). */
async function sendToMeta(event, env) {
  const pixel = env.META_PIXEL_ID || DEFAULT_PIXEL;
  const version = env.META_GRAPH_VERSION || 'v23.0';
  const body = { data: [event] };
  if (env.META_TEST_EVENT_CODE) body.test_event_code = env.META_TEST_EVENT_CODE;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3500);
  try {
    const res = await fetch(`https://graph.facebook.com/${version}/${pixel}/events?access_token=${encodeURIComponent(env.META_CAPI_TOKEN)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, body: text.slice(0, 500) };
  } finally {
    clearTimeout(timer);
  }
}

/** GET : contrôle de santé (sans révéler de secret). */
export async function GET() {
  return json(200, {
    ok: true,
    endpoint: '/api/whop-webhook',
    accepts: 'POST payment.succeeded (Whop, Standard Webhooks)',
    configured: {
      whopSecret: Boolean(process.env.WHOP_WEBHOOK_SECRET),
      metaToken: Boolean(process.env.META_CAPI_TOKEN),
      testEventCode: Boolean(process.env.META_TEST_EVENT_CODE),
    },
  });
}

/** POST : webhook Whop. */
export async function POST(request) {
  const env = process.env;
  const rawBody = await request.text(); // corps BRUT : indispensable pour la signature
  const webhookId = request.headers.get('webhook-id');

  if (!env.WHOP_WEBHOOK_SECRET) {
    console.error('[whop-webhook] WHOP_WEBHOOK_SECRET manquant');
    return json(500, { ok: false, error: 'configuration incomplète' });
  }
  const check = verifySignature({
    id: webhookId,
    timestamp: request.headers.get('webhook-timestamp'),
    signatureHeader: request.headers.get('webhook-signature'),
    rawBody,
    secret: env.WHOP_WEBHOOK_SECRET,
  });
  if (!check.ok) {
    console.error(`[whop-webhook] rejeté (${check.reason}) id=${webhookId || '-'}`);
    return json(401, { ok: false, error: 'signature invalide' });
  }

  let payload;
  try { payload = JSON.parse(rawBody); } catch (e) {
    console.error(`[whop-webhook] JSON illisible id=${webhookId}`);
    return json(400, { ok: false, error: 'JSON invalide' });
  }
  if (payload.type !== 'payment.succeeded') {
    return json(200, { ok: true, ignored: payload.type || 'inconnu' }); // autres événements : accusé de réception
  }
  const payment = payload.data || {};
  if (!payment.id) {
    console.error(`[whop-webhook] paiement sans id, webhook=${webhookId}`);
    return json(200, { ok: true, forwarded: false, reason: 'paiement sans id' });
  }
  if (!env.META_CAPI_TOKEN) {
    console.error(`[whop-webhook] META_CAPI_TOKEN manquant, Achat ${payment.id} non transmis`);
    return json(200, { ok: true, forwarded: false, reason: 'token Meta manquant' });
  }

  const event = buildPurchaseEvent(payment, { siteUrl: env.SITE_URL || 'https://red-nails.fr' });
  try {
    const meta = await sendToMeta(event, env);
    if (!meta.ok) {
      // On répond quand même 200 : réessayer côté Whop n'y changerait rien (erreur de config Meta).
      console.error(`[whop-webhook] Meta a refusé l'Achat ${payment.id} : HTTP ${meta.status} ${meta.body}`);
      return json(200, { ok: true, forwarded: false, meta_status: meta.status });
    }
    console.log(`[whop-webhook] Achat ${payment.id} transmis à Meta (${event.custom_data.value} ${event.custom_data.currency}, email ${event.user_data.em ? 'haché' : 'absent'})`);
    return json(200, { ok: true, forwarded: true, event_id: event.event_id });
  } catch (e) {
    // Délai dépassé ou réseau : 500 pour que Whop renvoie le webhook plus tard
    // (même event_id → pas de doublon chez Meta).
    console.error(`[whop-webhook] envoi à Meta échoué pour ${payment.id} : ${e && e.message}`);
    return json(500, { ok: false, error: 'envoi Meta échoué, Whop réessaiera' });
  }
}
