import PageInfo, { Section } from "../PageInfo";
import { BOUTIQUE } from "../boutique";

export const metadata = { title: `Conditions générales de vente – ${BOUTIQUE.nom}` };

export default function CGV() {
  return (
    <PageInfo titre="Conditions générales de vente">
      <Section titre="1. Commande">
        <p>Tu choisis tes articles (pointure, couleur, quantité), tu les ajoutes au panier, puis tu envoies ta commande. Elle t&apos;ouvre une conversation WhatsApp avec {BOUTIQUE.nom}. La commande n&apos;est définitive qu&apos;après confirmation de la disponibilité par le vendeur.</p>
      </Section>
      <Section titre="2. Prix">
        <p>Les prix sont affichés en francs CFA (FCFA). Le prix de la livraison n&apos;est pas inclus : il t&apos;est indiqué sur WhatsApp avant que tu paies.</p>
      </Section>
      <Section titre="3. Paiement">
        <p>Moyens acceptés : {BOUTIQUE.paiements.join(", ")}.</p>
        {BOUTIQUE.paiementEn3Fois && (
          <p>Le paiement en {BOUTIQUE.nbVersements} fois est possible sur demande : voir la page « Paiement en {BOUTIQUE.nbVersements} fois ».</p>
        )}
      </Section>
      <Section titre="4. Livraison">
        <p>Le lieu de livraison est celui que tu indiques à la commande. Le délai et le prix te sont confirmés sur WhatsApp.</p>
      </Section>
      <Section titre="5. Échanges et retours">
        <p>{BOUTIQUE.retours}</p>
      </Section>
      <Section titre="6. Données personnelles">
        <p>Ton nom, ton numéro de téléphone et ton lieu de livraison servent uniquement à traiter ta commande et à te contacter à son sujet.</p>
      </Section>
    </PageInfo>
  );
}
