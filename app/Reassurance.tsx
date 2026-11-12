import Link from "next/link";
import { BOUTIQUE } from "./boutique";

const icones = {
  livraison: (
    <>
      <path d="M3 7h11v9H3z" />
      <path d="M14 10h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
    </>
  ),
  authentique: (
    <>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      <path d="M8.5 12l2.5 2.5 4.5-5" />
    </>
  ),
  paiement: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <circle cx="16.5" cy="14.5" r="1" />
    </>
  ),
  service: <path d="M4 5h16v11H9l-5 4z" />,
};

export default function Reassurance() {
  const items = [
    { icone: "livraison", titre: "Livraison rapide", detail: "Prix et délai confirmés sur WhatsApp", href: "/cgv" },
    { icone: "authentique", titre: "Authenticité garantie", detail: "Voir nos conditions de vente", href: "/cgv" },
    {
      icone: "paiement",
      titre: "Paiement souple",
      detail: BOUTIQUE.paiementEn3Fois
        ? `Mobile money ou en ${BOUTIQUE.nbVersements} fois`
        : "Mobile money ou espèces",
      href: "/paiement-echelonne",
    },
    { icone: "service", titre: "Service client", detail: "WhatsApp ou Snapchat, réponse directe", href: "/contact" },
  ] as const;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-or/30 border-b border-or/30">
      {items.map((i) => (
        <Link
          key={i.titre}
          href={i.href}
          className="group bg-white px-3 py-5 text-center transition-all hover:-translate-y-0.5 hover:bg-creme"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto h-7 w-7 text-or-fonce transition-transform group-hover:scale-110"
            aria-hidden="true"
          >
            {icones[i.icone]}
          </svg>
          <span className="block font-bold text-sm text-noir mt-2">{i.titre}</span>
          <span className="block text-xs text-brun mt-0.5">{i.detail}</span>
        </Link>
      ))}
    </div>
  );
}