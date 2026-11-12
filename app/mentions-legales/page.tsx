import PageInfo, { Section } from "../PageInfo";
import { BOUTIQUE } from "../boutique";

export const metadata = { title: `Mentions légales – ${BOUTIQUE.nom}` };

export default function MentionsLegales() {
  const numero = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  return (
    <PageInfo titre="Mentions légales">
      <Section titre="Éditeur du site">
        <p>Le site {BOUTIQUE.nom} est exploité par {BOUTIQUE.raisonSociale}.</p>
        <p>Adresse : {BOUTIQUE.adresse}</p>
        {BOUTIQUE.registre && <p>Identifiant d&apos;entreprise : {BOUTIQUE.registre}</p>}
        {BOUTIQUE.responsable && <p>Responsable de la publication : {BOUTIQUE.responsable}</p>}
        {BOUTIQUE.email && <p>E-mail : {BOUTIQUE.email}</p>}
        {numero && <p>WhatsApp : +{numero}</p>}
      </Section>
      {BOUTIQUE.hebergeur && (
        <Section titre="Hébergement">
          <p>{BOUTIQUE.hebergeur}</p>
        </Section>
      )}
      <Section titre="Propriété intellectuelle">
        <p>Les textes, logos et photos présents sur ce site appartiennent à {BOUTIQUE.raisonSociale} ou à leurs titulaires respectifs. Toute reproduction sans accord préalable est interdite. Les marques citées appartiennent à leurs propriétaires.</p>
      </Section>
    </PageInfo>
  );
}
