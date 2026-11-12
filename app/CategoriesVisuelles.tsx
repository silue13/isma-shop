import Link from "next/link";
import { dansCategorie } from "./boutique";

type ProduitCat = {
  nom: string;
  categorie?: string | null;
  prix: number;
  prix_barre: number | null;
  created_at?: string | null;
  photos: string[];
};

type Categorie = { id: string; nom: string; nb: number };

export default function CategoriesVisuelles({
  produits,
  categories,
}: {
  produits: ProduitCat[];
  categories: Categorie[];
}) {
  if (categories.length === 0) return null;

  return (
    <section id="categories" className="scroll-mt-20">
      <h2 className="text-2xl font-bold mt-8 mb-4">Acheter par catégorie</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {categories.map((c, i) => {
          const photo = produits.find(
            (p) => dansCategorie(c.id, p) && p.photos?.[0]
          )?.photos[0];
          return (
            <Link
              key={c.id}
              href={`/categorie/${c.id}`}
              className="relative block overflow-hidden rounded-2xl border border-or/30 bg-noir aspect-[4/5]"
            >
              {photo && (
                <img
                  src={photo}
                  alt={c.nom}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <span className="block text-xs text-or font-bold tracking-widest">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="block font-bold text-lg leading-tight">
                  {c.nom}
                </span>
                <span className="block text-xs text-white/70">
                  {c.nb} {c.nb > 1 ? "paires" : "paire"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}