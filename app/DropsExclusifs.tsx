"use client";

import { useState } from "react";
import Link from "next/link";
import { lienProduit } from "./boutique";

type ProduitDrop = {
  id: number;
  nom: string;
  prix: number;
  prix_barre: number | null;
  created_at?: string | null;
  photos: string[];
};

const fcfa = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;
const DUREE_MS = 5000;

export default function DropsExclusifs({
  produits,
}: {
  produits: ProduitDrop[];
}) {
  const [i, setI] = useState(0);
  const [pause, setPause] = useState(false);
  const [departX, setDepartX] = useState<number | null>(null);

  const drops = produits
    .filter((p) => p.photos?.[0])
    .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
    .slice(0, 6);

  const n = drops.length;
  if (n < 2) return null;

  const idx = i % n;
  const actuel = drops[idx];
  const aller = (k: number) => setI(((k % n) + n) % n);
  const suivant = () => aller(idx + 1);
  const precedent = () => aller(idx - 1);

  const remise =
    actuel.prix_barre && actuel.prix_barre > actuel.prix
      ? Math.round((1 - actuel.prix / actuel.prix_barre) * 100)
      : 0;

  const etat = pause ? "paused" : "running";

  return (
    <section
      aria-label="Drops exclusifs"
      className="mt-10 rounded-3xl bg-noir text-white overflow-hidden"
    >
      <style>{`
        @keyframes drop-barre { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes drop-zoom { from { transform: scale(1); } to { transform: scale(1.12); } }
        @keyframes drop-entree { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .drop-anim { animation: none !important; } }
      `}</style>

      {/* En-tête */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-or opacity-60 animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-or" />
          </span>
          <span className="text-xs font-bold tracking-[0.25em] text-or">
            NOUVEAUTÉS
          </span>
        </div>
        <h2 className="text-3xl font-extrabold mt-1">Drops exclusifs</h2>
        <p className="text-sm text-white/70 mt-1">
          Les dernières paires arrivées en boutique.
        </p>
      </div>

      {/* Scène */}
      <div
        className="relative mx-4 rounded-2xl overflow-hidden aspect-[4/5] md:aspect-[16/9] bg-black"
        onMouseEnter={() => setPause(true)}
        onMouseLeave={() => setPause(false)}
        onTouchStart={(e) => {
          setPause(true);
          setDepartX(e.touches[0].clientX);
        }}
        onTouchEnd={(e) => {
          setPause(false);
          if (departX !== null) {
            const dx = e.changedTouches[0].clientX - departX;
            if (Math.abs(dx) > 50) {
              if (dx < 0) suivant();
              else precedent();
            }
          }
          setDepartX(null);
        }}
      >
        {/* Photo avec zoom lent */}
        <img
          key={actuel.id}
          src={actuel.photos[0]}
          alt={actuel.nom}
          decoding="async"
          className="drop-anim absolute inset-0 w-full h-full object-cover"
          style={{
            animation: `drop-zoom ${DUREE_MS + 1500}ms ease-out forwards`,
            animationPlayState: etat,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30 pointer-events-none" />

        {/* Barres de progression */}
        <div className="absolute top-3 left-3 right-3 z-10 flex gap-1.5">
          {drops.map((d, k) => (
            <span
              key={d.id}
              className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden"
            >
              <span
                className="drop-anim block h-full w-full origin-left bg-or"
                style={{
                  transform: k < idx ? "scaleX(1)" : "scaleX(0)",
                  ...(k === idx
                    ? {
                        transform: "scaleX(1)",
                        animation: `drop-barre ${DUREE_MS}ms linear`,
                        animationPlayState: etat,
                      }
                    : {}),
                }}
                onAnimationEnd={k === idx ? suivant : undefined}
              />
            </span>
          ))}
        </div>

        {/* Badges */}
        <div className="absolute top-8 left-3 z-10 flex gap-2">
          <span className="bg-or text-noir text-[11px] font-extrabold tracking-widest rounded-full px-3 py-1">
            NEW
          </span>
          {remise > 0 && (
            <span className="bg-red-600 text-white text-[11px] font-bold rounded-full px-3 py-1">
              -{remise}%
            </span>
          )}
        </div>

        {/* Zones de tap : précédent / suivant */}
        <div className="absolute inset-x-0 top-14 bottom-40 z-[5] flex">
          <button
            type="button"
            aria-label="Paire précédente"
            onClick={precedent}
            className="flex-1 flex items-center justify-start pl-3 text-3xl text-white/0 hover:text-white/80 transition-colors"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Paire suivante"
            onClick={suivant}
            className="flex-1 flex items-center justify-end pr-3 text-3xl text-white/0 hover:text-white/80 transition-colors"
          >
            ›
          </button>
        </div>

        {/* Infos produit */}
        <div
          key={`txt-${actuel.id}`}
          className="drop-anim absolute bottom-0 left-0 right-0 z-10 p-5 pointer-events-none"
          style={{ animation: "drop-entree 600ms ease-out both" }}
        >
          <h3 className="text-2xl md:text-3xl font-extrabold leading-tight line-clamp-2">
            {actuel.nom}
          </h3>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-xl font-bold text-or">
              {fcfa(actuel.prix)}
            </span>
            {remise > 0 && actuel.prix_barre && (
              <span className="text-sm text-white/60 line-through">
                {fcfa(actuel.prix_barre)}
              </span>
            )}
          </div>
          <Link
            href={lienProduit(actuel)}
            className="pointer-events-auto inline-block mt-3 bg-or text-noir rounded-full px-6 py-2.5 font-bold active:scale-95 transition-transform"
          >
            Voir la paire →
          </Link>
        </div>
      </div>

      {/* Vignettes */}
      <div className="flex gap-2 overflow-x-auto px-4 py-4">
        {drops.map((d, k) => (
          <button
            key={d.id}
            type="button"
            onClick={() => aller(k)}
            aria-label={`Voir ${d.nom}`}
            aria-current={k === idx ? "true" : undefined}
            className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
              k === idx
                ? "border-or scale-105"
                : "border-transparent opacity-60 hover:opacity-100"
            }`}
          >
            <img
              src={d.photos[0]}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </section>
  );
}