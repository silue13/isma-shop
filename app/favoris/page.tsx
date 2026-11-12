"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../supabase";
import { useFavoris } from "../favoris";
import BoutonFavori from "../BoutonFavori";
import PageInfo from "../PageInfo";
import { BOUTIQUE, prixEn3Fois, lienProduit } from "../boutique";

type Produit = {
  id: number;
  nom: string;
  prix: number;
  prix_barre: number | null;
  stock: number | null;
  photos: string[];
};

const fcfa = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;

export default function Favoris() {
  const { ids, pret, basculer } = useFavoris();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [chargement, setChargement] = useState(true);

  const cle = ids.join(",");
  useEffect(() => {
    if (!pret) return;
    if (ids.length === 0) {
      setChargement(false);
      return;
    }
    supabase
      .from("products")
      .select("id, nom, prix, prix_barre, stock, photos")
      .eq("actif", true)
      .in("id", ids)
      .then(({ data }) => {
        setProduits((data as Produit[]) || []);
        setChargement(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle, pret]);

  const affiches = ids
    .map((id) => produits.find((p) => p.id === id))
    .filter((p): p is Produit => !!p);

  return (
    <PageInfo titre="Mes favoris">
      {!pret || chargement ? (
        <p className="text-brun">Chargement...</p>
      ) : affiches.length === 0 ? (
        <div>
          <p className="text-brun">
            Tu n&apos;as pas encore de favoris. Appuie sur le cœur d&apos;une paire pour la retrouver ici.
          </p>
          <Link
            href="/"
            className="inline-block bg-noir text-or font-semibold rounded-full px-6 py-3 mt-4"
          >
            Voir les produits
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {affiches.map((p) => {
            const epuise = p.stock != null && p.stock <= 0;
            return (
              <Link
                key={p.id}
                href={lienProduit(p)}
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
                  <BoutonFavori
                    actif
                    onClick={() => basculer(p.id)}
                    className="absolute top-2 left-2"
                  />
                  {epuise && (
                    <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-semibold rounded-full px-2.5 py-1">
                      Épuisé
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h2 className="font-bold">{p.nom}</h2>
                  <p className="text-lg font-bold text-or-fonce mt-1">{fcfa(p.prix)}</p>
                  {BOUTIQUE.paiementEn3Fois && (
                    <p className="text-xs text-brun mt-0.5">
                      ou en {BOUTIQUE.nbVersements}x {fcfa(prixEn3Fois(p.prix))}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </PageInfo>
  );
}
