import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="flex items-end gap-3" aria-hidden>
        <div className="h-14 w-7 rounded-lg bg-blue-200 dark:bg-blue-900" />
        <div className="h-24 w-7 rounded-lg bg-blue-400 dark:bg-blue-700" />
        <div className="h-36 w-7 rounded-lg bg-blue-700 dark:bg-blue-500" />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-6xl font-bold tracking-tight">404</h1>
        <p className="text-lg font-medium">Página não encontrada</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          O link que você seguiu pode estar quebrado, ou a página pode ter sido movida ou removida.
        </p>
      </div>

      <Button asChild>
        <Link href="/dashboard">Voltar para o Dashboard</Link>
      </Button>
    </div>
  )
}
