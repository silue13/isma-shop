"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

type Produit = {
  id: number;
  nom: string;
  description: string | null;
  prix: number;
  prix_barre: number | null;
  stock: number | null;
  photos: string[];
  pointures: string[];
  couleurs: string[];
};

type LignePanier = {
  cle: string;
  nom: string;
  prix: number;
  pointure: string;
  couleur: string;
  qte: number;
};

type Profil = { nom: string; telephone: string; lieu: string | null };

type Avis = { product_id: number; etoiles: number };

function fcfa(n: number) {
  return `${n.toLocaleString("fr-FR")} FCFA`;
}

function Etoiles({ note }: { note: number }) {
  return (
    <span aria-label={`${note} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={n <= Math.round(note) ? "text-or" : "text-gray-300"}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export default function Home() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [chargement, setChargement] = useState(true);
  const [bandeau, setBandeau] = useState("");
  const [avis, setAvis] = useState<Avis[]>([]);

  const [panier, setPanier] = useState<LignePanier[]>([]);
  const [panierCharge, setPanierCharge] = useState(false);
  const [panierOuvert, setPanierOuvert] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [profil, setProfil] = useState<Profil | null>(null);
  const [nomLivraison, setNomLivraison] = useState("");
  const [lieuLivraison, setLieuLivraison] = useState("");
  const [erreurCommande, setErreurCommande] = useState("");
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("actif", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProduits((data as Produit[]) || []);
        setChargement(false);
      });

    supabase
      .from("reviews")
      .select("product_id, etoiles")
      .then(({ data }) => setAvis((data as Avis[]) || []));

    supabase
      .from("reglages")
      .select("valeur")
      .eq("cle", "bandeau")
      .maybeSingle()
      .then(({ data }) => setBandeau(data?.valeur || ""));

    // Ouvrir le panier si on arrive depuis la page produit
    if (new URLSearchParams(window.location.search).get("panier") === "1") {
      setPanierOuvert(true);
    }
  }, []);

  useEffect(() => {
    try {
      const sauvegarde = localStorage.getItem("panier");
      if (sauvegarde) setPanier(JSON.parse(sauvegarde));
    } catch {}
    setPanierCharge(true);
  }, []);

  useEffect(() => {
    if (panierCharge) {
      localStorage.setItem("panier", JSON.stringify(panier));
    }
  }, [panier, panierCharge]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
    });
    const { data: abonnement } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserId(session?.user.id ?? null);
      }
    );
    return () => abonnement.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setProfil(null);
      return;
    }
    supabase
      .from("clients")
      .select("nom, telephone, lieu")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        const p = data as Profil | null;
        setProfil(p);
        if (p) {
          setNomLivraison(p.nom);
          setLieuLivraison(p.lieu || "");
        }
      });
  }, [userId]);

  function statsProduit(id: number) {
    const liste = avis.filter((a) => a.product_id === id);
    const nb = liste.length;
    const moyenne = nb ? liste.reduce((s, a) => s + a.etoiles, 0) / nb : 0;
    return { nb, moyenne };
  }

  function changerQte(cle: string, delta: number) {
    setPanier((prev) =>
      prev
        .map((l) => (l.cle === cle ? { ...l, qte: l.qte + delta } : l))
        .filter((l) => l.qte > 0)
    );
  }

  const total = panier.reduce((s, l) => s + l.prix * l.qte, 0);
  const nbArticles = panier.reduce((s, l) => s + l.qte, 0);

  async function commander() {
    setErreurCommande("");
    if (!userId || !profil) return;

    if (!nomLivraison.trim() || !lieuLivraison.trim()) {
      setErreurCommande("Indique ton nom et ton lieu de livraison.");
      return;
    }
    const numero = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    if (!numero) {
      setErreurCommande("Le numéro WhatsApp du vendeur n'est pas configuré.");
      return;
    }

    setEnCours(true);

    const articles = panier.map((l) => ({
      produit_id: Number(l.cle.split("-")[0]),
      nom: l.nom,
      prix: l.prix,
      pointure: l.pointure,
      couleur: l.couleur,
      qte: l.qte,
    }));

    const { data, error } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        nom: nomLivraison.trim(),
        telephone: profil.telephone,
        lieu: lieuLivraison.trim(),
        articles,
        total,
      })
      .select("id")
      .single();

    if (error || !data) {
      setErreurCommande(
        "Impossible d'enregistrer la commande : " + (error?.message || "")
      );
      setEnCours(false);
      return;
    }

    const lignes = panier.map((l, i) => {
      const details = [
        `*${i + 1}. ${l.nom}*`,
        l.pointure ? `   Pointure : ${l.pointure}` : "",
        l.couleur ? `   Couleur : ${l.couleur}` : "",
        `   Quantité : ${l.qte} x ${l.prix} FCFA = *${l.prix * l.qte} FCFA*`,
      ];
      return details.filter(Boolean).join("\n");
    });

    const message =
      `🛍️ *COMMANDE N°${data.id} - ISMA'STORE*\n\n` +
      `👤 *Client* : ${nomLivraison.trim()}\n` +
      `📞 *Téléphone* : ${profil.telephone}\n` +
      `📍 *Livraison* : ${lieuLivraison.trim()}\n\n` +
      `${lignes.join("\n\n")}\n\n` +
      `━━━━━━━━━━━━\n` +
      `💰 *TOTAL : ${total} FCFA*\n` +
      `━━━━━━━━━━━━\n\n` +
      `Merci de me confirmer la disponibilité, le prix de la livraison et le mode de paiement. 🙏`;

    localStorage.removeItem("panier");
    setPanier([]);
    setEnCours(false);
    window.location.href = `https://wa.me/${numero}?text=${encodeURIComponent(
      message
    )}`;
  }

  const champLivraison =
    "border border-or/40 rounded-lg w-full p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-or";

  return (
    <div className="min-h-screen bg-creme text-noir">
      {/* Bannière promo */}
      {bandeau && (
        <div className="bg-or text-noir text-center text-sm font-semibold py-2 px-3">
          {bandeau}
        </div>
      )}

      {/* En-tête */}
      <header className="sticky top-0 z-40 bg-noir text-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-xl font-bold tracking-widest text-or">
              ISMA&apos;STORE
            </p>
            <p className="text-xs text-white/60">
              Sneakers · Tendance · Premium
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/compte"
              className="text-sm bg-white/10 hover:bg-white/20 rounded-full px-3 py-2"
            >
              {userId ? "Mon compte" : "Connexion"}
            </a>
            <button
              onClick={() => setPanierOuvert(true)}
              className="bg-or hover:bg-or-fonce text-noir font-semibold rounded-full px-4 py-2"
            >
              Panier ({nbArticles})
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4">
        <img
          src="/logo.jpeg"
          alt="Isma'Store - Sneakers tendance premium"
          className="w-full max-w-sm mx-auto mix-blend-multiply"
        />

        <div className="bg-noir text-or text-center text-sm font-semibold tracking-widest rounded-lg py-2 px-3 max-w-md mx-auto my-4">
          À DES PRIX IMBATTABLES
        </div>

        <h2 className="text-2xl font-bold mt-8 mb-4">Nos produits</h2>

        {chargement && <p className="text-brun">Chargement...</p>}
        {!chargement && produits.length === 0 && (
          <p className="text-brun">Aucun produit pour le moment.</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {produits.map((p) => {
            const s = statsProduit(p.id);
            const enPromo = !!p.prix_barre && p.prix_barre > p.prix;
            const epuise = p.stock != null && p.stock <= 0;
            return (
              <a
                key={p.id}
                href={`/produit?id=${p.id}`}
                className="bg-white rounded-2xl shadow border border-or/30 overflow-hidden flex flex-col"
              >
                <div className="relative">
                  {p.photos?.[0] ? (
                    <img
                      src={p.photos[0]}
                      alt={p.nom}
                      className="w-full h-44 md:h-56 object-cover"
                    />
                  ) : (
                    <div className="w-full h-44 md:h-56 bg-creme" />
                  )}
                  {enPromo && (
                    <span className="absolute top-2 left-2 bg-noir text-or text-xs font-semibold rounded-full px-2.5 py-1">
                      Promotion
                    </span>
                  )}
                  {epuise && (
                    <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-semibold rounded-full px-2.5 py-1">
                      Épuisé
                    </span>
                  )}
                </div>

                <div className="p-3">
                  <h3 className="font-semibold">{p.nom}</h3>
                  <p>
                    {enPromo && (
                      <span className="text-brun line-through text-sm mr-2">
                        {fcfa(p.prix_barre as number)}
                      </span>
                    )}
                    <span className="font-bold text-or-fonce text-lg">
                      {fcfa(p.prix)}
                    </span>
                  </p>
                  {s.nb > 0 && (
                    <p className="text-sm mt-1">
                      <Etoiles note={s.moyenne} />{" "}
                      <span className="font-semibold">
                        {s.moyenne.toFixed(1).replace(".", ",")}
                      </span>{" "}
                      <span className="text-brun">({s.nb})</span>
                    </p>
                  )}
                </div>
              </a>
            );
          })}
        </div>

        <footer className="mt-12 mb-6 text-center text-sm text-brun">
          <p className="font-semibold tracking-wide">
            Qualité · Style · Confiance · Exclusivité
          </p>
          <p className="mt-1">Livraison rapide · Authenticité garantie</p>
        </footer>
      </main>

      {/* Panier */}
      {panierOuvert && (
        <div className="fixed inset-0 bg-black/60 flex justify-end z-50">
          <div className="bg-creme w-full max-w-md h-full p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Mon panier</h2>
              <button
                onClick={() => setPanierOuvert(false)}
                className="text-3xl leading-none"
              >
                ×
              </button>
            </div>

            {panier.length === 0 && (
              <p className="text-brun">Ton panier est vide.</p>
            )}

            {panier.map((l) => (
              <div
                key={l.cle}
                className="bg-white rounded-xl p-3 mb-3 border border-or/30"
              >
                <p className="font-semibold">{l.nom}</p>
                <p className="text-sm text-brun">
                  {l.pointure && `Pointure ${l.pointure}`}
                  {l.pointure && l.couleur && " · "}
                  {l.couleur}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => changerQte(l.cle, -1)}
                      className="bg-noir text-or rounded px-3"
                    >
                      −
                    </button>
                    <span className="font-semibold">{l.qte}</span>
                    <button
                      onClick={() => changerQte(l.cle, 1)}
                      className="bg-noir text-or rounded px-3"
                    >
                      +
                    </button>
                  </div>
                  <p className="font-bold text-or-fonce">
                    {fcfa(l.prix * l.qte)}
                  </p>
                </div>
              </div>
            ))}

            {panier.length > 0 && (
              <>
                <p className="text-xl font-bold mt-4">
                  Total : {fcfa(total)}
                </p>

                {!userId && (
                  <div className="bg-white rounded-xl border border-or/30 p-4 mt-4">
                    <p className="text-sm text-brun mb-3">
                      Pour commander, crée ton compte ou connecte-toi. Ton
                      panier sera gardé.
                    </p>
                    <a
                      href="/compte?retour=panier"
                      className="block text-center bg-or hover:bg-or-fonce text-noir font-semibold rounded-lg py-3"
                    >
                      Se connecter / S&apos;inscrire
                    </a>
                  </div>
                )}

                {userId && !profil && (
                  <p className="text-sm text-brun mt-4">
                    Ce compte n&apos;a pas de profil client. Déconnecte-toi puis
                    inscris-toi avec ton numéro sur la page « Connexion ».
                  </p>
                )}

                {userId && profil && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-brun mb-1">
                      Nom pour la livraison
                    </label>
                    <input
                      value={nomLivraison}
                      onChange={(e) => setNomLivraison(e.target.value)}
                      className={champLivraison + " mb-3"}
                    />

                    <label className="block text-sm font-medium text-brun mb-1">
                      Lieu de livraison (quartier, ville)
                    </label>
                    <input
                      value={lieuLivraison}
                      onChange={(e) => setLieuLivraison(e.target.value)}
                      className={champLivraison}
                    />

                    {erreurCommande && (
                      <p className="bg-red-50 text-red-700 rounded-lg p-2 mt-3 text-sm">
                        {erreurCommande}
                      </p>
                    )}

                    <button
                      onClick={commander}
                      disabled={enCours}
                      className="bg-green-600 hover:bg-green-700 text-white rounded-lg w-full mt-4 py-3 font-semibold disabled:opacity-50"
                    >
                      {enCours ? "Patiente..." : "Commander sur WhatsApp"}
                    </button>
                    <p className="text-xs text-brun text-center mt-2">
                      WhatsApp s&apos;ouvre avec ta commande : appuie sur
                      Envoyer.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}