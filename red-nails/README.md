# RED NAILS — Landing page produit

Page unique, mobile-first, pour le **Kit 30 faux ongles en gel souple** (red-nails.fr).
HTML / CSS / JavaScript vanilla, aucune dépendance, aucun build.

```
red-nails/
├── index.html              Structure de la page (aucun texte « en dur »)
├── styles.css              Styles (variables de couleurs en haut du fichier)
├── app.js                  Comportements (galerie, zoom, panier, dates…)
├── config.js               ⭐ TOUT le contenu modifiable
├── images/[couleur]/       5 visuels par couleur (SVG provisoires)
├── tools/generate-placeholders.js   Régénère les SVG provisoires
└── mentions-legales.html, cgv.html, confidentialite.html, contact.html (à compléter)
```

## Voir la page en local

```bash
cd red-nails
python3 -m http.server 8000      # puis ouvrir http://localhost:8000
```

(Ouvrir `index.html` en double-clic fonctionne aussi, mais un petit serveur est plus fidèle.)

---

## Modifier le contenu : tout se passe dans `config.js`

Les prix s'écrivent avec un **point** (`24.99`). Après modification, il suffit de recharger la page.

### Prix

| Quoi | Où |
|---|---|
| Prix du kit seul | `const PRIX_UNITAIRE = 24.99;` |
| Prix des lots 2 et 3 kits | `BUNDLES` → `price` |
| Prix barré du kit seul | `const PRIX_REFERENCE = null;` (ex. `34.99`) |
| Frais de livraison 1 kit | `const FRAIS_LIVRAISON = 3.99;` |
| Livraison offerte dès X kits | `SHIPPING.freeFromKits` |
| Prix d'une pose en institut | `COMPARISON.salonPrice` |

Le **prix par ongle**, le **prix barré des lots** (quantité × prix unitaire) et le **badge -X %**
sont calculés automatiquement : change un prix, tout le reste suit (fiche, cartes de lots,
barre collante, CTA « dès 0,58 € l'ongle », panier, FAQ…).

> ⚖️ `PRIX_REFERENCE` : uniquement si ce prix a réellement été pratiqué. La loi impose
> d'afficher comme référence le prix le plus bas pratiqué dans les 30 jours précédant la réduction.

### Couleurs

Dans `COLORS`, chaque couleur a :

```js
{ id: 'bordeaux', name: 'Bordeaux', hex: '#6B0F1F', variantId: 'VARIANT_BORDEAUX', desc: '…' }
```

- **Ajouter une couleur** : ajoute une ligne, puis lance `node tools/generate-placeholders.js`
  pour créer ses visuels provisoires.
- **Retirer une couleur** : supprime sa ligne.
- **Couleur par défaut** : `DEFAULT_COLOR`.
- **Lien direct pour tes pubs** : `https://red-nails.fr/?couleur=bordeaux&lot=3` ouvre la page
  avec la couleur et le lot présélectionnés.

### Délais de livraison

Dans `DELIVERY` :

- `cutoffHour: 14` → heure limite d'expédition (heure de Paris, quel que soit le fuseau de la visiteuse)
- `shipDays` / `deliveryDays` → jours ouvrés (0 = dimanche … 6 = samedi)
- `minDays: 2`, `maxDays: 4` → livraison entre J+2 et J+4 ouvrés après l'expédition
- `holidays` → jours fériés (2026 et 2027 déjà saisis ; ajoute les années suivantes)

Le texte « Commande dans 2 h 13 min → expédiée aujourd'hui · Livrée entre le… » se met à jour chaque minute.

### Photos

Les visuels actuels sont des SVG provisoires générés automatiquement. Pour mettre tes photos :

1. Dépose-les dans `images/[id-couleur]/` avec **le même nom** :
   `1-set`, `2-main`, `3-finition`, `4-tailles`, `5-kit` (ex. `images/bordeaux/1-set.webp`).
2. Dans `config.js`, passe `IMAGE_EXT: 'svg'` à `'webp'` (ou `'jpg'`).

Conseils : format carré **1600 × 1600 px** (le zoom ×2,5 a besoin de détails), WebP ≈ 150–250 Ko.
Pour des noms de fichiers libres, renseigne `images: ['images/bordeaux/photo-a.jpg', …]` (5 chemins) dans la couleur.
Pense aussi à mettre à jour la ligne `<link rel="preload" as="image" …>` et la 1re image de la galerie
dans `index.html` si tu changes la couleur par défaut ou l'extension.

### Textes, FAQ, pop-up, avis

- Tous les textes : `TEXTS` (bandeau défilant, étapes, contenu du kit, FAQ, footer, panier…).
  Les mots entre `{accolades}` sont remplacés automatiquement (liste en tête de `config.js`).
- Pop-up : `POPUP` (délai, code promo, textes, `enabled: false` pour la couper).
  Elle s'affiche une seule fois par session. Le code `BIENVENUE10` doit exister dans Shopify
  (Remises → Code de réduction).
- Avis clients : la section existe mais reste **cachée et vide**. Une fois Judge.me ou Loox
  installé, colle le widget dans `#reviews-widget` (voir le commentaire dans `index.html`) puis passe
  `REVIEWS.visible` à `true`.

### Paiement / panier

- `CHECKOUT_URL` : destination du bouton « Passer commande ».
- `CART_PERMALINK_BASE: 'https://red-nails.fr/cart'` : si la page est hébergée **hors** Shopify,
  le bouton envoie directement le panier (`/cart/VARIANT:QTE,…`). Il faut alors des vrais `variantId`.
- `DEMO_MODE: false` retire la mention « mode démo » du tiroir panier.

### Pixels publicitaires

Si le pixel Meta (`fbq`) ou TikTok (`ttq`) est installé dans le `<head>`, la page envoie
automatiquement `ViewContent`, `AddToCart` et `InitiateCheckout` (fonction `track()` dans `app.js`).

---

## ⚠️ À valider avant la mise en ligne

- **Promesses produit** (pose 10 min, réutilisable, tenue 2 semaines) et **contenu du kit** : avec le fournisseur.
- **« Le plus choisi »** sur le lot de 3 : doit refléter tes ventes réelles, sinon mets `highlight: ''`.
- **« Satisfaite ou remboursée 14 jours »** (bandeau) va plus loin que le simple droit de rétractation.
  Vérifie que tes CGV le prévoient bien, notamment pour des ongles déjà posés (hygiène).
- **« 40 € et plus » la pose en institut** : garde une source de prix moyen sous la main.
- **Pages légales** : modèles à compléter (mentions légales, CGV avec formulaire de rétractation,
  confidentialité, cookies et consentement pour les pixels).

---

## Porter la page en section Shopify (Liquid)

La page est pensée pour devenir **une section de template produit** (`sections/rn-landing.liquid`).

### 1. Fichiers

| Fichier actuel | Dans le thème Shopify |
|---|---|
| `styles.css` | `assets/rn-landing.css` → `{{ 'rn-landing.css' \| asset_url \| stylesheet_tag }}` |
| `app.js` | `assets/rn-landing.js` → `<script src="{{ 'rn-landing.js' \| asset_url }}" defer></script>` |
| `index.html` (contenu de `<main>` + barre collante + dialogs) | `sections/rn-landing.liquid` |
| `config.js` | généré en Liquid dans la section (étape 2) |
| Images | photos des variantes du produit (ou `assets/`) |

Le bandeau et le header vont plutôt dans `sections/announcement-bar` / `header` du thème.

### 2. Remplacer `config.js` par des données Shopify

Dans la section, génère `window.RN_CONFIG` à partir du produit et des réglages de la section :

```liquid
<script>
  window.RN_CONFIG = {
    /* … garde la structure de config.js, en remplaçant les valeurs : */
    CHECKOUT_URL: '/checkout',
    PRIX_REFERENCE: {% if product.compare_at_price > product.price %}{{ product.compare_at_price | divided_by: 100.0 }}{% else %}null{% endif %},
    PRODUCT: { title: {{ product.title | json }}, price: {{ product.price | divided_by: 100.0 }}, /* … */ },
    COLORS: [
      {% for variant in product.variants %}
        { id: {{ variant.option1 | handleize | json }}, name: {{ variant.option1 | json }},
          hex: {{ variant.metafields.custom.hex | default: '#C8102E' | json }},
          variantId: {{ variant.id | json }},
          images: [{% for m in variant.metafields.custom.gallery.value %}{{ m | image_url: width: 1600 | json }}{% unless forloop.last %},{% endunless %}{% endfor %}] }{% unless forloop.last %},{% endunless %}
      {% endfor %}
    ],
    /* TEXTS, FAQ, délais… : via {{ section.settings.xxx | json }} ou des blocs */
  };
</script>
```

Les textes (FAQ, étapes, bandeau) deviennent des **blocs** de section éditables dans l'éditeur de thème.

### 3. Brancher le vrai panier

Remplace le corps de `addToCart` dans `app.js` par l'API AJAX Shopify :

```js
async function addToCart(variantId, qty) {
  const res = await fetch('/cart/add.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [{ id: Number(variantId), quantity: qty }] }),
  });
  if (!res.ok) throw new Error('Ajout impossible');
  const cart = await (await fetch('/cart.js')).json();
  // → mettre à jour le compteur, puis ouvrir le tiroir panier du thème
  //   (ou garder le tiroir de démo en le remplissant avec cart.items)
  track('AddToCart', { /* … */ });
  return cart;
}
```

### 4. Prix des lots

Dans Shopify, le prix des lots s'applique via une **remise automatique** (ex. « Achetez 2, -20 % » /
« Achetez 3, -30 % » sur le produit) ou une app de bundles. Les montants affichés dans la page
(`BUNDLES`) doivent correspondre exactement à ces remises.

---

## Qualité vérifiée

- Testé dans Chrome à **375 px** (mobile, tactile) et à **1440 px** (desktop), sans défilement horizontal
  et sans erreur dans la console.
- Lighthouse (mobile, serveur avec compression) : Performance 95–98, Accessibilité 100,
  Bonnes pratiques 100, SEO 100. Desktop : 100 / 100 / 100 / 100.
- `prefers-reduced-motion` respecté : bandeau figé, pas de reflets ni d'animations d'entrée.
  Le contenu reste toujours visible sans animation (et sans JavaScript côté mise en page).
