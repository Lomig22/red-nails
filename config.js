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
       {shipping}     frais de livraison 1 kit         → 3,99 €
       {freeFrom}     nb de kits pour la livraison offerte → 2
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

// Frais de livraison pour 1 kit.
const FRAIS_LIVRAISON = 3.99;

/* --------------------------------------------------------------------------
   2. CONFIGURATION COMPLÈTE
   -------------------------------------------------------------------------- */
window.RN_CONFIG = {
  BRAND: 'RED NAILS',
  DOMAIN: 'red-nails.fr',
  LOCALE: 'fr-FR',
  CURRENCY: 'EUR',

  CHECKOUT_URL: CHECKOUT_URL,
  // Optionnel : lien panier Shopify "permalink" (https://red-nails.fr/cart).
  CART_PERMALINK_BASE: null,
  // true = affiche une mention "mode démo" dans le tiroir panier.
  DEMO_MODE: true,

  PRIX_REFERENCE: PRIX_REFERENCE,

  /* ---------- Produit ---------- */
  PRODUCT: {
    eyebrow: 'Collection Gel Souple',
    title: 'Kit {nails} faux ongles', // {nails} suit la couleur choisie
    titleAccent: 'en gel souple',      // partie en italique du titre
    price: PRIX_UNITAIRE,
    // Caractéristiques par défaut du kit. Une couleur peut avoir un kit
    // différent : voir "kit: { … }" dans COLORS (ex. Bleu Nuit).
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
    { qty: 2, price: 39.98, label: '2 kits', highlight: '' },
    { qty: 3, price: 52.47, label: '3 kits', highlight: 'Le plus choisi' },
  ],
  // Lot présélectionné à l'arrivée (0 = 1 kit, 1 = 2 kits, 2 = 3 kits).
  // Le lot de 2 affiche directement un prix barré légal + la livraison offerte.
  DEFAULT_BUNDLE: 1,
  CTA_PRESELECT_BEST: false,

  /* ---------- Livraison ---------- */
  SHIPPING: {
    price: FRAIS_LIVRAISON,
    freeFromKits: 2,
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
     kit         : (optionnel) caractéristiques si différentes du kit par défaut
     images      : vraies photos, dans l'ordre de la galerie
     thumbImage  : photo utilisée en vignette (barre collante, panier)
     cardImage   : photo produit seul sur fond neutre (section "Les teintes")
     detailImage : gros plan pour la section "Le détail"
     kitImage    : visuel de la section "Dans ton kit"                        */
  COLORS: [
    {
      id: 'bordeaux', name: 'Bordeaux', hex: '#6E0F1C', variantId: 'VARIANT_BORDEAUX',
      desc: 'Profond et élégant, du bureau au dîner.',
      images: [
        { src: 'images/bordeaux/main.webp', label: 'Portés', alt: 'Faux ongles {color} en forme amande posés sur des mains' },
        { src: 'images/bordeaux/set.webp', label: 'Le set', alt: 'Les 30 faux ongles {color} du kit' },
        { src: 'images/bordeaux/finition.webp', label: 'Finition', alt: 'Faux ongles {color} à la finition brillante, rangés par taille' },
        { src: 'images/bordeaux/contenu-kit.webp', label: 'Contenu du kit', alt: 'Contenu du kit : 15 tailles d’ongles avec leurs dimensions, lime à ongles et pastilles adhésives' },
        { src: 'images/bordeaux/quotidien.webp', label: 'Au quotidien', alt: 'Ongles rouges au quotidien : taper au clavier, jardiner, faire la vaisselle, jouer avec son chien' },
      ],
      thumbImage: 0, cardImage: 2, detailImage: 0, kitImage: 3,
    },
    {
      id: 'bleu-nuit', name: 'Bleu Nuit', hex: '#1B2A5E', variantId: 'VARIANT_BLEU_NUIT',
      desc: 'Un marine profond, chic et inattendu.',
      kit: { nailsPerKit: 24, sizes: 12, perSize: 2, length: '1,90 – 2,50 cm', width: '0,70 – 1,40 cm' },
      images: [
        { src: 'images/bleu-nuit/main.webp', label: 'Portés', alt: 'Faux ongles {color} en forme amande posés sur une main' },
        { src: 'images/bleu-nuit/main-2.webp', label: 'Brillance', alt: 'Gros plan sur les faux ongles {color} et leur reflet laqué' },
        { src: 'images/bleu-nuit/main-3.webp', label: 'Portés', alt: 'Mains aux faux ongles {color} en forme amande' },
        { src: 'images/bleu-nuit/main-4.webp', label: 'Portés', alt: 'Faux ongles {color} posés sur deux mains' },
        { src: 'images/bleu-nuit/finition.webp', label: 'Finition', alt: 'Faux ongles {color} en gel souple, finition brillante' },
        { src: 'images/commun/guide-tailles.webp', label: 'Guide des tailles', alt: 'Guide des tailles : 24 ongles en 12 tailles avec leurs dimensions, et comment mesurer ses ongles' },
        { src: 'images/commun/guide-utilisation.webp', label: 'Mode d’emploi', alt: 'Comment poser les faux ongles RED NAILS en 6 étapes' },
      ],
      thumbImage: 0, cardImage: 4, detailImage: 1, kitImage: 5,
    },
    {
      id: 'rose-bonbon', name: 'Rose Bonbon', hex: '#D81B60', variantId: 'VARIANT_ROSE_BONBON',
      desc: 'Un rose framboise, joyeux et lumineux.',
      kit: { nailsPerKit: 24, sizes: 12, perSize: 2, length: '1,90 – 2,50 cm', width: '0,70 – 1,40 cm' },
      images: [
        { src: 'images/rose-bonbon/main.webp', label: 'Portés', alt: 'Faux ongles {color} en forme amande posés sur des mains' },
        { src: 'images/rose-bonbon/finition.webp', label: 'Finition', alt: 'Faux ongles {color} à la finition brillante, rangés par taille' },
        { src: 'images/rose-bonbon/set.webp', label: 'Le set', alt: 'Les 24 faux ongles {color} du kit' },
        { src: 'images/commun/guide-tailles.webp', label: 'Guide des tailles', alt: 'Guide des tailles : 24 ongles en 12 tailles avec leurs dimensions, et comment mesurer ses ongles' },
        { src: 'images/commun/guide-utilisation.webp', label: 'Mode d’emploi', alt: 'Comment poser les faux ongles RED NAILS en 6 étapes' },
      ],
      thumbImage: 0, cardImage: 1, detailImage: 0, kitImage: 3,
    },
    {
      id: 'nude-rose', name: 'Nude Rosé', hex: '#EAC7C3', variantId: 'VARIANT_NUDE_ROSE',
      desc: 'L’effet ongles parfaits, rosé et laiteux.',
      // Même présentation que le Bleu et le Rose : format 24 ongles / 12 tailles (à confirmer).
      kit: { nailsPerKit: 24, sizes: 12, perSize: 2, length: '1,90 – 2,50 cm', width: '0,70 – 1,40 cm' },
      images: [
        { src: 'images/nude-rose/main.webp', label: 'Portés', alt: 'Faux ongles {color} en forme amande posés sur des mains' },
        { src: 'images/nude-rose/macro.webp', label: 'Gros plan', alt: 'Gros plan sur la brillance laquée des faux ongles {color}' },
        { src: 'images/nude-rose/main-2.webp', label: 'Portés', alt: 'Deux mains aux faux ongles {color} en forme amande' },
        { src: 'images/nude-rose/set.webp', label: 'Le set', alt: 'Les 24 faux ongles {color} du kit' },
        { src: 'images/commun/guide-tailles.webp', label: 'Guide des tailles', alt: 'Guide des tailles : 24 ongles en 12 tailles avec leurs dimensions, et comment mesurer ses ongles' },
        { src: 'images/commun/guide-utilisation.webp', label: 'Mode d’emploi', alt: 'Comment poser les faux ongles RED NAILS en 6 étapes' },
      ],
      thumbImage: 0, cardImage: 3, detailImage: 1, kitImage: 4,
    },
    // Couleurs en attente de leurs photos (visuels provisoires).
    // "hidden: true" pour les masquer du site sans les supprimer.
    { id: 'rouge-cerise', name: 'Rouge Cerise', hex: '#C8102E', variantId: 'VARIANT_ROUGE_CERISE', desc: 'Le rouge signature, brillant comme un vernis laqué.' },
    { id: 'noir-laque', name: 'Noir Laqué', hex: '#121012', variantId: 'VARIANT_NOIR_LAQUE', desc: 'Un noir miroir, intense et graphique.' },
    { id: 'french-blanc', name: 'French Blanc', hex: '#F1D3CB', tip: '#FFFFFF', variantId: 'VARIANT_FRENCH_BLANC', desc: 'La French intemporelle, bout blanc net.' },
  ],
  DEFAULT_COLOR: 'bordeaux',

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
    items: [],
    eyebrow: 'Avis clientes',
    title: 'Elles les portent',
    verified: 'Achat vérifié',
    countLabel: '{count} avis',
    previewNotice: 'Aperçu de mise en page : exemples fictifs, jamais affichés sur le site en ligne.',
  },

  /* ---------- Pop-up promo ---------- */
  POPUP: {
    enabled: true,
    delaySeconds: 12,
    exitIntent: true,
    eyebrow: 'Bienvenue chez RED NAILS',
    title: '-10 %',
    subtitle: 'sur ta première commande',
    text: 'Utilise ce code au moment du paiement :',
    code: 'BIENVENUE10',
    copyLabel: 'Copier',
    copiedLabel: 'Copié ✓',
    cta: 'Je choisis ma teinte',
    dismiss: 'Non merci',
  },

  /* ---------- Textes de la page ---------- */
  TEXTS: {
    announce: [
      'Livraison offerte dès 2 kits',
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
      addToCart: 'Ajouter au panier',
      stickyAdd: 'Ajouter',
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
    ctaNote: 'Livraison offerte dès {freeFrom} kits · Retours {returnDays} jours',

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
      intro: 'Touche une teinte : elle s’affiche directement dans ta fiche produit.',
      choose: 'Choisir',
      selected: 'Sélectionnée',
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
      upsell: 'Ajoute 1 kit : -20 % et livraison offerte',
      upsellBtn: '+ 1 kit',
      demo: 'Mode démo : le paiement sera branché sur Shopify.',
      added: 'Ajouté au panier',
    },
  },
};
