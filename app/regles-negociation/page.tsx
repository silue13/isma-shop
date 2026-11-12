import PageInfo, { Section } from "../PageInfo";
import { BOUTIQUE } from "../boutique";

export const metadata = { title: `Règles de négociation – ${BOUTIQUE.nom}` };

const fcfa = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;

export default function ReglesNegociation() {
  const pct = BOUTIQUE.offreMinPourcent;
  const exemple = 25000;
  return (
    <PageInfo titre="Règles de négociation">
      <Section titre="Faire une offre">
        <p>Sur la page d&apos;un produit, appuie sur « Faire une offre ». Indique ton prix, ton nom et ton numéro WhatsApp, puis envoie.</p>
      </Section>
      <Section titre="Quel prix proposer">
        <p>Ton offre doit être inférieure au prix affiché et valoir au moins {pct} % de ce prix. Pour une paire à {fcfa(exemple)}, tu peux proposer entre {fcfa((exemple * pct) / 100)} et {fcfa(exemple - 1)}.</p>
      </Section>
      <Section titre="La réponse du vendeur">
        <p>Le vendeur accepte ou refuse ton offre et te répond sur WhatsApp, au numéro que tu as indiqué. Tu peux aussi suivre son état depuis ton compte.</p>
        <p>Si ton offre est acceptée, il te demande ta pointure et ton lieu de livraison pour finaliser la commande. Si elle est refusée, tu peux toujours commander au prix affiché.</p>
      </Section>
      <Section titre="Bon à savoir">
        <p>Une offre n&apos;est pas une commande : elle devient une commande une fois que tu as confirmé avec le vendeur sur WhatsApp.</p>
      </Section>
    </PageInfo>
  );
}
