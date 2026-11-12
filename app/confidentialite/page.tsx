import PageInfo, { Section } from "../PageInfo";
import { BOUTIQUE } from "../boutique";

export const metadata = { title: `Politique de confidentialité – ${BOUTIQUE.nom}` };

export default function Confidentialite() {
  return (
    <PageInfo titre="Politique de confidentialité">
      <p className="text-brun">{BOUTIQUE.raisonSociale}, {BOUTIQUE.adresse}, est responsable des données collectées sur {BOUTIQUE.nom}.</p>
      <Section titre="Données collectées">
        <ul className="list-disc pl-5 space-y-1">
          <li>Compte et commande : nom, numéro de téléphone, lieu de livraison et contenu de la commande.</li>
          <li>Offres de prix : nom, numéro de téléphone et prix proposé.</li>
          <li>Avis : note, commentaire et nom affiché.</li>
          <li>Newsletter : adresse e-mail.</li>
          <li>Panier : conservé sur ton appareil (stockage local du navigateur) jusqu&apos;à l&apos;envoi de la commande.</li>
        </ul>
      </Section>
      <Section titre="Pourquoi">
        <p>Ces données servent à traiter tes commandes et tes offres, te contacter à leur sujet, afficher les avis et, si tu t&apos;abonnes, t&apos;envoyer nos nouveautés. Nous ne vendons pas tes données.</p>
      </Section>
      <Section titre="Qui y a accès">
        <p>Le vendeur, et notre prestataire technique qui héberge la base de données du site. Si tu envoies ta commande par WhatsApp, WhatsApp traite aussi le message selon ses propres règles.</p>
      </Section>
      <Section titre="Tes droits">
        <p>Tu peux demander l&apos;accès, la correction ou la suppression de tes données, ou te désabonner de la newsletter, en nous écrivant via la page Contact. Nous gardons tes données le temps nécessaire au suivi de tes commandes.</p>
      </Section>
    </PageInfo>
  );
}
