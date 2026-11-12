import { BOUTIQUE } from "./boutique";

export default function MoyensPaiement({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`} aria-label="Moyens de paiement">
      {BOUTIQUE.paiements.map((p) => (
        <li key={p} className="border border-or/40 bg-white rounded-full px-3 py-1 text-xs font-semibold text-noir">
          {p}
        </li>
      ))}
    </ul>
  );
}
