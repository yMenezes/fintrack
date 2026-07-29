import { ContasTabs } from '@/components/contas/ContasTabs'
import { ContasList } from '@/components/contas/ContasList'

type SearchParams = {
  status?: string
}

export default function ContasPage({ searchParams }: { searchParams: SearchParams }) {
  const status = searchParams.status === 'done' ? 'done' : 'pending'

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-2 text-lg font-medium">Contas</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Contas a pagar e a receber, com data de vencimento e status de pagamento.
      </p>

      <ContasTabs status={status} />
      <ContasList status={status} />
    </div>
  )
}
