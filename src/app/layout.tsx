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
  description: "Controle total da sua vida financeira em um só lugar",
  icons:{
    icon: '/financecontrol-favicon.svg'
  }
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
