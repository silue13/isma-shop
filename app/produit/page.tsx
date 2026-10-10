"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "../supabase";
import FaireOffre from "./FaireOffre";

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

type Suggestion = {
  id: number;
  nom: string;
  prix: number;
  prix_barre: number | null;
  photos: string[];
};

type Avis = {
  id: number;
  etoiles: number;
  commentaire: string | null;
  auteur: string | null;
  created_at: string;
};

type LignePanier = {
  cle: string;
  nom: string;
  prix: number;
  pointure: string;
  couleur: string;
  qte: number;
};

function fcfa(n: number) {
  return `${n.toLocaleString("fr-FR")} FCFA`;
}

function Etoiles({
  note,
  taille = "text-base",
}: {
  note: number;
  taille?: string;
}) {
  return (
    <span className={taille} aria-label={`${note} sur 5`}>
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

function PageProduitContenu() {
  const params = useSearchParams();
  const id = Number(params.get("id"));

  const [chargement, setChargement] = useState(true);
  const [produit, setProduit] = useState<Produit | null>(null);
  const [autres, setAutres] = useState<Suggestion[]>([]);
  const [avis, setAvis] = useState<Avis[]>([]);

  const [photoIndex, setPhotoIndex] = useState(0);
  const [pointure, setPointure] = useState("");
  const [couleur, setCouleur] = useState("");
  const [qte, setQte] = useState(1);
  const [message, setMessage] = useState("");
  const [ajoute, setAjoute] = useState(false);
  const [nbPanier, setNbPanier] = useState(0);

  function compterPanier() {
    try {
      const lignes: LignePanier[] = JSON.parse(
        localStorage.getItem("panier") || "[]"
      );
      setNbPanier(lignes.reduce((s, l) => s + l.qte, 0));
    } catch {
      setNbPanier(0);
    }
  }

  useEffect(() => {
    compterPanier();

    // Remise à zéro quand on change de produit
    setProduit(null);
    setAutres([]);
    setAvis([]);
    setPhotoIndex(0);
    setPointure("");
    setCouleur("");
    setQte(1);
    setMessage("");
    setAjoute(false);
    window.scrollTo({ top: 0 });

    if (!id) {
      setChargement(false);
      return;
    }
    setChargement(true);
    let annule = false;

    // Les trois requêtes partent en même temps
    supabase
      .from("products")
      .select(
        "id, nom, description, prix, prix_barre, stock, photos, pointures, couleurs"
      )
      .eq("id", id)
      .eq("actif", true)
      .maybeSingle()
      .then(({ data }) => {
        if (annule) return;
        setProduit((data as Produit) || null);
        setChargement(false);
      });

    supabase
      .from("reviews")
      .select("id, etoiles, commentaire, auteur, created_at")
      .eq("product_id", id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!annule) setAvis((data as Avis[]) || []);
      });

    supabase
      .from("products")
      .select("id, nom, prix, prix_barre, photos")
      .eq("actif", true)
      .neq("id", id)
      .order("created_at", { ascending: false })
      .limit(4)
      .then(({ data }) => {
        if (!annule) setAutres((data as Suggestion[]) || []);
      });

    return () => {
      annule = true;
    };
  }, [id]);

  const epuise = !!produit && produit.stock != null && produit.stock <= 0;
  const stockBas =
    !!produit && produit.stock != null && produit.stock > 0 && produit.stock <= 5;
  const enPromo =
    !!produit && !!produit.prix_barre && produit.prix_barre > produit.prix;
  const reduction =
    produit && produit.prix_barre && produit.prix_barre > produit.prix
      ? Math.round((1 - produit.prix / produit.prix_barre) * 100)
      : 0;
  const nbAvis = avis.length;
  const moyenne = nbAvis
    ? avis.reduce((s, a) => s + a.etoiles, 0) / nbAvis
    : 0;

  function changerQte(delta: number) {
    setQte((q) => {
      let n = q + delta;
      if (n < 1) n = 1;
      if (produit && produit.stock != null && n > produit.stock) {
        n = Math.max(produit.stock, 1);
      }
      return n;
    });
  }

  function ajouterAuPanier() {
    setMessage("");
    setAjoute(false);
    if (!produit || epuise) return;

    if (produit.pointures?.length && !pointure) {
      setMessage("Choisis une pointure.");
      return;
    }
    if (produit.couleurs?.length && !couleur) {
      setMessage("Choisis une couleur.");
      return;
    }

    let lignes: LignePanier[] = [];
    try {
      lignes = JSON.parse(localStorage.getItem("panier") || "[]");
    } catch {}

    if (produit.stock != null) {
      const dejaDansPanier = lignes
        .filter((l) => l.cle.startsWith(`${produit.id}-`))
        .reduce((s, l) => s + l.qte, 0);
      if (dejaDansPanier + qte > produit.stock) {
        setMessage(
          `Il ne reste que ${produit.stock} en stock (dont ${dejaDansPanier} déjà dans ton panier).`
        );
        return;
      }
    }

    const cle = `${produit.id}-${pointure}-${couleur}`;
    const existante = lignes.find((l) => l.cle === cle);
    if (existante) {
      lignes = lignes.map((l) =>
        l.cle === cle ? { ...l, qte: l.qte + qte } : l
      );
    } else {
      lignes.push({
        cle,
        nom: produit.nom,
        prix: produit.prix,
        pointure,
        couleur,
        qte,
      });
    }
    localStorage.setItem("panier", JSON.stringify(lignes));
    compterPanier();
    setAjoute(true);
  }

  const pastille = (actif: boolean) =>
    "min-w-[3rem] px-4 py-2 rounded-full border text-sm font-medium " +
    (actif
      ? "bg-noir text-or border-noir"
      : "bg-white text-noir border-or/50 hover:border-noir");

  const entete = (
    <header className="sticky top-0 z-40 bg-noir text-white shadow">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        <Link
          href="/"
          className="text-sm bg-white/10 hover:bg-white/20 rounded-full px-3 py-2"
        >
          ← Boutique
        </Link>
        <p className="text-lg font-bold tracking-widest text-or">
          ISMA&apos;STORE
        </p>
        <Link
          href="/?panier=1"
          className="bg-or hover:bg-or-fonce text-noir font-semibold rounded-full px-4 py-2 text-sm"
        >
          Panier ({nbPanier})
        </Link>
      </div>
    </header>
  );

  if (chargement) {
    return (
      <div className="min-h-screen bg-creme text-noir">
        {entete}
        <div className="max-w-3xl mx-auto p-4 animate-pulse">
          <div className="w-full aspect-square rounded-2xl bg-white/70" />
          <div className="h-7 w-2/3 bg-white/70 rounded mt-5" />
          <div className="h-7 w-1/3 bg-white/70 rounded mt-3" />
          <div className="h-12 w-full bg-white/70 rounded-lg mt-6" />
        </div>
      </div>
    );
  }

  if (!produit) {
    return (
      <div className="min-h-screen bg-creme text-noir">
        {entete}
        <div className="max-w-3xl mx-auto p-6 text-center">
          <p className="text-brun mb-4">
            Ce produit n&apos;existe pas ou n&apos;est plus disponible.
          </p>
          <Link
            href="/"
            className="inline-block bg-noir text-or font-semibold rounded-lg px-5 py-3"
          >
            Retour à la boutique
          </Link>
        </div>
      </div>
    );
  }

  const photos = produit.photos || [];

  return (
    <div className="min-h-screen bg-creme text-noir">
      {entete}

      <main className="max-w-3xl mx-auto p-4 pb-12">
        {/* Galerie */}
        {photos.length > 0 ? (
          <>
            <img
              src={photos[photoIndex] || photos[0]}
              alt={produit.nom}
              fetchPriority="high"
              decoding="async"
              className="w-full aspect-square object-cover rounded-2xl bg-white shadow"
            />
            {photos.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {photos.map((u, i) => (
                  <button
                    key={u}
                    onClick={() => setPhotoIndex(i)}
                    className={
                      "shrink-0 rounded-lg overflow-hidden border-2 " +
                      (i === photoIndex ? "border-noir" : "border-transparent")
                    }
                  >
                    <img
                      src={u}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="w-16 h-16 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full aspect-square rounded-2xl bg-white shadow" />
        )}

        {/* Infos */}
        <h1 className="text-2xl font-bold mt-5">{produit.nom}</h1>

        <div className="flex flex-wrap items-center gap-2 mt-2">
          {enPromo && (
            <span className="text-brun line-through">
              {fcfa(produit.prix_barre as number)}
            </span>
          )}
          <span className="text-2xl font-bold text-or-fonce">
            {fcfa(produit.prix)}
          </span>
          {enPromo && (
            <>
              <span className="bg-noir text-or text-xs font-semibold rounded-full px-3 py-1">
                Promotion
              </span>
              <span className="bg-red-600 text-white text-xs font-semibold rounded-full px-3 py-1">
                -{reduction}%
              </span>
            </>
          )}
        </div>

        {nbAvis > 0 && (
          <a href="#avis" className="flex items-center gap-2 mt-2 text-sm">
            <Etoiles note={moyenne} taille="text-lg" />
            <span className="font-semibold">
              {moyenne.toFixed(1).replace(".", ",")}
            </span>
            <span className="text-brun underline">({nbAvis} avis)</span>
          </a>
        )}

        {/* Couleurs */}
        {produit.couleurs?.length > 0 && (
          <div className="mt-5">
            <p className="text-sm font-medium text-brun mb-2">
              Couleur{couleur && ` : ${couleur}`}
            </p>
            <div className="flex flex-wrap gap-2">
              {produit.couleurs.map((c) => (
                <button
                  key={c}
                  onClick={() => setCouleur(c)}
                  className={pastille(couleur === c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pointures */}
        {produit.pointures?.length > 0 && (
          <div className="mt-5">
            <p className="text-sm font-medium text-brun mb-2">
              Pointure{pointure && ` : ${pointure}`}
            </p>
            <div className="flex flex-wrap gap-2">
              {produit.pointures.map((p) => (
                <button
                  key={p}
                  onClick={() => setPointure(p)}
                  className={pastille(pointure === p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantité */}
        {!epuise && (
          <div className="mt-5">
            <p className="text-sm font-medium text-brun mb-2">Quantité</p>
            <div className="inline-flex items-center border border-or/50 rounded-lg bg-white">
              <button onClick={() => changerQte(-1)} className="px-4 py-2 text-lg">
                −
              </button>
              <span className="px-4 font-semibold">{qte}</span>
              <button onClick={() => changerQte(1)} className="px-4 py-2 text-lg">
                +
              </button>
            </div>
          </div>
        )}

        {/* Bouton */}
        {message && (
          <p className="bg-red-50 text-red-700 rounded-lg p-3 mt-4 text-sm">
            {message}
          </p>
        )}

        <button
          onClick={ajouterAuPanier}
          disabled={epuise}
          className="bg-noir text-or font-semibold rounded-lg w-full mt-5 py-3.5 text-lg disabled:opacity-40"
        >
          {epuise ? "Épuisé" : "Ajouter au panier"}
        </button>
        
        {!epuise && (
          <FaireOffre
            produitId={produit.id}
            nom={produit.nom}
            prix={produit.prix}
          />
        )}

        {stockBas && (
          <p className="text-sm mt-3 text-orange-700">
            ● Stock bas : {produit.stock} restant(s)
          </p>
        )}
        {epuise && (
          <p className="text-sm mt-3 text-red-600 font-semibold">
            Ce produit est momentanément épuisé.
          </p>
        )}

        {ajoute && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-4">
            <p className="font-semibold text-green-800 mb-3">
              ✓ Ajouté au panier
            </p>
            <div className="flex gap-2">
              <Link
                href="/?panier=1"
                className="flex-1 text-center bg-or hover:bg-or-fonce text-noir font-semibold rounded-lg py-2.5"
              >
                Voir mon panier
              </Link>
              <Link
                href="/"
                className="flex-1 text-center bg-white border border-or/50 rounded-lg py-2.5"
              >
                Continuer mes achats
              </Link>
            </div>
          </div>
        )}

        {/* Description */}
        {produit.description && (
          <div className="mt-8">
            <h2 className="text-lg font-bold mb-2">Description</h2>
            <p className="text-sm whitespace-pre-line leading-relaxed">
              {produit.description}
            </p>
          </div>
        )}

        {/* Avis */}
        <div id="avis" className="mt-8">
          <h2 className="text-lg font-bold mb-3">
            Avis des clients {nbAvis > 0 && `(${nbAvis})`}
          </h2>
          {nbAvis === 0 && (
            <p className="text-sm text-brun">
              Pas encore d&apos;avis sur ce produit.
            </p>
          )}
          {avis.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-xl border border-or/20 p-3 mb-2"
            >
              <div className="flex items-center justify-between">
                <Etoiles note={a.etoiles} />
                <span className="text-xs text-brun">
                  {new Date(a.created_at).toLocaleDateString("fr-FR")}
                </span>
              </div>
              <p className="text-sm font-semibold mt-1">{a.auteur || "Client"}</p>
              {a.commentaire && <p className="text-sm mt-1">{a.commentaire}</p>}
            </div>
          ))}
        </div>

        {/* Suggestions */}
        {autres.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-bold mb-3 italic">
              Vous aimerez peut-être aussi
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {autres.map((p) => {
                const promo = !!p.prix_barre && p.prix_barre > p.prix;
                return (
                  <Link
                    key={p.id}
                    href={`/produit?id=${p.id}`}
                    className="bg-white rounded-2xl shadow border border-or/30 overflow-hidden"
                  >
                    <div className="relative">
                      {p.photos?.[0] ? (
                        <img
                          src={p.photos[0]}
                          alt={p.nom}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-36 object-cover"
                        />
                      ) : (
                        <div className="w-full h-36 bg-creme" />
                      )}
                      {promo && (
                        <span className="absolute top-2 left-2 bg-noir text-or text-xs font-semibold rounded-full px-2.5 py-1">
                          Promotion
                        </span>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="font-semibold text-sm">{p.nom}</p>
                      <p className="text-sm">
                        {promo && (
                          <span className="text-brun line-through mr-1 text-xs">
                            {p.prix_barre}
                          </span>
                        )}
                        <span className="font-bold text-or-fonce">
                          {fcfa(p.prix)}
                        </span>
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function PageProduit() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-creme" />}>
      <PageProduitContenu />
    </Suspense>
  );
}