// components/layout/Navbar.tsx
import { createClient } from '@/lib/supabase/server'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : '??'

  return (
    <header className="flex h-[52px] items-center gap-3 border-b border-border bg-card px-5">
      {/* Espaço reservado para o título da página — cada page.tsx injeta o seu */}
      <div className="flex-1" />

      <ThemeToggle />

      <Button size="sm" variant="outline" className="gap-1.5 text-xs">
        <Plus className="h-3.5 w-3.5" />
        Novo
      </Button>

      {/* Avatar com iniciais do usuário */}
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 select-none">
        {initials}
      </div>
    </header>
  )
}