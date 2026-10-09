// Le client se connecte avec son nom ou surnom : on en fait un e-mail interne.
export const DOMAINE = "isma-store.com";

export function nettoyerNumero(saisie: string): string {
  let n = saisie.replace(/\D/g, "");
  if (n.startsWith("225") && n.length > 10) n = n.slice(3);
  return n;
}

// Transforme le nom en identifiant simple : sans accents, sans majuscules.
export function slugNom(nom: string): string {
  return nom
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 50);
}

export function emailDepuisNom(nom: string): string {
  return `${slugNom(nom)}@${DOMAINE}`;
}