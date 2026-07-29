import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Finance Control',
    short_name: 'FinanceControl',
    description: 'Tenha controle total da sua vida financeira. Acompanhe faturas, parcelas e gastos em um único lugar.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#EFF6FF',
    theme_color: '#1D4ED8',
    icons: [
      { src: '/icon-192', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512', sizes: '512x512', type: 'image/png' },
    ],
  }
}
