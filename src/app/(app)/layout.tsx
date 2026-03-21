import { Sidebar } from '@/components/layout/Sidebar'
import { Navbar } from '@/components/layout/Navbar'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar — visível apenas em desktop */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Coluna direita: navbar + conteúdo */}
      <div className="flex flex-1 flex-col min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}