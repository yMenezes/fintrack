"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import type { Category } from "@/types/database";
import { CategoryFormDialog } from "./CategoryFormDialog";
import { Button } from "@/components/ui/button";
import { AddButton } from "@/components/ui/add-button";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { deleteCategory } from "@/lib/actions/categories";

type PaginationResponse = {
  data: Category[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

export function CategoryList() {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, hasMore: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, [page]);

  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await fetch(`/api/categories?page=${page}&limit=10`);
      const data: PaginationResponse = await res.json();
      setCategories(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditCategory(undefined);
    setFormOpen(true);
  }

  function openEdit(category: Category) {
    setEditCategory(category);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteCategory(deleteTarget.id);
    setDeleteTarget(null);
    setPage(1);
    await fetchCategories();
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Add Button - Always Visible at Top */}
        <AddButton label="Adicionar categoria" onClick={openCreate} />

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-sm text-muted-foreground">Carregando...</span>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {categories.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Nenhuma categoria encontrada</p>
                </div>
              ) : (
                categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
                  >
                    {/* Ícone com cor da categoria */}
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg"
                      style={{ background: category.color + "22" }}
                    >
                      {category.icon}
                    </div>

                    {/* Nome */}
                    <span className="flex-1 text-sm font-medium">{category.name}</span>

                    {/* Bolinha de cor */}
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ background: category.color }}
                    />

                    {/* Ações */}
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(category)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(category)}
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

      <CategoryFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        category={editCategory}
        onSaved={() => {
          setPage(1);
          fetchCategories();
        }}
      />

      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir categoria"
        description={
          <>
            Tem certeza que deseja excluir <strong>{deleteTarget?.name}</strong>?
            Transações vinculadas não serão afetadas.
          </>
        }
      />
    </>
  );
}
