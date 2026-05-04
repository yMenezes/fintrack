'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  List,
  CalendarRange,
  CreditCard,
  Repeat,
  Tag,
  Users,
  Settings,
  LogOut,
  TrendingUp,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const navSections = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard',       label: 'Dashboard',      icon: LayoutDashboard },
      { href: '/transactions',     label: 'Lançamentos',    icon: List            },
      { href: '/recurring',       label: 'Recorrências',   icon: Repeat          },
      { href: '/invoices',         label: 'Fatura mensal',  icon: CalendarRange   },
      { href: '/cards',           label: 'Cartões',        icon: CreditCard      },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { href: '/categories', label: 'Categorias', icon: Tag   },
      { href: '/people',    label: 'Pessoas',    icon: Users },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/settings', label: 'Configurações', icon: Settings },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="flex h-full w-[220px] flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-[18px]">
        <Image src="/favicon-32.svg" alt="FinanceControl" width={32} height={32}/>
        <div className="flex flex-col leading-tight">
          <span className="text-[14px] font-medium">Finance Control</span>
          <span className="text-[10px] text-muted-foreground">by Menezes Tech Solutions</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="px-2 pb-1 pt-3 text-[10px] uppercase tracking-widest text-muted-foreground">
              {section.label}
            </p>
            {section.items.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-600 dark:text-emerald-200'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <Icon className="h-[15px] w-[15px] shrink-0" />
                  {label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Sign out */}
      <div className="border-t border-border p-2">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOut className="h-[15px] w-[15px] shrink-0" />
          Sair
        </button>
      </div>
    </aside>
  )
}