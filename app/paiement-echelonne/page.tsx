import PageInfo, { Section } from "../PageInfo";
import { BOUTIQUE, prixEn3Fois } from "../boutique";

export const metadata = { title: `Paiement en ${BOUTIQUE.nbVersements} fois – ${BOUTIQUE.nom}` };

const fcfa = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;

export default function PaiementEchelonne() {
  const exemple = 25000;
  const v = prixEn3Fois(exemple);
  const dernier = exemple - v * (BOUTIQUE.nbVersements - 1);
  return (
    <PageInfo titre={`Conditions du paiement en ${BOUTIQUE.nbVersements} fois`}>
      {!BOUTIQUE.paiementEn3Fois ? (
        <p className="text-brun">Le paiement en plusieurs fois n&apos;est pas proposé pour le moment.</p>
      ) : (
        <>
          <Section titre="Comment ça marche">
            <ul className="list-disc pl-5 space-y-1">
              {BOUTIQUE.conditions3x.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </Section>

          <Section titre="Exemple">
            <p>
              Pour une paire à {fcfa(exemple)} : {BOUTIQUE.nbVersements - 1} versements de {fcfa(v)} puis un dernier de {fcfa(dernier)}. Le total reste le prix affiché. Ce montant est une estimation jusqu&apos;à confirmation par le vendeur.
            </p>
          </Section>

          <Section titre="Acompte et remise de la paire">
            <p>
              Un premier versement (acompte) est demandé à la commande. Les montants, les dates et les modalités de remise sont confirmés par écrit sur WhatsApp avant tout paiement. La paire n&apos;est réservée qu&apos;après validation de cet acompte.
            </p>
          </Section>

          <Section titre="Justificatifs de paiement">
            <p>
              Tu peux envoyer une capture de ton paiement Wave, Orange Money ou MTN MoMo sur WhatsApp. Le statut est mis à jour après vérification manuelle : une capture seule ne prouve pas que les fonds sont reçus.
            </p>
          </Section>

          <Section titre="Retard et annulation">
            <p>
              En cas de difficulté, contacte la boutique avant la date d&apos;échéance. Toute retenue ou pénalité éventuelle doit t&apos;avoir été clairement communiquée et acceptée avant le versement de l&apos;acompte. Aucun pourcentage automatique non convenu n&apos;est appliqué.
            </p>
          </Section>
        </>
      )}
    </PageInfo>
  );
}