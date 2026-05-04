import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from 'next-themes'
import "./globals.css";

// Inter é uma fonte do Google otimizada para interfaces digitais
// next/font/google faz o download automático e serve localmente — sem requisição externa
const inter = Inter({ subsets: ["latin"] });

// Metadata é usada pelo Next.js para gerar as tags <title> e <meta> do HTML
// Aparece na aba do browser e nos resultados de busca (SEO)
export const metadata: Metadata = {
  title: "Finance Control",
  description: "Tenha controle total da sua vida financeira. Acompanhe faturas, parcelas e gastos em um único lugar.",
  openGraph: {
    title: 'Finance Control',
    description: 'Tenha controle total da sua vida financeira. Acompanhe faturas, parcelas e gastos em um único lugar.',
    url: 'https://www.controllfinance.com.br',
    siteName: 'Finance Control',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: 'https://www.controllfinance.com.br/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Finance Control - Controle total da sua vida financeira',
      },
    ],
  },
  icons:{
    icon: '/favicon-32.svg'
  },
  
};

// Root Layout — envolve TODAS as páginas da aplicação
// É o único lugar onde ficam as tags <html> e <body>
// Qualquer coisa aqui aparece em todas as páginas: fontes, providers globais, etc.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
