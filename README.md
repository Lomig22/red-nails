# RED NAILS — Landing page produit

Page unique, mobile-first, pour le **Kit 30 faux ongles en gel souple** (red-nails.fr).
HTML / CSS / JavaScript vanilla, aucune dépendance, aucun build.

```
red-nails/ (racine du dépôt)
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
cd red-nails   # (dossier du dépôt)
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
- **Teinte à l'arrivée** : toujours `DEFAULT_COLOR` (Bordeaux), quelle que soit l'adresse.
  Pour une pub dédiée à une autre teinte, passe `URL_PRESELECT: true` : un lien
  `https://red-nails.fr/?couleur=rouge-cerise&lot=3` présélectionnera alors teinte et lot.
- **Kit différent selon la couleur** : par défaut un kit = `PRODUCT.nailsPerKit` ongles en
  `PRODUCT.sizes` tailles. Si une couleur est livrée dans un autre format, ajoute-lui
  `kit: { nailsPerKit: 24, sizes: 12, perSize: 2 }` (c'est le cas du Bleu Nuit). Le titre,
  le prix par ongle, les cartes de lots, le contenu du kit, la FAQ et le panier s'adaptent
  automatiquement quand cette couleur est sélectionnée.

### Délais de livraison

Dans `DELIVERY` :

- `cutoffHour: 14` → heure limite d'expédition (heure de Paris, quel que soit le fuseau de la visiteuse)
- `shipDays` / `deliveryDays` → jours ouvrés (0 = dimanche … 6 = samedi)
- `minDays: 2`, `maxDays: 4` → livraison entre J+2 et J+4 ouvrés après l'expédition
- `holidays` → jours fériés (2026 et 2027 déjà saisis ; ajoute les années suivantes)

Le texte « Commande dans 2 h 13 min → expédiée aujourd'hui · Livrée entre le… » se met à jour chaque minute.

### Photos

**Bordeaux** et **Bleu Nuit** ont leurs vraies photos (`images/bordeaux/`, `images/bleu-nuit/`).
Les autres couleurs utilisent encore des visuels SVG générés, en attendant leurs photos.

**Ordre des couleurs** : c'est l'ordre de la liste `COLORS` dans `config.js` (Bordeaux en 1er).
L'infographie « Contenu du kit » (`images/bordeaux/contenu-kit.webp`) est neutre : elle peut servir
pour toutes les couleurs, comme pour Bleu Nuit.

**Ajouter les photos d'une couleur** (ex. une future couleur) :

1. Convertis tes photos en **WebP** (format carré, 1200–1600 px, ≈ 50–150 Ko chacune) et dépose-les
   dans `images/[id-couleur]/`, ex. `images/vert-sapin/main.webp`.
2. Dans `config.js`, ajoute la liste `images` à la couleur, dans l'ordre de la galerie :

```js
{
  id: 'bleu', name: 'Bleu Nuit', hex: '#1B2A6B', variantId: 'VARIANT_BLEU', desc: '…',
  images: [
    { src: 'images/vert-sapin/main.webp', label: 'Sur la main', alt: 'Faux ongles {color} posés sur des mains' },
    { src: 'images/vert-sapin/set.webp',  label: 'Le set',      alt: 'Les 30 faux ongles {color} du kit' },
    // … autant de photos que tu veux
  ],
  thumbImage: 0, // photo utilisée en vignette (cartes couleur, barre collante, panier)
  kitImage: 3,   // photo utilisée dans « Ce que contient ton kit »
},
```

`label` s'affiche sur les miniatures (lecteurs d'écran), `alt` décrit la photo (accessibilité et SEO).
Une couleur sans `images` garde ses visuels générés (`node tools/generate-placeholders.js`).

La couleur affichée à l'arrivée est `DEFAULT_COLOR` (actuellement `bordeaux`). Si tu la changes,
mets aussi à jour dans `index.html` la ligne `<link rel="preload" as="image" …>` et la 1re image
de la galerie (même chemin que la 1re photo de la couleur) : c'est ce qui rend l'affichage instantané.

### Textes, FAQ, pop-up, avis

- Tous les textes : `TEXTS` (bandeau défilant, étapes, contenu du kit, FAQ, footer, panier…).
  Les mots entre `{accolades}` sont remplacés automatiquement (liste en tête de `config.js`).
- Pop-up : `POPUP` (délai, code promo, textes, `enabled: false` pour la couper).
  Elle s'affiche après 12 s (ou à l'intention de sortie sur ordinateur), puis revient toutes les
  `repeatEveryMinutes` (2 min) après fermeture, au maximum `maxPerSession` fois (5) par visite.
  Elle ne revient plus dès que la visiteuse a copié le code. Le code `BIENVENUE10` doit exister dans Shopify
  (Remises → Code de réduction).
- Avis clients : la section existe mais reste **cachée et vide**. Une fois Judge.me ou Loox
  installé, colle le widget dans `#reviews-widget` (voir le commentaire dans `index.html`) puis passe
  `REVIEWS.visible` à `true`.

### Paiement Whop (mode actuel)

`CHECKOUT_MODE: 'direct'` : chaque bouton d'achat (« Commander », barre collante, « J'en profite »,
cartes teintes) envoie directement vers le lien Whop de la **teinte + du lot** sélectionnés.
Les liens sont dans `config.js`, champ `checkout` de chaque couleur :

```js
checkout: { 1: 'https://whop.com/checkout/plan_…', 2: '…', 3: '…' },
```

Pour changer un prix ou un lien : modifie le plan dans Whop **et** le prix dans `BUNDLES` (le site
affiche ses propres prix). Le panier et l'icône panier sont masqués dans ce mode
(`CHECKOUT_MODE: 'cart'` pour les retrouver).

### Événement Achat (page merci.html)

Le paiement se fait sur Whop : l'Achat Meta est envoyé par **merci.html**, la page de confirmation.
- Juste avant d'envoyer la cliente sur Whop, le site enregistre la commande (teinte, lot, montant).
- Sur merci.html, l'événement `Purchase` part **une seule fois** avec le vrai montant, et seulement
  si la cliente a accepté les cookies. Sans commande enregistrée (page ouverte directement), rien n'est envoyé.
- **À régler dans Whop** : l'URL de redirection après paiement de chaque plan →
  `https://red-nails.fr/merci.html` (ou l'adresse où le site est en ligne).

### Paiement / panier

- `CHECKOUT_URL` : destination du bouton « Passer commande ».
- `CART_PERMALINK_BASE: 'https://red-nails.fr/cart'` : si la page est hébergée **hors** Shopify,
  le bouton envoie directement le panier (`/cart/VARIANT:QTE,…`). Il faut alors des vrais `variantId`.
- `DEMO_MODE: false` retire la mention « mode démo » du tiroir panier.

### Pixel Meta & cookies

- ID du pixel : `META_PIXEL_ID` dans `config.js` (actuellement `2750897045307789`).
- Le pixel ne se charge **qu'après « Accepter »** dans la bannière cookies (obligation CNIL).
  « Refuser » est aussi visible qu'« Accepter », et le choix se modifie via « Gérer les cookies »
  en bas de page.
- Événements envoyés : `PageView`, `ViewContent`, `AddToCart`, `InitiateCheckout`
  (les événements faits avant la réponse sont envoyés juste après « Accepter »).
- **Purchase** (indispensable pour l'objectif « Ventes ») se déclenche sur la page de paiement
  Shopify : installe l'app **Facebook & Instagram** de Shopify avec ce même pixel (elle ajoute aussi
  l'API de conversion), et active la bannière cookies Shopify. Sur Shopify, tu peux alors passer
  `CONSENT.enabled` à `false` et laisser l'app gérer le pixel pour éviter les doublons.

---

### Avis clientes

La note sous le titre et la section « Elles les portent » s'affichent **automatiquement dès qu'il y a de
vrais avis** dans `REVIEWS.items` (format dans `config.js`), ou en collant le widget Judge.me / Loox dans
`#reviews-widget`. Tant que la liste est vide, rien ne s'affiche.
Pour voir la mise en page sans rien publier : ajoute `?apercu-avis=1` à l'adresse (exemples fictifs,
signalés comme tels). ⚠️ N'ajoute jamais d'avis inventés ou copiés d'un autre vendeur (art. L121-4 du
Code de la consommation).

### Livraison selon la ville

Le bloc livraison affiche « Livraison à Marseille » grâce à la ville devinée depuis l'adresse IP
(service gratuit GeoJS, sans demande d'autorisation). Désactivable avec `DELIVERY.geolocate: false`.
À mentionner dans la politique de confidentialité.

### Design

- Polices : **Fraunces** (titres, prix) et **Jost** (texte), chargées depuis Google Fonts.
- Couleurs : variables en haut de `styles.css` (`--red`, `--ink`, `--bg`…).
- Les boutons d'achat « s'illuminent » (halo + reflet) : classe `btn--glow`, coupée si la visiteuse
  a activé la réduction des animations.

## ⚠️ À valider avant la mise en ligne

- **Promesses produit** (pose 10 min, réutilisable, tenue jusqu'à 2 semaines) : avec le fournisseur.
  La tenue « 2 semaines » est surtout atteinte avec de la colle ; le kit contient des pastilles adhésives.
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
