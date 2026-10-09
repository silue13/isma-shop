// Le client se connecte avec son numéro : on en fait un e-mail interne.
export const DOMAINE = "gmail.com";

export function nettoyerNumero(saisie: string): string {
  let n = saisie.replace(/\D/g, "");
  if (n.startsWith("225") && n.length > 10) n = n.slice(3);
  return n;
}

export function emailDepuisNumero(saisie: string): string {
  return `${nettoyerNumero(saisie)}@${DOMAINE}`;
}