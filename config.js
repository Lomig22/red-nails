/* ==========================================================================
   RED NAILS — CONFIGURATION
   --------------------------------------------------------------------------
   TOUT le contenu modifiable de la page est ici : prix, couleurs, textes,
   délais, FAQ, pop-up… Tu n'as pas besoin de toucher à index.html ni app.js.

   Règles simples :
   - Les prix s'écrivent avec un POINT : 24.99 (et pas 24,99).
   - Les textes s'écrivent entre guillemets simples '…'. Pour mettre une
     apostrophe dans un texte, utilise le caractère typographique ’
     (ex. : 'l’ongle') ou échappe-la : 'l\'ongle'.
   - Dans les textes, les mots entre accolades sont remplacés automatiquement :
       {price}        prix du kit seul            → 24,99 €
       {perNail}      prix par ongle du kit seul  → 0,83 €
       {minPerNail}   meilleur prix par ongle     → 0,58 €
       {nails}        nombre d'ongles par kit     → 30
       {sizes}        nombre de tailles           → 10
       {perSize}      ongles par taille           → 3
       {salonPrice}   prix d'une pose en institut → 40 €
       {posePrice}    prix d'une pose complète (10 ongles) avec RED NAILS
       {shipping}     frais de livraison 1 kit    → 3,99 €
       {freeFrom}     nb de kits pour la livraison offerte → 2
       {cutoff}       heure limite d'expédition   → 14h
       {minDays} / {maxDays}  délais de livraison en jours ouvrés
       {returnDays}   délai de rétractation       → 14
       {colorCount}   nombre de couleurs proposées
       {color}        couleur sélectionnée (boutons d'achat)
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. CONSTANTES PRINCIPALES
   -------------------------------------------------------------------------- */

// URL de paiement. Sur Shopify : https://red-nails.fr/checkout
const CHECKOUT_URL = 'https://red-nails.fr/checkout';

// Prix du kit seul (30 ongles).
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
  // Si renseigné, le bouton "Passer commande" envoie directement le contenu du
  // panier sous la forme /cart/VARIANT_ID:QTE,VARIANT_ID:QTE.
  CART_PERMALINK_BASE: null,
  // true = affiche une mention "mode démo" dans le tiroir panier.
  DEMO_MODE: true,

  PRIX_REFERENCE: PRIX_REFERENCE,

  /* ---------- Produit ---------- */
  PRODUCT: {
    title: 'Kit 30 faux ongles en gel souple',
    kicker: 'Gel souple · Forme amande · Effet laqué',
    price: PRIX_UNITAIRE,
    nailsPerKit: 30,
    sizes: 15,
    perSize: 2,
    posesPerKit: 1, // sert au calcul {posePrice} (prix d'une manucure complète)

    // ⚠️ Promesses à valider avec le fournisseur avant mise en ligne.
    promises: [
      { icon: 'clock', text: 'Pose en 10 minutes' },
      { icon: 'repeat', text: 'Réutilisable' },
      { icon: 'calendar', text: 'Tenue jusqu’à 2 semaines selon la pose' },
    ],
  },

  /* ---------- Lots (sélecteur sous forme de cartes) ----------
     Le prix barré des lots est calculé AUTOMATIQUEMENT : quantité × prix du
     kit seul réellement pratiqué (ex. 2 × 24,99 = 49,98 €). Le badge -X % est
     aussi calculé automatiquement (arrondi à l'inférieur, jamais surévalué).
     "highlight" : petite étiquette noire (laisse '' pour ne rien afficher).
     ⚠️ "Le plus choisi" doit correspondre à la réalité de tes ventes.        */
  BUNDLES: [
    { qty: 1, price: PRIX_UNITAIRE, label: '1 kit', highlight: '' },
    { qty: 2, price: 39.98, label: '2 kits', highlight: '' },
    { qty: 3, price: 52.47, label: '3 kits', highlight: 'Le plus choisi' },
  ],
  DEFAULT_BUNDLE: 0, // index du lot présélectionné (0 = 1 kit)
  // Les CTA "J'en profite – dès 0,58 € l'ongle" présélectionnent le lot le
  // moins cher à l'ongle (si la cliente n'a pas encore choisi elle-même).
  CTA_PRESELECT_BEST: true,

  /* ---------- Livraison ---------- */
  SHIPPING: {
    price: FRAIS_LIVRAISON,
    freeFromKits: 2, // livraison offerte à partir de X kits
    carrier: 'Livraison suivie',
  },

  /* ---------- Promesse de livraison avec date ---------- */
  DELIVERY: {
    timeZone: 'Europe/Paris',
    cutoffHour: 14, // heure limite d'expédition (14 = 14h00)
    cutoffMinute: 0,
    shipDays: [1, 2, 3, 4, 5], // jours d'expédition : 0 = dim, 1 = lun … 6 = sam
    deliveryDays: [1, 2, 3, 4, 5], // jours où le transporteur livre
    minDays: 2, // livraison entre J+2…
    maxDays: 4, // …et J+4 jours ouvrés après l'expédition
    // Jours fériés (aucune expédition ni livraison) — format AAAA-MM-JJ
    holidays: [
      '2026-01-01', '2026-04-06', '2026-05-01', '2026-05-08', '2026-05-14',
      '2026-05-25', '2026-07-14', '2026-08-15', '2026-11-01', '2026-11-11',
      '2026-12-25',
      '2027-01-01', '2027-03-29', '2027-05-01', '2027-05-06', '2027-05-08',
      '2027-05-17', '2027-07-14', '2027-08-15', '2027-11-01', '2027-11-11',
      '2027-12-25',
    ],
  },

  RETURN_DAYS: 14,

  /* ---------- Couleurs ----------
     id        : identifiant, sert aussi de nom de dossier dans /images/[id]/
                 et de paramètre d'URL (?couleur=bordeaux) pour tes pubs.
     hex       : teinte de la pastille.
     tip       : (optionnel) couleur du bout, pour la French.
     variantId : ID de la variante Shopify (à remplacer).
     images    : (optionnel) vraies photos de la couleur, dans l'ordre de la
                 galerie (voir Bordeaux ci-dessous et le README).
     L'ORDRE DE LA LISTE = l'ordre des pastilles et des cartes couleur.      */
  COLORS: [
    {
      id: 'bordeaux', name: 'Bordeaux', hex: '#6E0F1C', variantId: 'VARIANT_BORDEAUX', desc: 'Profond et élégant, pour le soir comme pour le bureau.',
      // Vraies photos : l'ordre de la liste = l'ordre de la galerie.
      images: [
        { src: 'images/bordeaux/main.webp', label: 'Sur la main', alt: 'Faux ongles {color} en forme amande posés sur des mains' },
        { src: 'images/bordeaux/set.webp', label: 'Le set', alt: 'Les 30 faux ongles {color} du kit' },
        { src: 'images/bordeaux/finition.webp', label: 'Finition', alt: 'Faux ongles {color} à la finition brillante, rangés par taille' },
        { src: 'images/bordeaux/contenu-kit.webp', label: 'Contenu du kit', alt: 'Contenu du kit : 15 tailles d’ongles avec leurs dimensions, lime à ongles et pastilles adhésives' },
        { src: 'images/bordeaux/quotidien.webp', label: 'Au quotidien', alt: 'Ongles rouges au quotidien : taper au clavier, jardiner, faire la vaisselle, jouer avec son chien' },
      ],
      thumbImage: 0, // photo utilisée pour la vignette (cartes couleur, barre collante, panier)
      kitImage: 3, // photo utilisée dans la section "Ce que contient ton kit"
    },
    {
      id: 'bleu-nuit', name: 'Bleu Nuit', hex: '#1B2A5E', variantId: 'VARIANT_BLEU_NUIT', desc: 'Un bleu marine profond, chic et inattendu.',
      images: [
        { src: 'images/bleu-nuit/main.webp', label: 'Sur la main', alt: 'Faux ongles {color} en forme amande posés sur une main' },
        { src: 'images/bleu-nuit/main-2.webp', label: 'Brillance', alt: 'Gros plan sur les faux ongles {color} et leur reflet laqué' },
        { src: 'images/bleu-nuit/main-3.webp', label: 'Sur la main', alt: 'Mains aux faux ongles {color} en forme amande' },
        { src: 'images/bleu-nuit/main-4.webp', label: 'Sur la main', alt: 'Faux ongles {color} posés sur deux mains' },
        { src: 'images/bleu-nuit/finition.webp', label: 'Finition', alt: 'Faux ongles {color} en gel souple, finition brillante' },
        // Infographie commune à toutes les couleurs (tailles, lime, pastilles)
        { src: 'images/bordeaux/contenu-kit.webp', label: 'Contenu du kit', alt: 'Contenu du kit : 15 tailles d’ongles avec leurs dimensions, lime à ongles et pastilles adhésives' },
      ],
      thumbImage: 0,
      kitImage: 5,
    },
    { id: 'rouge-cerise', name: 'Rouge Cerise', hex: '#C8102E', variantId: 'VARIANT_ROUGE_CERISE', desc: 'Le rouge signature, brillant comme un vernis laqué.' },
    { id: 'nude-rose', name: 'Nude Rosé', hex: '#D8A496', variantId: 'VARIANT_NUDE_ROSE', desc: 'L’effet ongles naturels parfaits, en plus brillant.' },
    { id: 'noir-laque', name: 'Noir Laqué', hex: '#121012', variantId: 'VARIANT_NOIR_LAQUE', desc: 'Un noir miroir, intense et graphique.' },
    { id: 'french-blanc', name: 'French Blanc', hex: '#F1D3CB', tip: '#FFFFFF', variantId: 'VARIANT_FRENCH_BLANC', desc: 'La French intemporelle, bout blanc net.' },
    { id: 'rose-bonbon', name: 'Rose Bonbon', hex: '#EE5D92', variantId: 'VARIANT_ROSE_BONBON', desc: 'Un rose acidulé, joyeux et pop.' },
  ],
  // Couleur affichée à l'arrivée : celle qui a de vraies photos.
  // (si tu la changes, mets aussi à jour la 1re image et le preload dans index.html)
  DEFAULT_COLOR: 'bordeaux',

  /* ---------- Galerie (5 vues par couleur) ----------
     Les images sont cherchées dans /images/[id-couleur]/[file].[IMAGE_EXT].
     Pour mettre tes photos : dépose par ex. images/bordeaux/1-set.webp
     (même nom de fichier) et passe IMAGE_EXT à 'webp'. {color} = nom couleur. */
  IMAGE_EXT: 'svg',
  GALLERY_VIEWS: [
    { file: '1-set', label: 'Le set', alt: 'Set de 30 faux ongles {color} en gel souple' },
    { file: '2-main', label: 'Sur la main', alt: 'Faux ongles {color} posés sur une main' },
    { file: '3-finition', label: 'Finition', alt: 'Gros plan sur la finition laquée d’un ongle {color}' },
    { file: '4-tailles', label: 'Les tailles', alt: 'Les {sizes} tailles de faux ongles {color}' },
    { file: '5-kit', label: 'Le kit', alt: 'Kit complet RED NAILS {color} avec ses accessoires' },
  ],

  /* ---------- Comparaison institut ---------- */
  COMPARISON: {
    salonPrice: 40, // "Une pose en institut : 40 € et plus"
  },

  /* ---------- Avis clients ----------
     Section prévue mais vide : aucun avis n'est inventé.
     Passe visible à true une fois le module Judge.me / Loox branché
     (voir le commentaire dans index.html, section #avis).                    */
  REVIEWS: {
    visible: false,
    title: 'Elles ont testé',
  },

  /* ---------- Pop-up promo ---------- */
  POPUP: {
    enabled: true,
    delaySeconds: 12,
    exitIntent: true, // desktop : souris qui sort par le haut de la fenêtre
    eyebrow: 'Bienvenue chez RED NAILS',
    title: '-10 % sur ta première commande',
    text: 'Utilise ce code au moment du paiement :',
    code: 'BIENVENUE10',
    copyLabel: 'Copier le code',
    copiedLabel: 'Code copié !',
    cta: 'Je choisis mon lot',
    dismiss: 'Non merci',
  },

  /* ---------- Textes de la page ---------- */
  TEXTS: {
    announce: [
      'Livraison offerte dès 2 kits',
      '-30 % sur le lot de 3',
      'Paiement sécurisé',
      'Satisfaite ou remboursée 14 jours',
    ],

    product: {
      perNailPrefix: 'soit',
      perNailSuffix: 'l’ongle',
      salonLine: 'Une pose en institut : {salonPrice} et plus. Chez nous : {perNail} l’ongle.',
      colorLegend: 'Couleur :',
      bundleLegend: 'Choisis ton lot',
      perNailShort: '{value}/ongle',
      nailsCount: '{count} ongles',
      freeShipping: 'Livraison offerte',
      shippingPaid: 'Livraison suivie : {shipping} · offerte dès {freeFrom} kits',
      shippingFree: 'Livraison suivie offerte sur ce lot',
      addToCart: 'Ajouter au panier – {color}',
      stickyAdd: 'Ajouter',
      galleryHintHover: 'Survole pour zoomer',
      galleryHintTouch: 'Touche pour zoomer',
    },

    delivery: {
      countdown: 'Commande dans {time} → expédiée {shipLabel}',
      noCountdown: 'Commande maintenant → expédiée {shipLabel}',
      range: 'Livrée entre le {from} et le {to}',
      today: 'aujourd’hui',
      tomorrow: 'demain',
      steps: ['Commandé', 'Expédié', 'Livré'],
    },

    reassurance: [
      { icon: 'lock', title: 'Paiement sécurisé', text: 'Données chiffrées' },
      { icon: 'return', title: 'Retours 14 jours', text: 'Droit de rétractation' },
      { icon: 'truck', title: 'Livraison suivie', text: 'Numéro de suivi par e-mail' },
    ],

    cta: 'J’en profite – dès {minPerNail} l’ongle',
    ctaNote: 'Livraison offerte dès {freeFrom} kits · Retours {returnDays} jours',

    compare: {
      eyebrow: 'Fais le calcul',
      title: 'Le calcul est vite fait',
      salonLabel: 'En institut',
      salonValue: '{salonPrice}',
      salonUnit: 'et plus, la pose',
      ourLabel: 'RED NAILS',
      ourUnit: 'l’ongle',
      line: 'Une pose en institut : {salonPrice} et plus. Chez nous : {perNail} l’ongle.',
      barsTitle: 'Prix d’une manucure complète',
      barSalon: 'Institut',
      barOurs: 'RED NAILS',
      footnote: 'Le kit entier ({nails} ongles) coûte moins cher qu’une seule pose en institut, et il est réutilisable.',
    },

    steps: {
      eyebrow: 'Simple comme bonjour',
      title: 'Comment ça marche',
      items: [
        { title: 'Choisis ta taille', text: 'Parmi les {sizes} tailles, trouve celle de chaque doigt : l’ongle doit couvrir le tien d’un bord à l’autre.' },
        { title: 'Pose la pastille', text: 'Colle une pastille adhésive sur ton ongle, retire le film, pose le faux ongle et presse 30 secondes.' },
        { title: 'C’est fini, 10 min', text: 'Une manucure brillante en 10 minutes, sans lampe UV ni rendez-vous.' },
      ],
    },

    colors: {
      eyebrow: '{colorCount} teintes laquées',
      title: 'Choisis ta couleur',
      intro: 'Touche une couleur : elle s’affiche directement dans ta fiche produit.',
      choose: 'Choisir',
      selected: 'Sélectionnée',
    },

    // ⚠️ Contenu du kit à valider avec le fournisseur.
    kit: {
      eyebrow: 'Tout est inclus',
      title: 'Ce que contient ton kit',
      items: [
        '30 faux ongles en gel souple, forme amande',
        '{sizes} tailles, {perSize} ongles de chaque',
        '1 planche de pastilles adhésives',
        '1 lime à ongles',
      ],
    },

    faq: {
      eyebrow: 'Tu te poses la question ?',
      title: 'Questions fréquentes',
      items: [
        {
          q: 'Combien de temps ça tient ?',
          a: 'Jusqu’à 2 semaines selon la pose. Pour une tenue maximale : ongles propres et bien secs, bonne taille pour chaque doigt, pastille bien pressée, et pas d’eau chaude pendant l’heure qui suit la pose.',
        },
        {
          q: 'Comment je choisis ma taille ?',
          a: 'Le kit contient {sizes} tailles, {perSize} ongles de chaque. Présente chaque faux ongle sur ton ongle naturel avant de poser la pastille : il doit le couvrir d’un bord à l’autre sans toucher la peau. Entre deux tailles, prends la plus grande et lime légèrement les côtés.',
        },
        {
          q: 'Comment je les retire sans abîmer mes ongles ?',
          a: 'Plonge tes doigts quelques minutes dans de l’eau tiède savonneuse, puis soulève doucement le côté du faux ongle. Ne force jamais et n’arrache pas : la pastille adhésive se décolle sans abîmer ton ongle naturel.',
        },
        {
          q: 'Ils sont réutilisables ?',
          a: 'Oui. Retire-les délicatement, enlève les restes de pastille, laisse sécher et range-les dans leur boîte. Tu pourras les reposer avec de nouvelles pastilles adhésives.',
        },
        {
          q: 'Quand vais-je recevoir ma commande ?',
          a: 'Les commandes passées avant {cutoff} un jour ouvré partent le jour même, les autres le jour ouvré suivant. La livraison suivie prend ensuite {minDays} à {maxDays} jours ouvrés. La date estimée s’affiche juste sous le bouton d’achat.',
        },
        {
          // ⚠️ À aligner avec tes CGV (conditions de retour, frais de retour, hygiène).
          q: 'Et si ça ne me plaît pas ?',
          a: 'Tu disposes de {returnDays} jours après réception pour exercer ton droit de rétractation, sans avoir à te justifier. Écris-nous depuis la page Contact : on t’indique la marche à suivre et on te rembourse au plus tard {returnDays} jours après ta demande.',
        },
        {
          q: 'Le paiement est-il sécurisé ?',
          a: 'Oui. Le paiement est chiffré et traité par un prestataire de paiement certifié. Nous n’avons jamais accès à tes coordonnées bancaires.',
        },
      ],
    },

    final: {
      title: 'Tes ongles d’institut, sans le prix d’institut.',
      text: '{nails} ongles en gel souple, pose en 10 minutes, dès {minPerNail} l’ongle.',
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
