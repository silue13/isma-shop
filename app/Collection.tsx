"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "./supabase";
import { useFavoris } from "./favoris";
import PageInfo from "./PageInfo";
import CarteProduit, { type ProduitCarte } from "./CarteProduit";
import FiltrePointure, { listerPointures, aPointure } from "./FiltrePointure";
import { BOUTIQUE, LISTE_CATEGORIES, dansCategorie } from "./boutique";

export default function Collection({
  type,
  valeur,
}: {
  type: "marque" | "categorie";
  valeur: string;
}) {
  const { estFavori, basculer } = useFavoris();
  const [produits, setProduits] = useState<ProduitCarte[]>([]);
  const [chargement, setChargement] = useState(true);
  const [pointure, setPointure] = useState("");

  const categorie = LISTE_CATEGORIES.find((c) => c.id === valeur);
  const inconnue = type === "categorie" && !categorie;
  const titre = type === "marque" ? valeur || "Marque" : categorie?.nom || "Catégorie";

  useEffect(() => {
    document.title = `${titre} – ${BOUTIQUE.nom}`;
  }, [titre]);

  useEffect(() => {
    supabase
      .from("products")
      .select("id, nom, prix, prix_barre, stock, photos, created_at, categorie, pointures, marque")
      .eq("actif", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProduits((data as ProduitCarte[]) || []);
        setChargement(false);
      });
  }, []);

  const mot = valeur.trim().toLowerCase();
  const base = produits.filter((p) =>
    type === "marque"
      ? !!mot && (p.marque || p.nom).toLowerCase().includes(mot)
      : dansCategorie(valeur, p)
  );
  const affiches = base.filter((p) => aPointure(p, pointure));

  return (
    <PageInfo titre={titre} large>
      {type === "categorie" && (
        <div className="flex flex-wrap gap-2">
          {LISTE_CATEGORIES.map((c) => (
            <Link
              key={c.id}
              href={`/categorie/${c.id}`}
              className={`rounded-full px-4 py-1.5 text-sm border ${
                c.id === valeur
                  ? "bg-noir text-or border-noir"
                  : "bg-white border-or/40"
              }`}
            >
              {c.nom}
            </Link>
          ))}
        </div>
      )}

      {!chargement && !inconnue && base.length > 0 && (
        <FiltrePointure
          pointures={listerPointures(base)}
          choisie={pointure}
          onChoisir={setPointure}
        />
      )}

      {chargement ? (
        <p className="text-brun">Chargement...</p>
      ) : inconnue || affiches.length === 0 ? (
        <div>
          <p className="text-brun">
            {inconnue
              ? "Cette catégorie n'existe pas."
              : pointure
              ? "Aucun produit dans cette pointure."
              : "Aucun produit pour le moment."}
          </p>
          <Link
            href="/"
            className="inline-block bg-noir text-or font-semibold rounded-full px-6 py-3 mt-4"
          >
            Voir tous les produits
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {affiches.map((p) => (
            <CarteProduit
              key={p.id}
              p={p}
              favori={estFavori(p.id)}
              onFavori={() => basculer(p.id)}
            />
          ))}
        </div>
      )}
    </PageInfo>
  );
}
