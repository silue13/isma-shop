"use client";

import BoutonInstaller from "./BoutonInstaller";
import { BOUTIQUE } from "./boutique";

export default function Hero({
  afficherMarques,
  onAcheter,
}: {
  afficherMarques: boolean;
  onAcheter: () => void;
}) {
  return (
    <section className="relative overflow-hidden bg-noir text-white">
      {/* Photo de fond qui zoome lentement */}
      <img
        src="/logo-banniere.jpg"
        alt={`${BOUTIQUE.nom} - Sneakers tendance premium`}
        className="hero-zoom absolute inset-0 w-full h-full object-cover opacity-50"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-noir" />

      {/* Halos dorés flottants */}
      <div className="float-slow absolute -top-24 -right-20 h-72 w-72 rounded-full bg-or/30 blur-3xl" />
      <div
        className="float-slow absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-or/20 blur-3xl"
        style={{ animationDelay: "2s" }}
      />

      <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-14 md:pt-24 md:pb-20 text-center">
        <span className="fade-up inline-flex items-center gap-2 rounded-full border border-or/50 bg-black/40 px-4 py-1.5 text-[11px] font-bold tracking-[0.25em] text-or">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-or opacity-60 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-or" />
          </span>
          SNEAKERS TENDANCE PREMIUM
        </span>

        <h1 className="fade-up d1 mt-5 text-4xl md:text-6xl font-extrabold italic leading-[1.05]">
          Les meilleures baskets
          <br />
          <span className="texte-or">du moment</span>
        </h1>

        <p className="fade-up d2 text-white/75 mt-5 max-w-xl mx-auto md:text-lg">
          Commande sur WhatsApp
          {BOUTIQUE.paiementEn3Fois
            ? `, paie en ${BOUTIQUE.nbVersements} fois si tu veux`
            : ""}
          .
        </p>

        <div className="fade-up d3 flex flex-wrap justify-center gap-3 mt-8">
          <a
            href="#produits"
            onClick={onAcheter}
            className="btn-shine bg-or text-noir font-bold rounded-full px-9 py-3.5 shadow-lg shadow-or/30 hover:scale-105 active:scale-95 transition-transform"
          >
            Acheter
          </a>
          {afficherMarques && (
            <a
              href="#marques"
              className="border border-white/60 rounded-full px-9 py-3.5 hover:bg-white hover:text-noir transition-colors"
            >
              Voir les marques
            </a>
          )}
        </div>

        <div className="fade-up d4 mt-4">
          <BoutonInstaller />
        </div>

        <a
          href="#categories"
          aria-label="Descendre"
          className="rebond inline-block mt-8 text-or text-2xl"
        >
          ⌄
        </a>
      </div>
    </section>
  );
}