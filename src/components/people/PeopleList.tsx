'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, User, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Person } from '@/types/database'
import { PeopleFormDialog } from './PeopleFormDialog'
import { Button } from '@/components/ui/button'
import { AddButton } from '@/components/ui/add-button'
import { DeleteDialog } from '@/components/ui/delete-dialog'
import { deletePerson } from '@/lib/actions/people'

type PaginationResponse = {
  data: Person[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

export function PeopleList() {
  const router = useRouter()
  const [formOpen, setFormOpen]         = useState(false)
  const [editPerson, setEditPerson]     = useState<Person | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null)
  const [page, setPage]                  = useState(1)
  const [people, setPeople]              = useState<Person[]>([])
  const [pagination, setPagination]      = useState({ page: 1, limit: 10, total: 0, hasMore: false })
  const [loading, setLoading]            = useState(true)

  useEffect(() => {
    fetchPeople()
  }, [page])

  async function fetchPeople() {
    setLoading(true)
    try {
      const res = await fetch(`/api/people?page=${page}&limit=10`)
      const data: PaginationResponse = await res.json()
      setPeople(data.data)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching people:', error)
    } finally {
      setLoading(false)
    }
  }

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
    setPage(1)
    await fetchPeople()
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Add Button - Always Visible at Top */}
        <AddButton label="Adicionar pessoa" onClick={openCreate} />

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-sm text-muted-foreground">Carregando...</span>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {people.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Nenhuma pessoa encontrada</p>
                </div>
              ) : (
                people.map(person => (
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
                ))
              )}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between gap-4 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>

              <div className="text-xs text-muted-foreground">
                Página {pagination.page} de {Math.ceil(pagination.total / pagination.limit) || 1}
                {pagination.total > 0 && ` · ${pagination.total} total`}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={!pagination.hasMore || loading}
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        )}
      </div>

      <PeopleFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        person={editPerson}
        onSaved={() => {
          setPage(1);
          fetchPeople();
        }}
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