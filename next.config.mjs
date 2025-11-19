/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  /**
   * Configuration Server Actions
   * Limite la taille des body requests pour les Server Actions (upload fichiers)
   */
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  
  /**
   * Headers de sécurité HTTP
   * Protège contre XSS, clickjacking, MIME sniffing, etc.
   */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Empêche l'affichage dans une iframe (protection clickjacking)
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Empêche le MIME type sniffing
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block', // Active la protection XSS du navigateur
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin', // Contrôle les informations envoyées dans Referer
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()', // Désactive les APIs sensibles
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://*.supabase.co; img-src 'self' data: https://*.supabase.co; style-src 'self' 'unsafe-inline'; font-src 'self' data:;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
