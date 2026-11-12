export default function robots() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/compte", "/panier"] },
    sitemap: `${site}/sitemap.xml`,
  };
}
