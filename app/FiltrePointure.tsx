type AvecPointures = { pointures?: string[] | null };

// Toutes les pointures proposées, triées (36, 37, 38...).
export function listerPointures(produits: AvecPointures[]) {
  const set = new Set<string>();
  for (const p of produits) {
    for (const x of p.pointures || []) {
      if (x && x.trim()) set.add(x.trim());
    }
  }
  return [...set].sort((a, b) => {
    const na = parseFloat(a);
    const nb = parseFloat(b);
    if (!isNaN(na) && !isNaN(nb) && na !== nb) return na - nb;
    return a.localeCompare(b, "fr");
  });
}

export function aPointure(p: AvecPointures, pointure: string) {
  return !pointure || (p.pointures || []).some((x) => x.trim() === pointure);
}

export default function FiltrePointure({
  pointures,
  choisie,
  onChoisir,
}: {
  pointures: string[];
  choisie: string;
  onChoisir: (p: string) => void;
}) {
  const liste = choisie && !pointures.includes(choisie) ? [...pointures, choisie] : pointures;
  if (liste.length === 0) return null;

  const chip = (actif: boolean) =>
    `shrink-0 rounded-full px-4 py-1.5 text-sm border ${
      actif ? "bg-noir text-or border-noir" : "bg-white border-or/40"
    }`;

  return (
    <div className="mb-4">
      <p className="text-sm font-medium text-brun mb-2">Pointure</p>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        <button
          type="button"
          onClick={() => onChoisir("")}
          aria-pressed={choisie === ""}
          className={chip(choisie === "")}
        >
          Toutes
        </button>
        {liste.map((x) => (
          <button
            key={x}
            type="button"
            onClick={() => onChoisir(x)}
            aria-pressed={choisie === x}
            className={chip(choisie === x)}
          >
            {x}
          </button>
        ))}
      </div>
    </div>
  );
}
