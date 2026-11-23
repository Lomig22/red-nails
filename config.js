/* ==========================================================================
   RED NAILS — CONFIGURATION
   --------------------------------------------------------------------------
   TOUT le contenu modifiable de la page est ici : prix, couleurs, photos,
   textes, délais, avis, FAQ, pop-up… Pas besoin de toucher index.html ni app.js.

   Règles simples :
   - Les prix s'écrivent avec un POINT : 24.99 (et pas 24,99).
   - Les textes s'écrivent entre guillemets simples '…'. Pour une apostrophe,
     utilise le caractère typographique ’ (ex. 'l’ongle').
   - Les mots entre accolades sont remplacés automatiquement :
       {price}        prix du kit seul                 → 24,99 €
       {perNail}      prix par ongle du kit seul       → 0,83 €
       {minPerNail}   meilleur prix par ongle          → 0,58 €
       {maxDiscount}  meilleure remise des lots        → 30
       {nails}        nb d'ongles du kit (selon la couleur)  → 30
       {sizes}        nb de tailles (selon la couleur)       → 15
       {perSize}      ongles par taille                      → 2
       {length} / {width}  dimensions des ongles (selon la couleur)
       {shipping}     frais de livraison (0 = offerte)  → 0 €
       {freeFrom}     nb de kits pour la livraison offerte → 1 (offerte dès 1 kit)
       {cutoff}       heure limite d'expédition        → 14h
       {minDays} / {maxDays}  délais de livraison en jours ouvrés
       {returnDays}   délai de rétractation            → 14
       {colorCount}   nombre de couleurs proposées
       {color}        couleur sélectionnée
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. CONSTANTES PRINCIPALES
   -------------------------------------------------------------------------- */

// URL de paiement. Sur Shopify : https://red-nails.fr/checkout
const CHECKOUT_URL = 'https://red-nails.fr/checkout';

// Prix du kit seul.
const PRIX_UNITAIRE = 24.99;

// Prix barré sur le kit seul.
// Uniquement si ce prix a réellement été pratiqué : la loi impose le prix le plus bas des 30 derniers jours.
// (Article L112-1-1 du Code de la consommation.) Laisse null pour ne rien afficher. Ex. : 34.99
const PRIX_REFERENCE = null;

// Frais de livraison. Livraison OFFERTE sur toutes les commandes, dès 1 kit.
// (Pour la rendre payante à nouveau : mets le prix ici et freeFromKits à 2.)
const FRAIS_LIVRAISON = 0;

// Visuels communs à toutes les teintes (kit de 30 ongles en 15 tailles, mode d'emploi).
const KIT_CONTENT = { src: 'images/commun/contenu-kit.webp', label: 'Contenu du kit', alt: 'Contenu du kit : 30 ongles en 15 tailles avec leurs dimensions, lime à ongles et pastilles adhésives' };
const USAGE_GUIDE = { src: 'images/commun/guide-utilisation.webp', label: 'Mode d’emploi', alt: 'Comment poser les faux ongles RED NAILS en 6 étapes : limer, nettoyer, coller l’adhésif, choisir la taille, appuyer, c’est terminé' };

/* --------------------------------------------------------------------------
   2. CONFIGURATION COMPLÈTE
   -------------------------------------------------------------------------- */
window.RN_CONFIG = {
  BRAND: 'RED NAILS',
  DOMAIN: 'red-nails.fr',
  LOCALE: 'fr-FR',
  CURRENCY: 'EUR',

  CHECKOUT_URL: CHECKOUT_URL,
  // Code promo pré-appliqué sur le checkout Whop (paramètre ?promoCode=, testé :
  // 24,99 € → 22,49 € affiché à l'arrivée sur Whop). null pour ne rien appliquer.
  // Le code doit exister et être actif dans Whop (Codes promo).
  CHECKOUT_PROMO_CODE: 'BIENVENUE10',
  CHECKOUT_PROMO_PERCENT: 10,   // sert à afficher la remise et à calculer la valeur de l'Achat
  // true une fois le webhook Whop → API Conversions Meta en place (/api/whop-webhook) :
  // l'Achat est alors envoyé par le serveur, et la page merci ne l'envoie plus que si Whop
  // fournit l'identifiant du paiement (?payment=pay_…), pour un dédoublonnage exact.
  PURCHASE_SERVER_SIDE: false,
  // Mesure d'audience sans cookie ni consentement (Vercel Web Analytics).
  // À activer dans Vercel : projet > Analytics > Enable. Les événements personnalisés
  // (scroll, clics…) nécessitent l'offre Vercel Pro. Alternative : Plausible (domaine ci-dessous).
  ANALYTICS: { vercel: true, plausibleDomain: null },

  // 'direct' : chaque bouton d'achat envoie directement vers le lien de paiement
  // Whop de la teinte + du lot choisis (champ "checkout" de chaque couleur).
  // 'cart' : ancien tiroir panier (démo / Shopify).
  CHECKOUT_MODE: 'direct',
  // Optionnel : lien panier Shopify "permalink" (https://red-nails.fr/cart).
  CART_PERMALINK_BASE: null,
  // true = affiche une mention "mode démo" dans le tiroir panier.
  DEMO_MODE: false,

  PRIX_REFERENCE: PRIX_REFERENCE,

  /* ---------- Produit ---------- */
  PRODUCT: {
    eyebrow: 'Collection Gel Souple',
    title: 'Kit {nails} faux ongles', // {nails} suit la couleur choisie
    titleAccent: 'en gel souple',      // partie en italique du titre
    price: PRIX_UNITAIRE,
    // Caractéristiques par défaut du kit. Une couleur peut avoir un kit
    // différent : voir "kit: { … }" dans COLORS. Aujourd'hui : 30 ongles pour toutes.
    nailsPerKit: 30,
    sizes: 15,
    perSize: 2,
    length: '1,36 – 2,08 cm', // longueur des ongles, de la plus petite à la plus grande taille
    width: '0,65 – 1,39 cm',  // largeur
    // ⚠️ Promesses à valider avec le fournisseur avant mise en ligne.
    promises: [
      { icon: 'clock', text: 'Pose en 10 min' },
      { icon: 'repeat', text: 'Réutilisable' },
      { icon: 'drop', text: 'Sans lampe UV' },
    ],
  },

  /* ---------- Lots ----------
     Prix barré des lots = quantité × prix du kit seul réellement pratiqué.
     Le badge -X % et l'économie sont calculés automatiquement.
     ⚠️ "Le plus choisi" doit correspondre à la réalité de tes ventes.        */
  BUNDLES: [
    { qty: 1, price: PRIX_UNITAIRE, label: '1 kit', highlight: '' },
    { qty: 2, price: 39.98, label: '2 kits', highlight: 'Le plus choisi' },
    { qty: 3, price: 52.47, label: '3 kits', highlight: '' },
  ],
  // Lot présélectionné à l'arrivée (0 = 1 kit, 1 = 2 kits, 2 = 3 kits).
  // 1 kit à 24,99 € = le prix annoncé dans les publicités. 2 et 3 kits restent
  // proposés en montée en gamme.
  DEFAULT_BUNDLE: 0,
  CTA_PRESELECT_BEST: false,
  // Cartes de la section "Trouve ta teinte" : nombre de kits commandés au clic
  // (1 = "Commander · 24,99 €", quel que soit le lot choisi plus haut).
  SHADE_CARD_QTY: 1,

  /* ---------- Livraison ---------- */
  SHIPPING: {
    price: FRAIS_LIVRAISON,
    freeFromKits: 1, // livraison offerte dès 1 kit = partout
  },

  /* ---------- Promesse de livraison avec date ---------- */
  DELIVERY: {
    timeZone: 'Europe/Paris',
    cutoffHour: 14,
    cutoffMinute: 0,
    shipDays: [1, 2, 3, 4, 5], // 0 = dim, 1 = lun … 6 = sam
    deliveryDays: [1, 2, 3, 4, 5],
    minDays: 2,
    maxDays: 4,
    holidays: [
      '2026-01-01', '2026-04-06', '2026-05-01', '2026-05-08', '2026-05-14',
      '2026-05-25', '2026-07-14', '2026-08-15', '2026-11-01', '2026-11-11',
      '2026-12-25',
      '2027-01-01', '2027-03-29', '2027-05-01', '2027-05-06', '2027-05-08',
      '2027-05-17', '2027-07-14', '2027-08-15', '2027-11-01', '2027-11-11',
      '2027-12-25',
    ],
    // Ville de la visiteuse (ex. "Livraison à Marseille") devinée à partir de
    // son adresse IP via un service gratuit, sans demande d'autorisation.
    // ⚠️ À mentionner dans la politique de confidentialité. false pour couper.
    geolocate: true,
    geoUrl: 'https://get.geojs.io/v1/ip/geo.json',
  },

  RETURN_DAYS: 14,

  /* ---------- Couleurs ----------
     L'ORDRE DE LA LISTE = l'ordre des pastilles et des cartes couleur.
     id          : nom du dossier /images/[id]/ et paramètre d'URL (?couleur=bordeaux)
     hex         : teinte de la pastille (prélevée sur les photos)
     variantId   : ID de la variante Shopify (à remplacer)
     kit         : (optionnel) caractéristiques si un jour une teinte a un format différent
                   ex. kit: { nailsPerKit: 24, sizes: 12, perSize: 2, length: '…', width: '…' }
     images      : vraies photos, dans l'ordre de la galerie
     thumbImage  : photo utilisée en vignette (barre collante, panier)
     cardImage   : photo produit seul sur fond neutre (section "Les teintes")
     detailImage : gros plan pour la section "Le détail"
     kitImage    : visuel de la section "Dans ton kit"                        */
  COLORS: [
    {
      id: 'bordeaux', name: 'Bordeaux', hex: '#6E0F1C', variantId: 'VARIANT_BORDEAUX',
      // Liens de paiement Whop : nombre de kits -> checkout
      checkout: { 1: 'https://whop.com/checkout/plan_w7AeKgI8selsO', 2: 'https://whop.com/checkout/plan_XrxfXolHqTgFw', 3: 'https://whop.com/checkout/plan_C1kYOZiQsHTtc' },
      desc: 'Profond et élégant, du bureau au dîner.',
      images: [
        { src: 'images/bordeaux/main.webp', label: 'Portés', alt: 'Faux ongles {color} en forme amande posés sur des mains' },
        { src: 'images/bordeaux/set.webp', label: 'Le set', alt: 'Les 30 faux ongles {color} du kit' },
        { src: 'images/bordeaux/finition.webp', label: 'Finition', alt: 'Faux ongles {color} à la finition brillante, rangés par taille' },
        { src: 'images/bordeaux/quotidien.webp', label: 'Au quotidien', alt: 'Ongles rouges au quotidien : taper au clavier, jardiner, faire la vaisselle, jouer avec son chien' },
        KIT_CONTENT,
        USAGE_GUIDE,
      ],
      thumbImage: 0, cardImage: 2, detailImage: 0, kitImage: 1,
    },
    {
      id: 'rouge-cerise', name: 'Rouge Cerise', hex: '#C8102E', variantId: 'VARIANT_ROUGE_CERISE',
      // Liens de paiement Whop : nombre de kits -> checkout
      checkout: { 1: 'https://whop.com/checkout/plan_TLMgs7ifrt6tH', 2: 'https://whop.com/checkout/plan_uBSNP1qPLf0W4', 3: 'https://whop.com/checkout/plan_HfY8Ph7pd4rKa' },
      desc: 'Le rouge signature, brillant comme un vernis laqué.',
      images: [
        { src: 'images/rouge-cerise/main.webp', label: 'Portés', alt: 'Faux ongles {color} en forme amande posés sur une main' },
        { src: 'images/rouge-cerise/main-2.webp', label: 'Gros plan', alt: 'Gros plan sur la brillance laquée des faux ongles {color}' },
        KIT_CONTENT,
        USAGE_GUIDE,
      ],
      thumbImage: 0, cardImage: 0, detailImage: 1, kitImage: 1,
    },
    {
      id: 'bleu-nuit', name: 'Bleu Nuit', hex: '#1B2A5E', variantId: 'VARIANT_BLEU_NUIT',
      // Liens de paiement Whop : nombre de kits -> checkout
      checkout: { 1: 'https://whop.com/checkout/plan_pLz48nlucjL5p', 2: 'https://whop.com/checkout/plan_NZKj1fHnDAHJN', 3: 'https://whop.com/checkout/plan_nCFzSbpwyOsgf' },
      desc: 'Un marine profond, chic et inattendu.',
      images: [
        { src: 'images/bleu-nuit/main.webp', label: 'Portés', alt: 'Faux ongles {color} en forme amande posés sur une main' },
        { src: 'images/bleu-nuit/main-2.webp', label: 'Brillance', alt: 'Gros plan sur les faux ongles {color} et leur reflet laqué' },
        { src: 'images/bleu-nuit/main-3.webp', label: 'Portés', alt: 'Mains aux faux ongles {color} en forme amande' },
        { src: 'images/bleu-nuit/main-4.webp', label: 'Portés', alt: 'Faux ongles {color} posés sur deux mains' },
        { src: 'images/bleu-nuit/finition.webp', label: 'Finition', alt: 'Faux ongles {color} en gel souple, finition brillante' },
        KIT_CONTENT,
        USAGE_GUIDE,
      ],
      thumbImage: 0, cardImage: 4, detailImage: 1, kitImage: 4,
    },
    {
      id: 'rose-bonbon', name: 'Rose Bonbon', hex: '#D81B60', variantId: 'VARIANT_ROSE_BONBON',
      // Liens de paiement Whop : nombre de kits -> checkout
      checkout: { 1: 'https://whop.com/checkout/plan_ZGT3Ll4AYLb4l', 2: 'https://whop.com/checkout/plan_KeM2oCuvhuzn1', 3: 'https://whop.com/checkout/plan_oGPS7QbLCNarD' },
      desc: 'Un rose framboise, joyeux et lumineux.',
      images: [
        { src: 'images/rose-bonbon/main.webp', label: 'Portés', alt: 'Faux ongles {color} en forme amande posés sur des mains' },
        { src: 'images/rose-bonbon/finition.webp', label: 'Finition', alt: 'Faux ongles {color} à la finition brillante, rangés par taille' },
        { src: 'images/rose-bonbon/set.webp', label: 'Le set', alt: 'Les faux ongles {color} du kit' },
        KIT_CONTENT,
        USAGE_GUIDE,
      ],
      thumbImage: 0, cardImage: 1, detailImage: 0, kitImage: 1,
    },
    {
      id: 'nude-rose', name: 'Nude Rosé', hex: '#EAC7C3', variantId: 'VARIANT_NUDE_ROSE',
      // Liens de paiement Whop : nombre de kits -> checkout
      checkout: { 1: 'https://whop.com/checkout/plan_In8yb9hD9X9V6', 2: 'https://whop.com/checkout/plan_tXPZolv6fAaMa', 3: 'https://whop.com/checkout/plan_Pih5WXR3t2r4m' },
      desc: 'L’effet ongles parfaits, rosé et laiteux.',
      images: [
        { src: 'images/nude-rose/main.webp', label: 'Portés', alt: 'Faux ongles {color} en forme amande posés sur des mains' },
        { src: 'images/nude-rose/macro.webp', label: 'Gros plan', alt: 'Gros plan sur la brillance laquée des faux ongles {color}' },
        { src: 'images/nude-rose/main-2.webp', label: 'Portés', alt: 'Deux mains aux faux ongles {color} en forme amande' },
        { src: 'images/nude-rose/set.webp', label: 'Le set', alt: 'Les faux ongles {color} du kit' },
        KIT_CONTENT,
        USAGE_GUIDE,
      ],
      thumbImage: 0, cardImage: 3, detailImage: 1, kitImage: 3,
    },
    {
      id: 'noir-laque', name: 'Noir Laqué', hex: '#121012', variantId: 'VARIANT_NOIR_LAQUE',
      // Liens de paiement Whop : nombre de kits -> checkout
      checkout: { 1: 'https://whop.com/checkout/plan_7Mz64YN5DUAmm', 2: 'https://whop.com/checkout/plan_T8rfjUQXshyvU', 3: 'https://whop.com/checkout/plan_P0kYdXtQcXQTX' },
      desc: 'Un noir miroir, intense et graphique.',
      images: [
        { src: 'images/noir-laque/main.webp', label: 'Portés', alt: 'Faux ongles {color} en forme amande posés sur une main' },
        { src: 'images/noir-laque/set.webp', label: 'Le set', alt: 'Les 30 faux ongles {color} du kit' },
        { src: 'images/noir-laque/finition.webp', label: 'Finition', alt: 'Faux ongles {color} à la finition miroir, rangés par taille' },
        KIT_CONTENT,
        USAGE_GUIDE,
      ],
      thumbImage: 0, cardImage: 1, detailImage: 0, kitImage: 1,
    },
    {
      id: 'french-blanc', name: 'French Blanc', hex: '#F1D3CB', tip: '#FFFFFF', variantId: 'VARIANT_FRENCH_BLANC',
      // Liens de paiement Whop : nombre de kits -> checkout
      checkout: { 1: 'https://whop.com/checkout/plan_H5mITBjh8MdR4', 2: 'https://whop.com/checkout/plan_seVIrEiUZhFkD', 3: 'https://whop.com/checkout/plan_dYoCTtXmEuP8H' },
      desc: 'La French intemporelle, bout blanc net.',
      images: [
        { src: 'images/french-blanc/main.webp', label: 'Portés', alt: 'Faux ongles {color} en forme amande, base rosée et bout blanc' },
        { src: 'images/french-blanc/main-2.webp', label: 'Portés', alt: 'Mains aux faux ongles {color} en forme amande' },
        { src: 'images/french-blanc/main-3.webp', label: 'Portés', alt: 'Faux ongles {color} posés sur deux mains' },
        KIT_CONTENT,
        USAGE_GUIDE,
      ],
      thumbImage: 0, cardImage: 1, detailImage: 0, kitImage: 1,
    },
  ],
  DEFAULT_COLOR: 'bordeaux',
  // false = on arrive TOUJOURS sur DEFAULT_COLOR et DEFAULT_BUNDLE, quelle que soit
  // l'adresse. true = un lien ?couleur=rouge-cerise&lot=3 présélectionne teinte et lot
  // (utile pour une pub dédiée à une autre teinte).
  URL_PRESELECT: false,

  /* Visuels par défaut d'une couleur sans "images" (générés par tools/) */
  IMAGE_EXT: 'svg',
  GALLERY_VIEWS: [
    { file: '1-set', label: 'Le set', alt: 'Set de faux ongles {color} en gel souple' },
    { file: '2-main', label: 'Portés', alt: 'Faux ongles {color} posés sur une main' },
    { file: '3-finition', label: 'Finition', alt: 'Gros plan sur la finition laquée d’un ongle {color}' },
    { file: '4-tailles', label: 'Les tailles', alt: 'Les {sizes} tailles de faux ongles {color}' },
    { file: '5-kit', label: 'Le kit', alt: 'Kit complet RED NAILS {color}' },
  ],

  /* ---------- Avis clients ----------
     ⚠️ UNIQUEMENT de vrais avis de vraies clientes (avis inventés = pratique
     commerciale trompeuse, art. L121-4 du Code de la consommation).
     Tant que la liste est vide, les étoiles et la section avis sont masquées.
     Pour voir la mise en page avec des exemples (jamais publiés) : ajoute
     ?apercu-avis=1 à l'adresse de la page.
     Format d'un avis :
       { name: 'Camille D.', city: 'Lyon', rating: 5, date: '2026-11-18',
         color: 'bordeaux', title: 'Bluffant', text: '…',
         photo: 'images/avis/camille.webp', verified: true }
     Si tu branches Judge.me ou Loox, laisse la liste vide et colle leur
     widget dans #reviews-widget (index.html).                                */
  REVIEWS: {
    // TODO : coller ici les VRAIS avis de vraies clientes, puis supprimer ce commentaire.
    // Tant que la liste est vide, la section #avis et la note sous le titre sont masquées.
    // Modèle (provisoire, NE PAS publier tel quel) :
    //   { name: 'Prénom N.', rating: 5, text: 'Texte exact de la cliente…',
    //     color: 'bordeaux', date: '2026-11-30', city: 'Ville', verified: true },
    // Aperçu de la mise en page avec des exemples marqués « fictifs » : ajoute
    // ?apercu-avis=1 à l'adresse (jamais visible sans ce paramètre).
    items: [],
    eyebrow: 'Avis clientes',
    title: 'Elles les portent',
    verified: 'Achat vérifié',
    countLabel: '{count} avis',
    previewNotice: 'Aperçu de mise en page : exemples fictifs, jamais affichés sur le site en ligne.',
  },

  /* ---------- Pixel Meta & consentement (CNIL) ----------
     Le pixel n'est chargé QU'APRÈS l'accord de la visiteuse ("Accepter"),
     comme l'exige la CNIL pour les traceurs publicitaires. Les événements
     PageView, ViewContent, AddToCart et InitiateCheckout sont alors envoyés.
     Sur Shopify : utilise plutôt l'app "Facebook & Instagram" (pixel + API
     de conversion + événement Purchase) et la bannière cookies de Shopify.   */
  META_PIXEL_ID: '2750897045307789',
  CONSENT: {
    enabled: true,
    title: 'Un dernier détail',
    text: 'Cookies de mesure de nos pubs (Meta, Whop). Sans effet sur ta commande.',
    accept: 'Accepter',
    refuse: 'Refuser',
    more: 'En savoir plus',
    moreHref: 'confidentialite.html',
    manage: 'Gérer les cookies',
  },

  /* ---------- Pop-up promo ---------- */
  POPUP: {
    enabled: true,
    // Jamais au chargement : au premier des deux événements ci-dessous,
    // une seule fois par visiteuse (mémorisé, même après rechargement),
    // et jamais si elle a déjà cliqué sur un bouton de commande.
    triggerSeconds: 50,
    triggerScrollPercent: 50,
    eyebrow: 'Bienvenue chez RED NAILS',
    title: '-10 %',
    subtitle: 'sur ta première commande',
    // Remise pré-appliquée (CHECKOUT_PROMO_CODE) : rien à copier ni à saisir.
    text: 'Ta remise est déjà appliquée : tu la verras directement sur la page de paiement.',
    // Si CHECKOUT_PROMO_CODE est null : texte et code affichés à la place.
    textManual: 'Saisis ce code dans « Code promo et détails », en haut de la page de paiement :',
    code: 'BIENVENUE10',
    copyLabel: 'Copier',
    copiedLabel: 'Copié ✓',
    cta: 'J’en profite',
    dismiss: 'Non merci',
  },

  /* ---------- Textes de la page ---------- */
  TEXTS: {
    announce: [
      'Livraison offerte',
      'Jusqu’à -30 % sur les lots',
      'Paiement sécurisé',
      'Satisfaite ou remboursée 14 jours',
    ],

    product: {
      colorLegend: 'Teinte',
      bundleLegend: 'Quantité',
      perNail: 'soit {value} l’ongle',
      save: 'Tu économises {amount}',
      nailsCount: '{count} ongles',
      freeShipping: 'Livraison offerte',
      shippingPaid: 'Livraison suivie {shipping} · offerte dès {freeFrom} kits',
      shippingFree: 'Livraison suivie offerte',
      addToCart: 'Commander',
      stickyAdd: 'Commander',
      redirecting: 'Paiement sécurisé…',
      prev: 'Photo précédente',
      next: 'Photo suivante',
    },

    delivery: {
      title: 'Livraison à {city}',
      titleNoCity: 'Livraison suivie',
      countdown: 'Commande dans {time}, expédiée {shipLabel}',
      noCountdown: 'Commande maintenant, expédiée {shipLabel}',
      range: 'Reçue entre le {from} et le {to}',
      today: 'aujourd’hui',
      tomorrow: 'demain',
      steps: ['Commandé', 'Expédié', 'Livré'],
    },

    reassurance: [
      { icon: 'lock', title: 'Paiement sécurisé', text: 'Données chiffrées' },
      { icon: 'return', title: 'Retours 14 jours', text: 'Satisfaite ou remboursée' },
      { icon: 'truck', title: 'Livraison suivie', text: 'Suivi par e-mail' },
    ],

    cta: 'J’en profite · jusqu’à -{maxDiscount} %',
    promoReminder: 'Code -10 % : {code} · à saisir dans « Code promo et détails » au paiement',
    ctaNote: 'Livraison offerte · Retours {returnDays} jours',

    // Section "Le détail" (remplace l'ancienne comparaison de prix)
    details: {
      eyebrow: 'Le détail fait la différence',
      title: 'La précision',
      titleAccent: 'd’une pose en institut',
      intro: 'Chaque ongle est pensé pour se faire oublier : il épouse ton ongle naturel et garde l’éclat d’un vernis fraîchement posé.',
      items: [
        { title: 'Gel souple', text: 'Une matière flexible qui suit la courbe de ton ongle, pour un rendu naturel et confortable.' },
        { title: 'Finition laquée', text: 'L’effet miroir d’un vernis gel, sans lampe UV ni temps de séchage.' },
        { title: 'Forme amande', text: 'Une silhouette affinée qui allonge la main, de {length} de long.' },
        { title: '{sizes} tailles calibrées', text: '{perSize} ongles par taille, de {width} de large, pour un ajustement au millimètre.' },
      ],
    },

    steps: {
      eyebrow: 'Mode d’emploi',
      title: 'Une manucure parfaite',
      titleAccent: 'en 10 minutes',
      intro: 'Pas besoin d’être experte : tout est dans le kit, il te faut seulement 10 minutes et des mains propres.',
      items: [
        { time: '1 min', title: 'Prépare tes ongles', text: 'Lime légèrement la surface et les bords, puis nettoie et sèche bien chaque ongle.', tip: 'Un ongle bien dégraissé, c’est une tenue doublée.' },
        { time: '2 min', title: 'Trouve tes tailles', text: 'Présente chaque faux ongle : il doit couvrir ton ongle d’un bord à l’autre sans toucher la peau. Prépare tes 10 ongles dans l’ordre avant de commencer.', tip: 'Entre deux tailles, prends la plus grande et lime les côtés.' },
        { time: '2 min', title: 'Pose les pastilles', text: 'Colle une pastille adhésive sur chaque ongle naturel et retire le film protecteur.', tip: 'Ne touche pas la face collante avec les doigts.' },
        { time: '5 min', title: 'Applique et presse', text: 'Place le faux ongle de la cuticule vers la pointe et presse 30 secondes, en insistant sur les côtés.', tip: 'Évite l’eau chaude pendant l’heure qui suit.' },
      ],
      done: 'C’est fini. Tu peux les retirer en douceur après un bain d’eau tiède savonneuse, et les reposer plus tard.',
    },

    colors: {
      eyebrow: '{colorCount} teintes laquées',
      title: 'Trouve ta',
      titleAccent: 'teinte',
      intro: 'Choisis ta teinte et passe directement au paiement.',
      buy: 'Commander · {price}',          // bouton des cartes : achat direct
      buyMeta: '{bundle} · {shipping}',    // rappel sous le bouton
      shippingPaid: 'livraison {shipping}',
      redirecting: 'Paiement…',
      soon: 'Photos à venir',
    },

    // ⚠️ Contenu du kit à valider avec le fournisseur.
    kit: {
      eyebrow: 'Tout est inclus',
      title: 'Dans ton',
      titleAccent: 'kit',
      items: [
        { qty: '{nails}', title: 'Faux ongles en gel souple', text: 'Forme amande, finition laquée, {sizes} tailles × {perSize}.' },
        { qty: '1', title: 'Planche de pastilles adhésives', text: 'Pour une pose sans colle liquide, nette et sans odeur.' },
        { qty: '1', title: 'Lime à ongles', text: 'Pour préparer tes ongles et ajuster un faux ongle si besoin.' },
      ],
      specsTitle: 'Fiche technique',
      specs: [
        { label: 'Matière', value: 'Gel souple' },
        { label: 'Forme', value: 'Amande' },
        { label: 'Longueur', value: '{length}' },
        { label: 'Largeur', value: '{width}' },
        { label: 'Tailles', value: '{sizes} tailles × {perSize} ongles' },
        { label: 'Pose', value: 'Pastilles adhésives, sans lampe UV' },
        { label: 'Temps de pose', value: '10 minutes environ' },
        { label: 'Réutilisable', value: 'Oui, avec de nouvelles pastilles' },
      ],
    },

    faq: {
      eyebrow: 'Questions fréquentes',
      title: 'Tout ce que tu',
      titleAccent: 'veux savoir',
      items: [
        { q: 'Combien de temps ça tient ?', a: 'Jusqu’à 2 semaines selon la pose. Pour une tenue maximale : ongles propres et bien secs, bonne taille pour chaque doigt, pastille bien pressée, et pas d’eau chaude pendant l’heure qui suit la pose.' },
        { q: 'Comment je choisis ma taille ?', a: 'Le kit contient {sizes} tailles, {perSize} ongles de chaque. Présente chaque faux ongle sur ton ongle naturel avant de poser la pastille : il doit le couvrir d’un bord à l’autre sans toucher la peau. Entre deux tailles, prends la plus grande et lime légèrement les côtés.' },
        { q: 'Comment je les retire sans abîmer mes ongles ?', a: 'Plonge tes doigts quelques minutes dans de l’eau tiède savonneuse, puis soulève doucement le côté du faux ongle. Ne force jamais : la pastille adhésive se décolle sans abîmer ton ongle naturel.' },
        { q: 'Ils sont réutilisables ?', a: 'Oui. Retire-les délicatement, enlève les restes de pastille, laisse sécher et range-les dans leur boîte. Tu pourras les reposer avec de nouvelles pastilles adhésives.' },
        { q: 'Quand vais-je recevoir ma commande ?', a: 'Les commandes passées avant {cutoff} un jour ouvré partent le jour même, les autres le jour ouvré suivant. La livraison suivie prend ensuite {minDays} à {maxDays} jours ouvrés. La date estimée s’affiche juste sous le bouton d’achat.' },
        // ⚠️ À aligner avec tes CGV (conditions de retour, frais de retour, hygiène).
        { q: 'Et si ça ne me plaît pas ?', a: 'Tu disposes de {returnDays} jours après réception pour exercer ton droit de rétractation, sans avoir à te justifier. Écris-nous depuis la page Contact : on t’indique la marche à suivre et on te rembourse au plus tard {returnDays} jours après ta demande.' },
        { q: 'Le paiement est-il sécurisé ?', a: 'Oui. Le paiement est chiffré et traité par un prestataire de paiement certifié. Nous n’avons jamais accès à tes coordonnées bancaires.' },
      ],
    },

    final: {
      eyebrow: 'RED NAILS',
      title: 'Tes ongles d’institut,',
      titleAccent: 'sans le rendez-vous.',
      text: 'Pose en 10 minutes, finition laquée, jusqu’à -{maxDiscount} % sur les lots.',
    },

    footer: {
      tagline: 'Faux ongles en gel souple, effet vernis laqué.',
      links: [
        { label: 'Mentions légales', href: 'mentions-legales.html' },
        { label: 'CGV', href: 'cgv.html' },
        { label: 'Politique de confidentialité', href: 'confidentialite.html' },
        { label: 'Contact', href: 'contact.html' },
      ],
      copyright: '© {year} RED NAILS · red-nails.fr',
    },

    cart: {
      title: 'Ton panier',
      empty: 'Ton panier est vide.',
      emptyCta: 'Choisir mon kit',
      kitsLabel: '{count} kit(s) · {nails} ongles',
      subtotal: 'Sous-total',
      shipping: 'Livraison',
      free: 'Offerte',
      total: 'Total',
      checkout: 'Passer commande',
      remove: 'Retirer',
      upsell: 'Ajoute 1 kit : -20 % sur ta commande',
      upsellBtn: '+ 1 kit',
      demo: 'Mode démo : le paiement sera branché sur Shopify.',
      added: 'Ajouté au panier',
    },
  },
};
