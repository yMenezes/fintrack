import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { CategoryList } from '@/components/categories/CategoryList'
import { CategoryListSkeleton } from '@/components/categories/CategoryListSkeleton'

export default async function CategoriesPage() {
  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .is('deleted_at', null)
    .order('name', { ascending: true })

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-lg font-medium">Categorias</h1>
      <Suspense fallback={<CategoryListSkeleton />}>
        <CategoryList categories={categories ?? []} />
      </Suspense>
    </div>
  )
}