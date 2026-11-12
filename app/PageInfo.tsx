import Link from "next/link";
import type { ReactNode } from "react";
import { BOUTIQUE } from "./boutique";

export default function PageInfo({
  titre,
  children,
  large = false,
}: {
  titre: string;
  children: ReactNode;
  large?: boolean;
}) {
  const largeur = large ? "max-w-5xl" : "max-w-2xl";
  return (
    <div className="min-h-screen bg-creme text-noir">
      <header className="bg-white border-b border-black/10">
        <div className={`${largeur} mx-auto px-4 py-3`}>
          <Link href="/" className="font-bold text-sm">← {BOUTIQUE.nom}</Link>
        </div>
      </header>
      <main className={`${largeur} mx-auto px-4 py-8 pb-16`}>
        <h1 className="text-3xl font-bold italic mb-6">{titre}</h1>
        <div className="space-y-6 leading-relaxed">{children}</div>
      </main>
    </div>
  );
}

export function Section({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-bold text-lg mb-1">{titre}</h2>
      <div className="text-brun space-y-2">{children}</div>
    </section>
  );
}
