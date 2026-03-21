'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, User } from 'lucide-react'
import { PeopleFormDialog } from './PeopleFormDialog'
import { Button } from '@/components/ui/button'
import { AddButton } from '@/components/ui/add-button'
import { DeleteDialog } from '@/components/ui/delete-dialog'
import { deletePerson } from '@/lib/actions/people'

type Person = {
  id:           string
  name:         string
  relationship: string | null
}

export function PeopleList({ people }: { people: Person[] }) {
  const router = useRouter()
  const [formOpen, setFormOpen]         = useState(false)
  const [editPerson, setEditPerson]     = useState<Person | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null)

  function openCreate() {
    setEditPerson(undefined)
    setFormOpen(true)
  }

  function openEdit(person: Person) {
    setEditPerson(person)
    setFormOpen(true)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deletePerson(deleteTarget.id)
    setDeleteTarget(null)
    router.refresh()
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {people.map(person => (
          <div
            key={person.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
          >
            {/* Avatar com inicial */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-medium">
              {person.name.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col min-w-0">
              <span className="text-sm font-medium">{person.name}</span>
              {person.relationship && (
                <span className="text-xs text-muted-foreground">{person.relationship}</span>
              )}
            </div>

            {/* Ações */}
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(person)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => setDeleteTarget(person)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}

        <AddButton label="Adicionar pessoa" onClick={openCreate} />
      </div>

      <PeopleFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        person={editPerson}
      />

      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir pessoa"
        description={
          <>
            Tem certeza que deseja excluir <strong>{deleteTarget?.name}</strong>?
            Transações vinculadas não serão afetadas.
          </>
        }
      />
    </>
  )
}