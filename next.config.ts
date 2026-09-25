import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : undefined;

const nextConfig: NextConfig = {
  experimental: {
    // El CSS de Tailwind es pequeño (~12 KB): va en un <style> del HTML y no bloquea el renderizado con otra petición.
    inlineCss: true,
  },
  images: {
    // Fotos de productos subidas desde el admin (bucket product-images de Supabase Storage).
    remotePatterns: supabaseHost ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }] : [],
  },
};

export default nextConfig;
