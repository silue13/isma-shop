"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "./supabase";
import BoutonInstaller from "./BoutonInstaller";
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

type Marque = { id: number; nom: string; image_url: string | null };

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
  const [marques, setMarques] = useState<Marque[]>([]);

  const [panier, setPanier] = useState<LignePanier[]>([]);
  const [panierCharge, setPanierCharge] = useState(false);
  const [panierOuvert, setPanierOuvert] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [profil, setProfil] = useState<Profil | null>(null);
  const [nomLivraison, setNomLivraison] = useState("");
  const [lieuLivraison, setLieuLivraison] = useState("");
  const [erreurCommande, setErreurCommande] = useState("");
  const [enCours, setEnCours] = useState(false);

  // Menu, recherche, filtre par marque, newsletter
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [rechercheOuverte, setRechercheOuverte] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [marque, setMarque] = useState("");
  const [emailNews, setEmailNews] = useState("");
  const [messageNews, setMessageNews] = useState("");
  const [enCoursNews, setEnCoursNews] = useState(false);

  useEffect(() => {
    supabase
      .from("products")
      .select("id, nom, prix, prix_barre, stock, photos, pointures, couleurs")
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
      .from("marques")
      .select("id, nom, image_url")
      .eq("actif", true)
      .order("ordre")
      .order("nom")
      .then(({ data }) => setMarques((data as Marque[]) || []));

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

  function allerAuxProduits() {
    setTimeout(() => {
      document
        .getElementById("produits")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }

  function choisirMarque(m: string) {
    setMarque(m);
    setRecherche("");
    setRechercheOuverte(false);
    allerAuxProduits();
  }

  async function inscrireNewsletter(e: React.FormEvent) {
    e.preventDefault();
    setMessageNews("");
    const email = emailNews.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setMessageNews("Entre une adresse e-mail valide.");
      return;
    }
    setEnCoursNews(true);
    const { error } = await supabase.from("newsletter").insert({ email });
    setEnCoursNews(false);
    if (error) {
      setMessageNews(
        error.code === "23505"
          ? "Tu es déjà inscrit(e). Merci !"
          : "Inscription impossible pour le moment."
      );
      return;
    }
    setEmailNews("");
    setMessageNews("Merci, tu es inscrit(e) ! 🎉");
  }

  const total = panier.reduce((s, l) => s + l.prix * l.qte, 0);
  const nbArticles = panier.reduce((s, l) => s + l.qte, 0);

  const motRecherche = recherche.trim().toLowerCase();
  const marqueMin = marque.toLowerCase();
  const produitsAffiches = produits.filter((p) => {
    const nom = p.nom.toLowerCase();
    return (
      (!marqueMin || nom.includes(marqueMin)) &&
      (!motRecherche || nom.includes(motRecherche))
    );
  });
  const filtreActif = !!marque || !!motRecherche;

  const numeroWhatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

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
        <div className="bg-noir text-white italic text-center text-sm font-bold py-2 px-3">
          {bandeau}
        </div>
      )}

      {/* En-tête */}
      <header className="sticky top-0 z-40 bg-white border-b border-black/10">
        <div className="max-w-5xl mx-auto px-4 py-3 grid grid-cols-3 items-center">
          {/* Menu hamburger */}
          <button
            onClick={() => setMenuOuvert(true)}
            className="justify-self-start"
            aria-label="Menu"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>

          {/* Logo dans un cercle */}
          <a href="/" className="justify-self-center" aria-label="Accueil">
            <img
              src="/logo-isma.jpeg"
              alt="Isma'Store"
              className="w-14 h-14 rounded-full object-cover border border-black/10"
            />
          </a>

          {/* Recherche + panier */}
          <div className="justify-self-end flex items-center gap-4">
            <button
              onClick={() => setRechercheOuverte((v) => !v)}
              aria-label="Rechercher"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-4-4" />
              </svg>
            </button>
            <button
              onClick={() => setPanierOuvert(true)}
              className="relative"
              aria-label="Panier"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M6 8h12l1 12H5L6 8zM9 8a3 3 0 016 0" />
              </svg>
              <span className="absolute -top-1 -right-2 bg-noir text-white text-xs rounded-full px-1.5">
                {nbArticles}
              </span>
            </button>
          </div>
        </div>

        {rechercheOuverte && (
          <div className="max-w-5xl mx-auto px-4 pb-3">
            <input
              autoFocus
              value={recherche}
              onChange={(e) => {
                setRecherche(e.target.value);
                allerAuxProduits();
              }}
              placeholder="Rechercher une paire..."
              className="border border-black/20 bg-white rounded-full w-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-or"
            />
          </div>
        )}
      </header>

      {/* Menu latéral */}
      {menuOuvert && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex"
          onClick={() => setMenuOuvert(false)}
        >
          <nav
            className="bg-white w-72 max-w-[80%] h-full p-5 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-bold tracking-widest">
                ISMA&apos;STORE
              </span>
              <button
                onClick={() => setMenuOuvert(false)}
                className="text-3xl leading-none"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>
            <ul className="space-y-4 text-lg">
              <li>
                <a href="/" onClick={() => setMenuOuvert(false)}>
                  Accueil
                </a>
              </li>
              <li>
                <a
                  href="#produits"
                  onClick={() => {
                    setMarque("");
                    setMenuOuvert(false);
                  }}
                >
                  Nos produits
                </a>
              </li>
              {marques.length > 0 && (
                <li>
                  <a href="#marques" onClick={() => setMenuOuvert(false)}>
                    Marques
                  </a>
                </li>
              )}
              <li>
                <a href="/compte" onClick={() => setMenuOuvert(false)}>
                  {userId ? "Mon compte" : "Connexion"}
                </a>
              </li>
              {numeroWhatsapp && (
                <li>
                  <a
                    href={`https://wa.me/${numeroWhatsapp}`}
                    onClick={() => setMenuOuvert(false)}
                  >
                    Nous contacter
                  </a>
                </li>
              )}
            </ul>
          </nav>
        </div>
      )}

      {/* Bannière */}
      <section>
        <img
          src="/logo.jpeg"
          alt="Isma'Store - Sneakers tendance premium"
          className="w-full max-h-80 object-cover"
        />
        <div className="bg-[#252a35] text-white text-center py-8 px-4">
          <h1 className="text-2xl font-bold italic">
            Découvre les meilleures baskets du moment
          </h1>
          <p className="text-white/70 mt-3 tracking-wide">ISMA&apos;STORE</p>
          <a
            href="#produits"
            onClick={() => setMarque("")}
            className="inline-block bg-white text-noir rounded-full px-8 py-3 mt-5"
          >
            Acheter
          </a>
          {marques.length > 0 && (
            <a
              href="#marques"
              className="block mt-5 text-sm font-bold italic underline"
            >
              {"--->>> Voir toutes les marques ---<<<"}
            </a>
          )}
          <div className="mt-4">
            <BoutonInstaller />
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto p-4">
        <h2 id="produits" className="text-2xl font-bold mt-8 mb-4">
          Nos produits
        </h2>

        {filtreActif && (
          <div className="flex flex-wrap items-center gap-2 mb-4 text-sm">
            {marque && (
              <span className="bg-noir text-white rounded-full px-3 py-1">
                Marque : {marque}
              </span>
            )}
            {motRecherche && (
              <span className="bg-noir text-white rounded-full px-3 py-1">
                « {recherche.trim()} »
              </span>
            )}
            <button
              onClick={() => {
                setMarque("");
                setRecherche("");
              }}
              className="underline"
            >
              Tout afficher
            </button>
          </div>
        )}

        {chargement && <p className="text-brun">Chargement...</p>}
        {!chargement && produitsAffiches.length === 0 && (
          <p className="text-brun">
            {filtreActif
              ? "Aucun produit trouvé."
              : "Aucun produit pour le moment."}
          </p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {produitsAffiches.map((p) => {
            const s = statsProduit(p.id);
            const enPromo = !!p.prix_barre && p.prix_barre > p.prix;
            const epuise = p.stock != null && p.stock <= 0;
            return (
              <Link
                key={p.id}
                href={`/produit?id=${p.id}`}
                prefetch
                className="flex flex-col bg-white rounded-2xl overflow-hidden border border-or/30 shadow-sm"
              >
                <div className="relative bg-gray-100">
                  {p.photos?.[0] ? (
                    <img
                      src={p.photos[0]}
                      alt={p.nom}
                      loading="lazy"
                      decoding="async"
                      className="w-full aspect-square object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-square" />
                  )}
                  {enPromo && (
                    <span className="absolute bottom-2 left-2 bg-noir text-white text-sm rounded-full px-3 py-1">
                      Promotion
                    </span>
                  )}
                  {epuise && (
                    <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-semibold rounded-full px-2.5 py-1">
                      Épuisé
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg">{p.nom}</h3>
                  {enPromo && (
                    <p className="text-gray-400 line-through text-sm mt-1">
                      {fcfa(p.prix_barre as number)}
                    </p>
                  )}
                  <p className="text-xl font-bold text-or-fonce mt-1">
                    {fcfa(p.prix)}
                  </p>
                  {s.nb > 0 && (
                    <p className="text-sm mt-1">
                      <Etoiles note={s.moyenne} />{" "}
                      <span className="text-brun">({s.nb})</span>
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Marques (gérées par l'admin) */}
        {marques.length > 0 && (
          <>
            <h2 id="marques" className="text-2xl font-bold mt-12 mb-4">
              Marques
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {marques.map((m) => (
                <button
                  key={m.id}
                  onClick={() => choisirMarque(m.nom)}
                  className={`rounded-xl py-6 px-3 text-center ${
                    m.image_url
                      ? "bg-white border border-or/30"
                      : "bg-noir text-white"
                  } ${marque === m.nom ? "ring-2 ring-or" : ""}`}
                >
                  {m.image_url && (
                    <img
                      src={m.image_url}
                      alt={m.nom}
                      loading="lazy"
                      decoding="async"
                      className="h-16 mx-auto object-contain mb-2"
                    />
                  )}
                  <span
                    className={`block font-bold italic tracking-wide ${
                      m.image_url ? "text-noir" : "text-lg"
                    }`}
                  >
                    {m.nom}
                  </span>
                  <span
                    className={`block text-xs mt-1 ${
                      m.image_url ? "text-brun" : "text-white/60"
                    }`}
                  >
                    Voir la collection
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Pied de page */}
        <footer className="mt-12 mb-6 border-t border-black/10 pt-8">
          <div className="grid md:grid-cols-3 gap-8 text-sm">
            <div>
              <h3 className="font-bold mb-3">Liens rapides</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/">Accueil</a>
                </li>
                <li>
                  <a href="#produits" onClick={() => setMarque("")}>
                    Nos produits
                  </a>
                </li>
                {marques.length > 0 && (
                  <li>
                    <a href="#marques">Marques</a>
                  </li>
                )}
                <li>
                  <a href="/compte">{userId ? "Mon compte" : "Connexion"}</a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-3">Contactez-nous</h3>
              {numeroWhatsapp ? (
                <a
                  href={`https://wa.me/${numeroWhatsapp}`}
                  className="inline-block bg-green-600 text-white rounded-full px-5 py-2 font-semibold"
                >
                  Écrire sur WhatsApp
                </a>
              ) : (
                <p className="text-brun">Contact bientôt disponible.</p>
              )}
            </div>

            <div>
              <h3 className="font-bold mb-3">
                Abonne-toi pour recevoir nos nouveautés
              </h3>
              <form onSubmit={inscrireNewsletter} className="flex gap-2">
                <input
                  type="email"
                  value={emailNews}
                  onChange={(e) => setEmailNews(e.target.value)}
                  placeholder="E-mail"
                  className="border border-black/20 bg-white rounded-full flex-1 min-w-0 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-or"
                />
                <button
                  type="submit"
                  disabled={enCoursNews}
                  className="bg-noir text-white rounded-full px-4 py-2 disabled:opacity-50"
                >
                  {enCoursNews ? "..." : "OK"}
                </button>
              </form>
              {messageNews && (
                <p className="text-brun mt-2">{messageNews}</p>
              )}
            </div>
          </div>

          <div className="mt-10 text-center text-sm text-brun">
            <p className="font-semibold tracking-wide">
              Qualité · Style · Confiance · Exclusivité
            </p>
            <p className="mt-1">Livraison rapide · Authenticité garantie</p>
            <p className="mt-3 text-xs">© 2026 Isma&apos;Store</p>
          </div>
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