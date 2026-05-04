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
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const navSections = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard',    label: 'Dashboard',     icon: LayoutDashboard },
      { href: '/transactions', label: 'Lançamentos',   icon: List            },
      { href: '/recurring',   label: 'Recorrências',  icon: Repeat          },
      { href: '/invoices',    label: 'Fatura mensal', icon: CalendarRange   },
      { href: '/cards',       label: 'Cartões',       icon: CreditCard      },
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

type Props = {
  open: boolean
  onClose: () => void
}

export function MobileMenu({ open, onClose }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 md:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-card border-r border-border md:hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-[15px]">
          <div className="flex items-center gap-2.5">
            <Image src="/favicon-32.svg" alt="FinanceControl" width={26} height={26}/>
            <div className="flex flex-col leading-tight">
              <span className="text-[14px] font-medium">Finance Control</span>
              <span className="text-[10px] text-muted-foreground">by Menezes Tech Solutions</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-accent transition-colors"
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>
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
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
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
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <LogOut className="h-[15px] w-[15px] shrink-0" />
            Sair
          </button>
        </div>
      </aside>
    </>
  )
}
