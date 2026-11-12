import { redirect } from "next/navigation";
import { slugifier } from "../boutique";

export const instant = false;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ nom?: string }>;
}) {
  const { nom } = await searchParams;
  redirect(nom ? `/marque/${slugifier(nom)}` : "/");
}