"use client";

import { useCallback, useEffect, useState } from "react";

const CLE = "favoris";

function lire(): number[] {
  try {
    const v = JSON.parse(localStorage.getItem(CLE) || "[]");
    return Array.isArray(v) ? v.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

// Les favoris sont gardés sur l'appareil du client (pas besoin de compte).
export function useFavoris() {
  const [ids, setIds] = useState<number[]>([]);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    setIds(lire());
    setPret(true);
    const maj = () => setIds(lire());
    window.addEventListener("storage", maj);
    return () => window.removeEventListener("storage", maj);
  }, []);

  const basculer = useCallback((id: number) => {
    const actuel = lire();
    const suivant = actuel.includes(id)
      ? actuel.filter((i) => i !== id)
      : [id, ...actuel];
    try {
      localStorage.setItem(CLE, JSON.stringify(suivant));
    } catch {}
    setIds(suivant);
  }, []);

  return { ids, pret, basculer, estFavori: (id: number) => ids.includes(id) };
}
