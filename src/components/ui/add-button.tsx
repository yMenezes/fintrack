import { Plus } from 'lucide-react'

type Props = {
  label:   string
  onClick: () => void
}

export function AddButton({ label, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground w-full"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-dashed border-border">
        <Plus className="h-4 w-4" />
      </div>
      {label}
    </button>
  )
}