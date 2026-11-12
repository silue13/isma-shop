import Link from "next/link";
import BoutonFavori from "./BoutonFavori";
import { lienProduit } from "./boutique";

type ProduitPromo = {
  id: number;
  nom: string;
  prix: number;
  prix_barre: number | null;
  stock: number | null;
  photos: string[];
};

const fcfa = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;

export default function Promos({
  produits,
  estFavori,
  basculer,
}: {
  produits: ProduitPromo[];
  estFavori: (id: number) => boolean;
  basculer: (id: number) => void;
}) {
  return (
    <section id="promos" className="scroll-mt-20">
      <h2 className="text-2xl font-bold mt-8 mb-1">Promos</h2>
      <p className="text-sm text-brun mb-4">Les paires en promotion.</p>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
        {produits.map((p) => {
          const ancien = p.prix_barre as number;
          const reduction = Math.round((1 - p.prix / ancien) * 100);
          const epuise = p.stock != null && p.stock <= 0;
          return (
            <Link
              key={p.id}
              href={lienProduit(p)}
              className="snap-start shrink-0 w-44 bg-white rounded-2xl overflow-hidden border border-or/30 shadow-sm"
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
                <span className="absolute bottom-2 left-2 bg-red-600 text-white text-xs font-semibold rounded-full px-2.5 py-1">
                  -{reduction}%
                </span>
                <BoutonFavori
                  actif={estFavori(p.id)}
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
                <h3 className="font-bold text-sm">{p.nom}</h3>
                <p className="text-gray-400 line-through text-xs mt-1">{fcfa(ancien)}</p>
                <p className="font-bold text-or-fonce">{fcfa(p.prix)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
