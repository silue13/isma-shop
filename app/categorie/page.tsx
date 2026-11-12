import { redirect } from "next/navigation";

export const instant = false;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  redirect(id ? `/categorie/${id}` : "/");
}