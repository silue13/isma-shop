import PageInfo from "../PageInfo";
import { BOUTIQUE } from "../boutique";

export const metadata = { title: `Contact & Réseaux – ${BOUTIQUE.nom}` };

export default function Contact() {
  const numero = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const snap = process.env.NEXT_PUBLIC_SNAPCHAT_URL;
  const message = "Bonjour, j'ai besoin d'aide pour choisir ou commander une paire.";

  return (
    <PageInfo titre="Contact & Réseaux">
      <p>
        Une question sur une pointure, une offre ou une commande ? Échange
        directement avec {BOUTIQUE.nom}.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        {snap && (
          <div className="bg-white border border-or/30 rounded-2xl p-5">
            <h2 className="font-bold text-lg">Snapchat</h2>
            <p className="text-sm text-brun mt-1 mb-4">
              Retrouve la boutique sur Snapchat et poursuis l&apos;échange avec
              ton contact.
            </p>
            <a
              href={snap}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-yellow-300 text-noir rounded-full px-6 py-2.5 font-semibold"
            >
              Ouvrir Snapchat
            </a>
          </div>
        )}

        <div className="bg-white border border-or/30 rounded-2xl p-5">
          <h2 className="font-bold text-lg">WhatsApp</h2>
          <p className="text-sm text-brun mt-1 mb-4">
            Envoie ta demande pré-remplie. Les commandes sont confirmées
            manuellement par le vendeur.
          </p>
          {numero ? (
            <a
              href={`https://wa.me/${numero}?text=${encodeURIComponent(message)}`}
              className="inline-block bg-green-600 text-white rounded-full px-6 py-2.5 font-semibold"
            >
              Écrire sur WhatsApp
            </a>
          ) : (
            <p className="text-brun">Le contact WhatsApp sera bientôt disponible.</p>
          )}
        </div>
      </div>

      <p className="text-sm text-brun">
        Aucun paiement par carte bancaire n&apos;est demandé sur ce site.
      </p>
    </PageInfo>
  );
}