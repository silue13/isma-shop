
import Link from "next/link";
import BoutonFavori from "./BoutonFavori";
import { BOUTIQUE, estNouveau, prixEn3Fois, lienProduit } from "./boutique";

export type ProduitCarte = {
  id: number;
  nom: string;
  prix: number;
  prix_barre: number | null;
  stock: number | null;
  photos: string[];
  created_at: string | null;
  categorie?: string | null;
  pointures?: string[] | null;
  marque?: string | null;
};

const fcfa = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;

export default function CarteProduit({
  p,
  favori,
  onFavori,
}: {
  p: ProduitCarte;
  favori: boolean;
  onFavori: () => void;
}) {
  const enPromo = !!p.prix_barre && p.prix_barre > p.prix;
  const epuise = p.stock != null && p.stock <= 0;
  const remise = enPromo
    ? Math.round((1 - p.prix / (p.prix_barre as number)) * 100)
    : 0;

  return (
    <Link
      href={lienProduit(p)}
      className="fade-up group flex flex-col bg-white rounded-2xl overflow-hidden border border-or/30 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-or/20 hover:border-or"
    >
      <div className="relative bg-gray-100 aspect-square overflow-hidden">
        {p.photos?.[0] && (
          <img
            src={p.photos[0]}
            alt={p.nom}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        )}
        {p.photos?.[1] && (
          <img
            src={p.photos[1]}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}

        {remise > 0 && (
          <span className="absolute bottom-2 left-2 bg-noir text-white text-xs font-bold rounded-full px-3 py-1">
            -{remise}%
          </span>
        )}

        {estNouveau(p.created_at) && (
          <span className="absolute bottom-2 right-2 bg-or text-noir text-xs font-extrabold tracking-wider rounded-full px-2.5 py-1">
            NEW
          </span>
        )}

        <BoutonFavori
          actif={favori}
          onClick={onFavori}
          className="absolute top-2 left-2"
        />

        {epuise && (
          <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-semibold rounded-full px-2.5 py-1">
            Épuisé
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg leading-tight line-clamp-2">
          {p.nom}
        </h3>

        <div className="flex items-baseline gap-2 mt-1.5 flex-wrap">
          <span className="text-xl font-extrabold text-or-fonce">
            {fcfa(p.prix)}
          </span>

          {enPromo && (
            <span className="text-gray-400 line-through text-sm">
              {fcfa(p.prix_barre as number)}
            </span>
          )}
        </div>

        {BOUTIQUE.paiementEn3Fois && (
          <p className="text-xs text-brun mt-0.5">
            ou en {BOUTIQUE.nbVersements}x {fcfa(prixEn3Fois(p.prix))}
          </p>
        )}
      </div>
    </Link>
  );
}
