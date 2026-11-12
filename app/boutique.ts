// Réglages de la boutique : modifie ce fichier pour changer les textes affichés partout.
export const BOUTIQUE = {
  nom: "Isma'Store", // nom affiché sur le site
  raisonSociale: "Isma'Shop", // nom de l'entreprise (pages légales)
  adresse: "Grand-Bassam, Côte d'Ivoire",
  snapchat: "https://www.snapchat.com/add/TON_PSEUDO", // remplace TON_PSEUDO par ton vrai pseudo ; mets "" pour masquer Snapchat
  // Optionnels : ils s'affichent dans les mentions légales seulement s'ils sont remplis.
  responsable: "", // nom du responsable de la publication
  registre: "", // numéro RCCM / identifiant d'entreprise
  email: "",
  hebergeur: "", // ex. nom et site de ton hébergeur
  // Garde seulement les moyens de paiement que tu acceptes vraiment.
  paiements: ["Wave", "Orange Money", "MTN MoMo", "Espèces à la livraison"],
  paiementEn3Fois: true,
  nbVersements: 3,
  // Une offre doit valoir au moins ce pourcentage du prix affiché.
  offreMinPourcent: 50,
  // Un produit affiche « NEW » pendant ce nombre de jours après son ajout.
  nouveauJours: 14,
  // Montants proposés sur la page Cartes cadeaux (en FCFA).
  montantsCartes: [5000, 10000, 20000, 50000],
  // Texte de la page « Paiement en 3 fois » : adapte-le à tes vraies conditions.
  conditions3x: [
    "Demande le paiement en 3 fois au moment de la confirmation sur WhatsApp.",
    "Le prix de la commande est divisé en 3 versements.",
    "Le montant du premier versement et les dates des suivants sont convenus avec le vendeur avant l'envoi.",
  ],
  retours:
    "Les conditions d'échange et de retour sont précisées par le vendeur avant la validation de la commande.",
};

export function estNouveau(date?: string | null) {
  if (!date) return false;
  const t = new Date(date).getTime();
  return !isNaN(t) && Date.now() - t < BOUTIQUE.nouveauJours * 86400000;
}

// Catégories reconnues par des mots dans le nom du produit (sans accent ni majuscule).
// Ajoute ou retire des mots selon tes produits.
export const CATEGORIES = [
  { id: "crocs", nom: "Crocs", mots: ["crocs"] },
  { id: "sandales", nom: "Sandales", mots: ["sandale", "claquette", "slide"] },
  { id: "maillots", nom: "Maillots", mots: ["maillot"] },
  {
    id: "vetements",
    nom: "Vêtements",
    mots: ["t-shirt", "tshirt", "short", "jogging", "veste", "pull", "survêtement"],
  },
  {
    id: "accessoires",
    nom: "Accessoires",
    mots: ["casquette", "sac ", "chaussette", "ceinture", "lacet"],
  },
];

// « Nouveau », « Promos » et « Baskets » sont calculés automatiquement.
export const LISTE_CATEGORIES = [
  { id: "nouveau", nom: "Nouveau" },
  { id: "promos", nom: "Promos" },
  { id: "baskets", nom: "Baskets" },
  ...CATEGORIES.map(({ id, nom }) => ({ id, nom })),
];

type ProduitCategorie = {
  nom: string;
  categorie?: string | null;
  prix: number;
  prix_barre: number | null;
  created_at?: string | null;
};

// Catégories que l'admin peut choisir pour un produit.
export const CATEGORIES_ADMIN = ["Baskets", ...CATEGORIES.map((c) => c.nom)];

const CATEGORIES_DE_BASE = [{ id: "baskets", nom: "Baskets" }, ...CATEGORIES];

// Compare sans accent, sans majuscule et sans « s » final (Crocs = crocs = Croc).
export function normCategorie(v: string) {
  return v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/s$/, "");
}

// Renvoie le nom exact de la liste si la valeur enregistrée y correspond.
export function categorieCanonique(v?: string | null) {
  if (!v || !v.trim()) return "";
  const n = normCategorie(v);
  return CATEGORIES_ADMIN.find((c) => normCategorie(c) === n) || v.trim();
}

export function dansCategorie(id: string, p: ProduitCategorie) {
  const nom = p.nom.toLowerCase();
  if (id === "nouveau") return estNouveau(p.created_at);
  if (id === "promos") return !!p.prix_barre && p.prix_barre > p.prix;
  // Catégorie choisie dans l'admin : elle passe avant la détection par le nom.
  if (p.categorie && p.categorie.trim()) {
    const n = normCategorie(p.categorie);
    const choisie = CATEGORIES_DE_BASE.find(
      (c) => normCategorie(c.id) === n || normCategorie(c.nom) === n
    );
    if (choisie) return choisie.id === id;
  }
  if (id === "baskets")
    return !CATEGORIES.some((c) => c.mots.some((m) => nom.includes(m)));
  const c = CATEGORIES.find((c) => c.id === id);
  return !!c && c.mots.some((m) => nom.includes(m));
}

export function prixEn3Fois(prix: number) {
  return Math.ceil(prix / BOUTIQUE.nbVersements);
}
export function slugifier(t: string) {
  return t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
export const lienProduit = (p: { id: number; nom: string }) =>
  `/produit/${p.id}-${slugifier(p.nom)}`;
export const idDepuisSlug = (s: string) => parseInt(s, 10) || 0;